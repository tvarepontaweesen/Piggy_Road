import React from 'react';
import { Play, ShoppingBag, HelpCircle, Volume2, VolumeX, Music, Sparkles } from 'lucide-react';
import { PigCharacterPreview } from './PigCharacterPreview';
import { SKINS } from '../game/constants';
import { sounds } from '../services/audio';
import { SkinId } from '../types';

interface MainMenuProps {
  onPlay: () => void;
  onOpenShop: () => void;
  onOpenHowToPlay: () => void;
  totalCoins: number;
  highScore: number;
  equippedSkin: SkinId;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onOpenShop,
  onOpenHowToPlay,
  totalCoins,
  highScore,
  equippedSkin,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
}) => {
  const currentSkin = SKINS[equippedSkin] || SKINS.classic;

  const handleAction = (cb: () => void) => {
    sounds.playButtonClick();
    cb();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-4 md:p-6 bg-[#60A5FA] text-slate-900 overflow-hidden select-none font-sans pt-safe pb-safe">
      {/* Vibrant Dot Grid Overlay */}
      <div className="absolute inset-0 bg-vibrant-dots opacity-20 pointer-events-none" />

      {/* Top Header Bar: Coins, High Score & Sound/Music controls */}
      <header className="w-full max-w-2xl flex items-center justify-between z-10 pt-1 px-1 sm:px-2">
        {/* Coin Counter Pill */}
        <div className="bg-white/95 backdrop-blur-md rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 shadow-xl border-3 sm:border-4 border-blue-600 flex items-center gap-1.5 sm:gap-2.5">
          <div className="w-5 h-5 sm:w-7 sm:h-7 bg-yellow-400 rounded-full border border-yellow-600 flex items-center justify-center text-yellow-900 font-black text-xs sm:text-sm shadow-sm">
            ★
          </div>
          <span className="text-blue-950 font-black text-base sm:text-xl md:text-2xl tracking-tight">
            {totalCoins.toLocaleString()}
          </span>
        </div>

        {/* Best Score Pill */}
        <div className="bg-white/95 backdrop-blur-md rounded-full px-3 sm:px-4 md:px-5 py-1 sm:py-1.5 shadow-xl border-3 sm:border-4 border-blue-600 flex flex-col items-center justify-center">
          <span className="text-blue-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">
            Best Score
          </span>
          <span className="text-blue-950 font-black text-base sm:text-xl md:text-2xl tracking-tight leading-tight">
            {highScore}
          </span>
        </div>

        {/* Audio Controls (Sound FX & Music) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Music Toggle */}
          <button
            id="btn-music-toggle"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onToggleMusic();
            }}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white active:scale-95 border-3 sm:border-4 border-blue-600 flex items-center justify-center transition-all shadow-xl cursor-pointer ${
              musicEnabled ? 'text-indigo-600' : 'text-slate-400 opacity-60'
            }`}
            title={musicEnabled ? 'Music: ON' : 'Music: OFF'}
          >
            <Music className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Sound FX Toggle */}
          <button
            id="btn-sound-toggle"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onToggleSound();
            }}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white active:scale-95 border-3 sm:border-4 border-blue-600 flex items-center justify-center text-blue-600 transition-all shadow-xl cursor-pointer"
            title={soundEnabled ? 'SFX: ON' : 'SFX: MUTED'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 stroke-[2.5]" />
            )}
          </button>
        </div>
      </header>

      {/* Center Section: Logo & Interactive Pig Stage */}
      <main className="w-full max-w-md flex flex-col items-center justify-center my-auto z-10 text-center relative py-1 sm:py-2">
        {/* Game Title with 3D arcade pop typography */}
        <div className="mb-2 sm:mb-4 relative">
          <div className="absolute -top-3 -left-3 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-300 rounded-full blur-xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-2 -right-3 w-14 h-14 sm:w-20 sm:h-20 bg-amber-400 rounded-full blur-xl opacity-40 pointer-events-none" />

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase select-none leading-none">
            <span className="text-white drop-shadow-[0_6px_0_rgba(30,58,138,1)] sm:drop-shadow-[0_8px_0_rgba(30,58,138,1)] block">
              PIGGY
            </span>
            <span className="text-yellow-300 drop-shadow-[0_6px_0_rgba(180,83,9,1)] sm:drop-shadow-[0_8px_0_rgba(180,83,9,1)] block -mt-1 sm:-mt-2">
              ROAD
            </span>
          </h1>
        </div>

        {/* Character Card / Preview Stage */}
        <div
          onClick={() => handleAction(onOpenShop)}
          className="group relative cursor-pointer my-2 sm:my-4 w-36 h-36 sm:w-46 sm:h-46 bg-[#FEE2E2] rounded-[36px] sm:rounded-[48px] border-5 sm:border-8 border-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          title="Click to visit Shop & change skin"
        >
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400 text-amber-950 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-600 shadow-sm z-10">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>SKIN</span>
          </div>

          <PigCharacterPreview skinId={equippedSkin} size={95} animate={true} />

          {/* Skin Name Badge Pill */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-full border-2 sm:border-3 border-blue-600 font-black text-blue-600 text-[10px] sm:text-xs tracking-wider uppercase shadow-lg whitespace-nowrap group-hover:bg-blue-50 transition-colors">
            {currentSkin.name}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xs flex flex-col gap-2.5 sm:gap-3.5 mt-3 sm:mt-5">
          {/* Start Game Button */}
          <button
            id="btn-play-game"
            type="button"
            onClick={() => handleAction(onPlay)}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 bg-green-500 hover:bg-green-400 active:bg-green-600 border-b-6 sm:border-b-8 border-green-700 rounded-2xl text-white text-xl sm:text-2xl md:text-3xl font-black shadow-xl transform active:translate-y-1 active:border-b-3 transition-all uppercase tracking-widest flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white stroke-none" />
            <span>START GAME</span>
          </button>

          {/* Secondary Buttons (Shop & Rules) */}
          <div className="flex gap-2.5 sm:gap-3 w-full">
            <button
              id="btn-open-shop"
              type="button"
              onClick={() => handleAction(onOpenShop)}
              className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 border-b-4 sm:border-b-6 border-yellow-700 rounded-2xl text-white text-sm sm:text-base md:text-lg font-black shadow-xl uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transform active:translate-y-1 active:border-b-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>SHOP</span>
            </button>

            <button
              id="btn-open-how-to-play"
              type="button"
              onClick={() => handleAction(onOpenHowToPlay)}
              className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 border-b-4 sm:border-b-6 border-orange-700 rounded-2xl text-white text-sm sm:text-base md:text-lg font-black shadow-xl uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transform active:translate-y-1 active:border-b-2 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>RULES</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Cartoon Landscape Ground Teaser */}
      <footer className="w-full max-w-lg z-10 pt-1 pb-1 flex items-center justify-between px-1 sm:px-2 text-xs font-bold text-white/90">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-900/40 backdrop-blur-sm px-3 py-1 sm:py-1.5 rounded-full border border-white/30 shadow-md">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400 animate-ping" />
          <span className="text-[10px] sm:text-xs">⚠️ Don't stop too long... the wolf is hungry!</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 opacity-75 text-[11px]">
          <span>Controls:</span>
          <span className="bg-white/30 px-1.5 py-0.5 rounded text-white font-mono">Tap/D-Pad</span>
          <span>or</span>
          <span className="bg-white/30 px-1.5 py-0.5 rounded text-white font-mono">Swipe</span>
        </div>
      </footer>
    </div>
  );
};
