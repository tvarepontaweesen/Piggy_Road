import React, { useEffect } from 'react';
import { Home, RotateCcw, ShoppingBag, Sparkles, Trophy } from 'lucide-react';
import { PigCharacterPreview } from './PigCharacterPreview';
import { sounds } from '../services/audio';
import { SkinId } from '../types';

interface GameOverModalProps {
  finalScore: number;
  coinsInRun: number;
  totalCoins: number;
  highScore: number;
  isNewHighScore: boolean;
  deathReason?: 'CAR' | 'WOLF';
  equippedSkin: SkinId;
  onRestart: () => void;
  onOpenShop: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  finalScore,
  coinsInRun,
  totalCoins,
  highScore,
  isNewHighScore,
  deathReason,
  equippedSkin,
  onRestart,
  onOpenShop,
  onMainMenu,
}) => {
  useEffect(() => {
    if (isNewHighScore) {
      sounds.playHighScore();
    }
  }, [isNewHighScore]);

  const handleAction = (cb: () => void) => {
    sounds.playButtonClick();
    cb();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-blue-950/70 backdrop-blur-sm select-none pt-safe pb-safe">
      <div className="relative w-full max-w-xs sm:max-w-md bg-white border-3 sm:border-4 border-rose-500 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-900 flex flex-col items-center text-center max-h-[96vh] overflow-y-auto">
        {/* Death reason header & icon */}
        <div className="mb-1.5 sm:mb-2">
          {deathReason === 'WOLF' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-400 text-rose-800 text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-sm">
              🐺 Caught by the Hungry Wolf!
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-400 text-amber-900 text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-sm">
              💥 Oink! Hit by Traffic!
            </div>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight mb-1">GAME OVER</h2>

        {/* Character Stage */}
        <div className="my-1 p-1.5 bg-[#FEE2E2] rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-pink-200 shadow-inner">
          <PigCharacterPreview skinId={equippedSkin} size={70} animate={false} />
        </div>

        {/* New High Score Badge */}
        {isNewHighScore && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 border border-yellow-600 text-yellow-950 font-black text-xs sm:text-sm shadow-md mb-1.5 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 fill-yellow-950" />
            <span>NEW BEST RECORD!</span>
            <Sparkles className="w-3.5 h-3.5 fill-yellow-950" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2 my-2 sm:my-3">
          {/* Final Score */}
          <div className="bg-blue-50/80 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-blue-600 font-black">Score</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-950 mt-0.5">{finalScore}</span>
          </div>

          {/* High Score */}
          <div className="bg-amber-50/80 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-700 font-black flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-500 stroke-[2.5]" /> Best
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-0.5">{highScore}</span>
          </div>

          {/* Coins In Run */}
          <div className="bg-yellow-50/80 border-2 border-yellow-300 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-yellow-800 font-black">Run Coins</span>
            <span className="text-xl sm:text-2xl font-black text-yellow-900 mt-0.5 flex items-center gap-1">
              <span>+</span> {coinsInRun} <span className="text-xs">⭐</span>
            </span>
          </div>

          {/* Total Bank Coins */}
          <div className="bg-yellow-100/90 border-2 border-yellow-400 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-yellow-900 font-black">Total Coins</span>
            <span className="text-xl sm:text-2xl font-black text-yellow-950 mt-0.5 flex items-center gap-1">
              {totalCoins.toLocaleString()} <span className="text-xs">⭐</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 mt-1">
          <button
            id="btn-restart-game"
            type="button"
            onClick={() => handleAction(onRestart)}
            className="btn-arcade w-full py-3 sm:py-3.5 bg-green-500 hover:bg-green-400 active:bg-green-600 border-b-6 border-green-700 rounded-2xl font-black text-lg sm:text-xl text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            <span>PLAY AGAIN</span>
          </button>

          <div className="flex gap-2">
            <button
              id="btn-gameover-shop"
              type="button"
              onClick={() => handleAction(onOpenShop)}
              className="btn-arcade flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 border-b-4 border-yellow-700 rounded-2xl font-black text-white shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer uppercase tracking-wider"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>SHOP</span>
            </button>

            <button
              id="btn-gameover-menu"
              type="button"
              onClick={() => handleAction(onMainMenu)}
              className="btn-arcade flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 border-b-4 border-blue-700 rounded-2xl font-black text-white shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer uppercase tracking-wider"
            >
              <Home className="w-4 h-4 stroke-[2.5]" />
              <span>MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
