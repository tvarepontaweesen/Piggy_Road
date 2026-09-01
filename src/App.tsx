import React, { useEffect, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { ShopModal } from './components/ShopModal';
import { sounds } from './services/audio';
import {
  getStoredHighScore,
  getStoredMusicEnabled,
  getStoredSelectedSkin,
  getStoredSoundEnabled,
  getStoredTotalCoins,
  getStoredUnlockedSkins,
  saveGameData,
  setStoredHighScore,
  setStoredMusicEnabled,
  setStoredSelectedSkin,
  setStoredSoundEnabled,
  setStoredTotalCoins,
} from './services/storage';
import { GameState, SkinId } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [totalCoins, setTotalCoins] = useState<number>(getStoredTotalCoins);
  const [highScore, setHighScore] = useState<number>(getStoredHighScore);
  const [unlockedSkins, setUnlockedSkins] = useState<SkinId[]>(getStoredUnlockedSkins);
  const [equippedSkin, setEquippedSkin] = useState<SkinId>(getStoredSelectedSkin);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(getStoredSoundEnabled);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(getStoredMusicEnabled);

  // Current run stats
  const [lastRunScore, setLastRunScore] = useState<number>(0);
  const [lastRunCoins, setLastRunCoins] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [deathReason, setDeathReason] = useState<'CAR' | 'WOLF'>('CAR');

  // Key to force reset canvas instance when starting new game
  const [runId, setRunId] = useState<number>(1);
  const [customSeed, setCustomSeed] = useState<string>('');

  // Sync SFX sound mute state
  useEffect(() => {
    sounds.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Sync music enabled state & start/stop based on game state
  useEffect(() => {
    sounds.setMusicEnabled(musicEnabled);
    if (gameState === 'PLAYING' && musicEnabled) {
      sounds.startMusic();
    } else {
      sounds.stopMusic();
    }
  }, [musicEnabled, gameState]);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      setStoredSoundEnabled(next);
      return next;
    });
  };

  const handleToggleMusic = () => {
    setMusicEnabled((prev) => {
      const next = !prev;
      setStoredMusicEnabled(next);
      return next;
    });
  };

  const handlePlay = () => {
    setRunId((id) => id + 1);
    setIsNewHighScore(false);
    setGameState('PLAYING');
  };

  const handleRestart = () => {
    setRunId((id) => id + 1);
    setIsNewHighScore(false);
    setGameState('PLAYING');
  };

  const handleOpenShop = () => {
    setGameState('SHOP');
  };

  const handleOpenHowToPlay = () => {
    setGameState('HOW_TO_PLAY');
  };

  const handleCloseModal = () => {
    setGameState('MENU');
  };

  const handlePause = () => {
    setGameState('PAUSED');
  };

  const handleResume = () => {
    setGameState('PLAYING');
  };

  const handleMainMenu = () => {
    setGameState('MENU');
  };

  // Called during active game when coin is collected
  const handleCoinCollected = React.useCallback((_runCoins: number) => {
    setTotalCoins((prev) => {
      const newTotal = prev + 1;
      setStoredTotalCoins(newTotal);
      return newTotal;
    });
  }, []);

  // Called when game ends
  const handleGameOver = React.useCallback((finalScore: number, coinsInRun: number, reason: 'CAR' | 'WOLF') => {
    setLastRunScore(finalScore);
    setLastRunCoins(coinsInRun);
    setDeathReason(reason);

    setHighScore((prevBest) => {
      if (finalScore > prevBest) {
        setIsNewHighScore(true);
        setStoredHighScore(finalScore);
        sounds.playHighScore();
        return finalScore;
      } else {
        setIsNewHighScore(false);
        return prevBest;
      }
    });

    setGameState('GAME_OVER');
  }, []);

  // Skin Management
  const handleEquipSkin = (skinId: SkinId) => {
    setEquippedSkin(skinId);
    setStoredSelectedSkin(skinId);
  };

  const handleBuySkin = (skinId: SkinId, price: number): boolean => {
    if (unlockedSkins.includes(skinId)) return false; // Already owned!
    if (totalCoins < price) return false;

    const remainingCoins = Math.max(0, totalCoins - price);
    const newUnlocked = Array.from(new Set([...unlockedSkins, skinId]));

    setTotalCoins(remainingCoins);
    setUnlockedSkins(newUnlocked);
    setEquippedSkin(skinId);

    // Atomic batch save for consistent persistence
    saveGameData({
      totalCoins: remainingCoins,
      unlockedSkins: newUnlocked,
      equippedSkin: skinId,
    });

    sounds.playPurchase();
    return true;
  };

  return (
    <div className="relative w-full h-full max-w-full max-h-full overflow-hidden bg-slate-950 select-none">
      {/* 1. Main Menu View */}
      {gameState === 'MENU' && (
        <MainMenu
          onPlay={handlePlay}
          onOpenShop={handleOpenShop}
          onOpenHowToPlay={handleOpenHowToPlay}
          totalCoins={totalCoins}
          highScore={highScore}
          equippedSkin={equippedSkin}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          musicEnabled={musicEnabled}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* 2. Active Game View (Playing or Paused) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAME_OVER') && (
        <GameCanvas
          key={`canvas_run_${runId}_skin_${equippedSkin}_seed_${customSeed}`}
          equippedSkin={equippedSkin}
          highScore={highScore}
          seed={customSeed}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          musicEnabled={musicEnabled}
          onToggleMusic={handleToggleMusic}
          onGameOver={handleGameOver}
          onCoinCollected={handleCoinCollected}
          onNewHighScore={(newScore) => {
            setHighScore((prev) => {
              const best = Math.max(prev, newScore);
              setStoredHighScore(best);
              return best;
            });
            setIsNewHighScore(true);
          }}
          onPause={handlePause}
          isPaused={gameState === 'PAUSED'}
          isInputEnabled={gameState === 'PLAYING'}
        />
      )}

      {/* 3. How to Play Modal */}
      {gameState === 'HOW_TO_PLAY' && (
        <HowToPlayModal
          onClose={handleCloseModal}
          onStartPlaying={handlePlay}
        />
      )}

      {/* 4. Shop Modal */}
      {gameState === 'SHOP' && (
        <ShopModal
          totalCoins={totalCoins}
          unlockedSkins={unlockedSkins}
          equippedSkin={equippedSkin}
          onEquipSkin={handleEquipSkin}
          onBuySkin={handleBuySkin}
          onClose={handleCloseModal}
        />
      )}

      {/* 5. Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          musicEnabled={musicEnabled}
          onToggleMusic={handleToggleMusic}
          currentSeed={customSeed}
          onSetSeed={setCustomSeed}
        />
      )}

      {/* 6. Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          finalScore={lastRunScore}
          coinsInRun={lastRunCoins}
          totalCoins={totalCoins}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          deathReason={deathReason}
          equippedSkin={equippedSkin}
          onRestart={handleRestart}
          onOpenShop={handleOpenShop}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}

