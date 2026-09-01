import React, { useEffect, useState } from 'react';
import { Home, Play, RotateCcw, Volume2, VolumeX, Music, Pause, ShieldCheck, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import { sounds } from '../services/audio';
import {
  MAX_CAR_SPEED,
  MAX_TRAFFIC_DENSITY,
  MIN_CAR_GAP,
  MIN_REACTION_TIME,
  MIN_SAFE_ZONE_WIDTH,
  MIN_VALID_PATH_WIDTH,
} from '../game/procedural';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  currentSeed?: string;
  onSetSeed?: (seed: string) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
  currentSeed = '',
  onSetSeed,
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const [seedInput, setSeedInput] = useState(currentSeed);

  // Support desktop Escape key to unpause/resume while modal is mounted
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        sounds.playButtonClick();
        onResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onResume]);

  const handleAction = (cb: () => void) => {
    sounds.playButtonClick();
    cb();
  };

  const handleApplySeed = () => {
    sounds.playButtonClick();
    if (onSetSeed) {
      onSetSeed(seedInput.trim());
    }
    onRestart();
  };

  const handleRandomSeed = () => {
    sounds.playButtonClick();
    const newSeed = `SEED_${Math.floor(Math.random() * 90000 + 10000)}`;
    setSeedInput(newSeed);
    if (onSetSeed) {
      onSetSeed(newSeed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-blue-950/75 backdrop-blur-md select-none font-sans animate-in fade-in duration-150 pt-safe pb-safe overflow-y-auto">
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white border-3 sm:border-4 border-blue-600 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 flex flex-col items-center text-center my-auto">
        {/* Pause Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-blue-600 border-3 border-blue-700 text-white flex items-center justify-center shadow-lg -mt-11 mb-2">
          <Pause className="w-6 h-6 stroke-[3]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight uppercase mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-4">
          Take a breath! Everything is frozen.
        </p>

        <div className="w-full space-y-2.5">
          {/* Resume Button */}
          <button
            id="btn-resume-game"
            type="button"
            onClick={() => handleAction(onResume)}
            className="btn-arcade w-full py-3.5 bg-green-500 hover:bg-green-400 active:bg-green-600 border-b-6 border-green-700 rounded-2xl font-black text-lg sm:text-xl text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-6 h-6 fill-white stroke-none" />
            <span>RESUME</span>
          </button>

          {/* Restart Button */}
          <button
            id="btn-pause-restart"
            type="button"
            onClick={() => handleAction(onRestart)}
            className="btn-arcade w-full py-3 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 border-b-6 border-yellow-700 rounded-2xl font-black text-sm sm:text-base text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>RESTART</span>
          </button>

          {/* Sound & Music Controls Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* SFX Toggle */}
            <button
              id="btn-pause-sound"
              type="button"
              onClick={() => {
                sounds.playButtonClick();
                onToggleSound();
              }}
              className="btn-arcade py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-2xl font-black text-xs text-slate-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-green-600 stroke-[2.5]" />
                  <span>SFX: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                  <span>SFX: OFF</span>
                </>
              )}
            </button>

            {/* Music Toggle */}
            <button
              id="btn-pause-music"
              type="button"
              onClick={() => {
                sounds.playButtonClick();
                onToggleMusic();
              }}
              className="btn-arcade py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-2xl font-black text-xs text-slate-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Music className={`w-4 h-4 stroke-[2.5] ${musicEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>MUSIC: {musicEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Main Menu Button */}
          <button
            id="btn-pause-mainmenu"
            type="button"
            onClick={() => handleAction(onMainMenu)}
            className="btn-arcade w-full py-2.5 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 border-b-4 border-blue-700 rounded-2xl font-black text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>MAIN MENU</span>
          </button>

          {/* Procedural Generation Fairness & Seed Inspector Toggle */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowDebug((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-600 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fairness & Seed Debug</span>
              </div>
              {showDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDebug && (
              <div className="mt-2 text-left bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2 text-[10px] text-slate-600 animate-in fade-in duration-100">
                {/* Seed Input */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">World Seed (Reproducible Runs):</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      placeholder="e.g. 12345 or TEST_SEED"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-mono text-[10px] focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleRandomSeed}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold"
                      title="Randomize Seed"
                    >
                      <Shuffle className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleApplySeed}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Guaranteed Fairness Parameters */}
                <div className="pt-1.5 border-t border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700">Fairness Guarantees:</div>
                  <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-500">
                    <div>• Min Car Gap: <b className="text-slate-700">{MIN_CAR_GAP}px</b></div>
                    <div>• Max Speed: <b className="text-slate-700">{MAX_CAR_SPEED}px/s</b></div>
                    <div>• Min Reaction: <b className="text-slate-700">{MIN_REACTION_TIME}s</b></div>
                    <div>• Max Density: <b className="text-slate-700">{MAX_TRAFFIC_DENSITY}/lane</b></div>
                    <div>• Safe Zone Width: <b className="text-slate-700">≥{MIN_SAFE_ZONE_WIDTH}</b></div>
                    <div>• Min Path Width: <b className="text-slate-700">≥{MIN_VALID_PATH_WIDTH}</b></div>
                  </div>
                  <div className="text-[8.5px] text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Every segment strictly validated for playable paths</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Hint */}
        <div className="mt-3 text-[10px] sm:text-[11px] font-bold text-slate-400 hidden sm:block">
          Press <kbd className="bg-slate-100 border border-slate-300 px-1 py-0.5 rounded font-mono text-slate-700 font-bold">ESC</kbd> to resume
        </div>
      </div>
    </div>
  );
};

