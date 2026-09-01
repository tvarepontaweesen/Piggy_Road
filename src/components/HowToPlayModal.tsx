import React from 'react';
import { ArrowUp, Car, HelpCircle, Keyboard, ShieldAlert, Smartphone, X } from 'lucide-react';
import { sounds } from '../services/audio';

interface HowToPlayModalProps {
  onClose: () => void;
  onStartPlaying?: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, onStartPlaying }) => {
  const handleClose = () => {
    sounds.playButtonClick();
    onClose();
  };

  const handleStart = () => {
    sounds.playButtonClick();
    if (onStartPlaying) {
      onStartPlaying();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-blue-950/60 backdrop-blur-sm select-none pt-safe pb-safe">
      <div className="relative w-full max-w-xs sm:max-w-lg bg-white border-3 sm:border-4 border-blue-600 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-900 flex flex-col max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-blue-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-orange-500 border border-orange-600 flex items-center justify-center text-white shadow-md shrink-0">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight leading-none">
                HOW TO PLAY
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-blue-500 mt-0.5">
                Controls, gestures & survival guide
              </p>
            </div>
          </div>
          <button
            id="btn-close-how-to-play"
            type="button"
            onClick={handleClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Rule Items */}
        <div className="space-y-2.5 my-1 text-xs">
          {/* Rule 1: Desktop Keyboard Controls */}
          <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-2xl bg-blue-50/90 border-2 border-blue-200">
            <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-700 flex items-center justify-center shrink-0 text-white shadow-sm">
              <Keyboard className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1">
              <div className="font-black text-blue-950 text-xs sm:text-sm flex items-center justify-between">
                <span>Desktop Keyboard Controls</span>
                <span className="text-[9px] bg-blue-200 text-blue-900 font-black px-1.5 py-0.5 rounded">PC / MAC</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px] sm:text-xs">
                {/* Arrow Keys */}
                <div className="bg-white/80 border border-blue-200 rounded-xl p-1.5 space-y-1">
                  <div className="font-black text-blue-900 text-[10px] uppercase">Arrow Keys</div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className="bg-slate-100 border border-slate-300 px-1 rounded font-mono text-[10px]">▲ UP</span>
                    <span>Forward</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className="bg-slate-100 border border-slate-300 px-1 rounded font-mono text-[10px]">▼ DOWN</span>
                    <span>Back</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className="bg-slate-100 border border-slate-300 px-1 rounded font-mono text-[10px]">◀ / ▶</span>
                    <span>Left / Right</span>
                  </div>
                </div>

                {/* WASD Keys */}
                <div className="bg-white/80 border border-blue-200 rounded-xl p-1.5 space-y-1">
                  <div className="font-black text-blue-900 text-[10px] uppercase">WASD Keys</div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className="bg-slate-100 border border-slate-300 px-1.5 rounded font-mono text-[10px]">W</span>
                    <span>Forward</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className="bg-slate-100 border border-slate-300 px-1.5 rounded font-mono text-[10px]">S</span>
                    <span>Backward</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <span className="bg-slate-100 border border-slate-300 px-1 rounded font-mono text-[10px]">A / D</span>
                    <span>Left / Right</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-semibold text-blue-700 mt-1.5">
                💡 Press <strong>SPACE</strong> to hop forward, <strong>P</strong> or <strong>ESC</strong> to pause.
              </p>
            </div>
          </div>

          {/* Rule 2: Mobile & One-Handed Controls */}
          <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 border border-indigo-600 flex items-center justify-center shrink-0 text-white shadow-sm">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-black text-indigo-950 text-xs sm:text-sm">Mobile Gestures & Touch</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed mt-0.5">
                Play one-handed using the <strong>Bottom D-Pad (UP, DOWN, LEFT, RIGHT)</strong>, tap the screen to hop forward, or <strong>Swipe in any direction</strong>!
              </p>
            </div>
          </div>

          {/* Rule 3: Hop & Cross */}
          <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-2xl bg-green-50/80 border-2 border-green-200">
            <div className="w-9 h-9 rounded-xl bg-green-500 border border-green-600 flex items-center justify-center shrink-0 text-white shadow-sm">
              <ArrowUp className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <div className="font-black text-green-950 text-xs sm:text-sm">Hop Forward & Cross Lanes</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed mt-0.5">
                Every forward hop adds +1 to your score! Move across endless grass and asphalt roads.
              </p>
            </div>
          </div>

          {/* Rule 4: Dodge Traffic */}
          <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-2xl bg-red-50/80 border-2 border-red-200">
            <div className="w-9 h-9 rounded-xl bg-red-500 border border-red-600 flex items-center justify-center shrink-0 text-white shadow-sm">
              <Car className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-black text-red-950 text-xs sm:text-sm">Dodge Moving Traffic</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed mt-0.5">
                Watch out for sedans, sports cars, yellow taxis, and long city buses traveling at various speeds.
              </p>
            </div>
          </div>

          {/* Rule 5: Idle Wolf Danger */}
          <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-2xl bg-amber-50/80 border-2 border-amber-200">
            <div className="w-9 h-9 rounded-xl bg-amber-500 border border-amber-600 flex items-center justify-center shrink-0 text-white shadow-sm">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-black text-amber-950 text-xs sm:text-sm">Don't Wait! The Wolf is Hungry!</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed mt-0.5">
                Standing still for too long triggers an on-screen warning and summons the hungry wolf from behind.
              </p>
            </div>
          </div>

          {/* Rule 6: Collect Coins */}
          <div className="flex items-start gap-3 p-2.5 sm:p-3 rounded-2xl bg-yellow-50/80 border-2 border-yellow-300">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 border border-yellow-600 flex items-center justify-center shrink-0 text-yellow-950 shadow-sm font-black">
              ★
            </div>
            <div>
              <div className="font-black text-yellow-950 text-xs sm:text-sm">Collect Coins & Unlock Skins</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed mt-0.5">
                Gather gold coins (+5 bonus score each) to unlock cool piggy outfits in the Shop!
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-3 pt-2 border-t border-slate-200">
          <button
            id="btn-start-from-guide"
            type="button"
            onClick={handleStart}
            className="btn-arcade w-full py-3 bg-green-500 hover:bg-green-400 active:bg-green-600 border-b-4 border-green-700 rounded-2xl font-black text-base sm:text-lg text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>LET'S HOP!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
