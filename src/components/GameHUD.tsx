import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Pause, Sparkles, Trophy, Volume2, VolumeX, Music, Zap } from 'lucide-react';
import { sounds } from '../services/audio';
import { DifficultyConfig } from '../game/difficulty';

interface GameHUDProps {
  score: number;
  highScore: number;
  coinsInRun: number;
  isNewRecord: boolean;
  idleWarningRatio: number; // 0 to 1
  difficultyTier?: DifficultyConfig;
  onPause: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
}

const GameHUDComponent: React.FC<GameHUDProps> = ({
  score,
  highScore,
  coinsInRun,
  isNewRecord,
  idleWarningRatio,
  difficultyTier,
  onPause,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
}) => {
  // Smooth animated counter for score
  const [displayScore, setDisplayScore] = useState(score);
  const [isScorePopping, setIsScorePopping] = useState(false);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);
  const [showNewRecordBanner, setShowNewRecordBanner] = useState(false);
  const [stageTransitionText, setStageTransitionText] = useState<string | null>(null);
  const prevScoreRef = useRef(score);
  const prevTierNameRef = useRef<string | undefined>(difficultyTier?.name);

  // Stage transition banner animation
  useEffect(() => {
    if (difficultyTier && difficultyTier.name !== prevTierNameRef.current) {
      if (prevTierNameRef.current !== undefined) {
        setStageTransitionText(`⚡ ${difficultyTier.name.toUpperCase()}! 🚀`);
        const timer = setTimeout(() => setStageTransitionText(null), 2400);
        prevTierNameRef.current = difficultyTier.name;
        return () => clearTimeout(timer);
      }
      prevTierNameRef.current = difficultyTier.name;
    }
  }, [difficultyTier]);

  // Animate score counter smoothly
  useEffect(() => {
    let animFrame: number;
    const step = () => {
      setDisplayScore((current) => {
        if (current === score) return score;
        const diff = score - current;
        const increment = Math.max(1, Math.ceil(Math.abs(diff) * 0.3));
        return diff > 0 ? Math.min(score, current + increment) : Math.max(score, current - increment);
      });
      animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [score]);

  // Score increase pop animation
  const [isCoinPopping, setIsCoinPopping] = useState(false);
  const prevCoinsRef = useRef(coinsInRun);

  useEffect(() => {
    if (coinsInRun > prevCoinsRef.current) {
      setIsCoinPopping(true);
      const timer = setTimeout(() => setIsCoinPopping(false), 300);
      prevCoinsRef.current = coinsInRun;
      return () => clearTimeout(timer);
    }
    prevCoinsRef.current = coinsInRun;
  }, [coinsInRun]);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      const delta = score - prevScoreRef.current;
      setScoreDelta(delta);
      setIsScorePopping(true);

      const timer = setTimeout(() => {
        setIsScorePopping(false);
        setScoreDelta(null);
      }, 350);

      prevScoreRef.current = score;
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = score;
  }, [score]);

  // Handle New High Score Record Celebration Banner in HUD
  useEffect(() => {
    if (isNewRecord && highScore > 0) {
      setShowNewRecordBanner(true);
      const timer = setTimeout(() => {
        setShowNewRecordBanner(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isNewRecord, highScore]);

  // Format best score for display
  const currentBestDisplay = Math.max(score, highScore);

  return (
    <div
      id="game-hud-overlay"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 z-20 select-none"
    >
      {/* Top Main Status Bar */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-3">
        {/* Left: Current Score & Best Score & Stage Indicator */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink-0">
          {/* Main Current Score Badge */}
          <div className="relative flex items-center gap-1 sm:gap-2 bg-white/95 backdrop-blur-md px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-blue-600 shadow-lg">
            <span className="text-[10px] sm:text-xs font-black uppercase text-blue-600 tracking-wider">
              SCORE
            </span>
            <span
              className={`text-lg sm:text-2xl font-black tracking-tight transition-all duration-150 ${
                isScorePopping ? 'text-amber-600 scale-110' : 'text-blue-950'
              }`}
            >
              {displayScore}
            </span>

            {/* Score Increment Pop (+1 / +5) */}
            {scoreDelta !== null && (
              <div className="absolute -top-3 right-0.5 animate-score-float bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-600 text-amber-950 text-[9px] sm:text-xs font-black px-1.5 py-0.5 rounded-full shadow-md pointer-events-none">
                +{scoreDelta}
              </div>
            )}
          </div>

          {/* Best Score Badge */}
          <div
            className={`flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-3 shadow-lg transition-all ${
              isNewRecord && highScore > 0
                ? 'border-yellow-500 bg-yellow-50 text-amber-900 animate-pulse'
                : 'border-amber-400 text-slate-700'
            }`}
          >
            <Trophy
              className={`w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5] ${
                isNewRecord && highScore > 0 ? 'text-yellow-500 fill-yellow-400' : 'text-amber-500'
              }`}
            />
            <span className="text-[9px] sm:text-[11px] uppercase font-black tracking-wider text-amber-600 hidden min-[360px]:inline">
              Best
            </span>
            <span className="text-sm sm:text-lg font-black text-amber-950 tracking-tight">
              {currentBestDisplay}
            </span>
          </div>

          {/* Current Difficulty Stage Pill */}
          {difficultyTier && (
            <div className="hidden min-[480px]:flex items-center gap-1 bg-slate-900/90 text-white backdrop-blur-md px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-slate-700 shadow-lg">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-slate-200 truncate max-w-[90px] sm:max-w-[130px]">
                {difficultyTier.name}
              </span>
            </div>
          )}
        </div>

        {/* Center: Coin Counter */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-amber-500 shadow-lg pointer-events-auto transition-all duration-150 ${
            isCoinPopping ? 'scale-115 bg-yellow-50 border-yellow-400 shadow-xl' : ''
          }`}
        >
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center text-[10px] sm:text-xs font-black text-yellow-900 shadow-sm transition-transform ${
              isCoinPopping ? 'rotate-45 scale-120' : ''
            }`}
          >
            ★
          </div>
          <span className="text-sm sm:text-xl font-black text-amber-950">{coinsInRun}</span>
        </div>

        {/* Right: Controls (Music, Sound, Pause) */}
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
          <button
            id="btn-hud-music"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onToggleMusic();
            }}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/95 hover:bg-white active:scale-95 border-2 sm:border-3 border-blue-600 flex items-center justify-center shadow-lg transition-all cursor-pointer ${
              musicEnabled ? 'text-indigo-600' : 'text-slate-400 opacity-60'
            }`}
            title={musicEnabled ? 'Music: ON' : 'Music: OFF'}
          >
            <Music className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          <button
            id="btn-hud-sound"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onToggleSound();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/95 hover:bg-white active:scale-95 border-2 sm:border-3 border-blue-600 flex items-center justify-center text-blue-600 shadow-lg transition-all cursor-pointer"
            title={soundEnabled ? 'SFX: ON' : 'SFX: MUTED'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-rose-500 stroke-[2.5]" />
            )}
          </button>

          <button
            id="btn-hud-pause"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onPause();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/95 hover:bg-white active:scale-95 border-2 sm:border-3 border-blue-600 flex items-center justify-center text-blue-900 shadow-lg transition-all cursor-pointer"
            title="Pause Game"
          >
            <Pause className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Stage Transition Milestone Banner */}
      {stageTransitionText && (
        <div className="w-full max-w-xs sm:max-w-md mx-auto mt-2 pointer-events-none animate-bounce">
          <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 border-2 sm:border-3 border-white text-white rounded-2xl px-4 py-1.5 sm:py-2 shadow-2xl flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-spin" />
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase">
              {stageTransitionText}
            </span>
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-spin" />
          </div>
        </div>
      )}

      {/* Live "NEW BEST RECORD!" Celebration Dropdown */}
      {showNewRecordBanner && (
        <div className="w-full max-w-xs sm:max-w-sm mx-auto mt-2 pointer-events-none animate-bounce">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-2 sm:border-3 border-amber-600 rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-2xl flex items-center justify-center gap-1.5 sm:gap-2 text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-800 fill-amber-700 animate-spin" />
            <span className="text-[11px] sm:text-sm font-black tracking-wider uppercase">
              🎉 NEW BEST RECORD! ({score})
            </span>
            <Sparkles className="w-4 h-4 text-amber-800 fill-amber-700 animate-spin" />
          </div>
        </div>
      )}

      {/* Center Top Alert: Idle Wolf Danger Warning! */}
      {idleWarningRatio > 0 && (
        <div className="w-full max-w-xs sm:max-w-sm mx-auto mb-auto mt-2 sm:mt-3 px-2 sm:px-4 pointer-events-none animate-wolf-pulse">
          <div className="bg-rose-500 border-3 sm:border-4 border-yellow-300 rounded-2xl p-2 sm:p-3 shadow-2xl flex items-center gap-2.5 text-white">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-700 border-2 border-white/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-yellow-200 truncate">
                ⚠️ KEEP MOVING!
              </div>
              <div className="text-[10px] sm:text-[11px] font-black text-white leading-tight">
                {idleWarningRatio > 0.6
                  ? '🐺 WOLF INCOMING! HOP NOW!'
                  : "Don't stop! The world is advancing!"}
              </div>
              {/* Danger progress bar */}
              <div className="w-full h-1.5 sm:h-2 bg-rose-900/80 rounded-full mt-1 sm:mt-1.5 overflow-hidden border border-rose-950">
                <div
                  className="h-full bg-yellow-300 transition-all duration-100 rounded-full"
                  style={{ width: `${Math.round(idleWarningRatio * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GameHUD = React.memo(GameHUDComponent);
