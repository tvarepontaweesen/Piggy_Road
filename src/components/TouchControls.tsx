import React, { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Direction } from '../types';

interface TouchControlsProps {
  onMove: (direction: Direction) => void;
  visible?: boolean;
}

const TouchControlsComponent: React.FC<TouchControlsProps> = ({ onMove, visible = true }) => {
  const [activeBtn, setActiveBtn] = useState<Direction | null>(null);

  if (!visible) return null;

  const handlePointerDown = (e: React.PointerEvent, dir: Direction) => {
    // Prevent default browser touch actions, scrolling, or gestures
    e.preventDefault();
    e.stopPropagation();

    setActiveBtn(dir);
    onMove(dir);

    // Haptic feedback for tactile feel on supported devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore if vibrator unavailable
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveBtn(null);
  };

  return (
    <div
      className="fixed bottom-3 sm:bottom-6 left-0 right-0 z-30 pointer-events-none flex justify-center px-3 pb-safe select-none"
      style={{ touchAction: 'none' }}
    >
      <div
        className="pointer-events-auto bg-white/95 backdrop-blur-md p-2.5 sm:p-3.5 rounded-3xl border-3 sm:border-4 border-blue-600 shadow-2xl flex flex-col items-center gap-1.5 sm:gap-2 select-none touch-none"
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Top Button: UP / FORWARD (Large hit area) */}
        <button
          id="touch-btn-up"
          type="button"
          onPointerDown={(e) => handlePointerDown(e, 'UP')}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Move Forward"
          className={`touch-control-btn w-20 sm:w-24 h-13 sm:h-15 bg-green-500 hover:bg-green-400 border-b-6 border-green-700 rounded-2xl flex items-center justify-center text-white shadow-lg focus:outline-none cursor-pointer ${
            activeBtn === 'UP' ? 'is-active bg-green-600' : ''
          }`}
        >
          <ArrowUp className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5]" />
        </button>

        {/* Middle Row (LEFT, DOWN, RIGHT) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* LEFT BUTTON */}
          <button
            id="touch-btn-left"
            type="button"
            onPointerDown={(e) => handlePointerDown(e, 'LEFT')}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Move Left"
            className={`touch-control-btn w-15 sm:w-18 h-12 sm:h-14 bg-yellow-500 hover:bg-yellow-400 border-b-6 border-yellow-700 rounded-2xl flex items-center justify-center text-white shadow-lg focus:outline-none cursor-pointer ${
              activeBtn === 'LEFT' ? 'is-active bg-yellow-600' : ''
            }`}
          >
            <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5]" />
          </button>

          {/* DOWN BUTTON */}
          <button
            id="touch-btn-down"
            type="button"
            onPointerDown={(e) => handlePointerDown(e, 'DOWN')}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Move Down"
            className={`touch-control-btn w-15 sm:w-18 h-12 sm:h-14 bg-yellow-500 hover:bg-yellow-400 border-b-6 border-yellow-700 rounded-2xl flex items-center justify-center text-white shadow-lg focus:outline-none cursor-pointer ${
              activeBtn === 'DOWN' ? 'is-active bg-yellow-600' : ''
            }`}
          >
            <ArrowDown className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5]" />
          </button>

          {/* RIGHT BUTTON */}
          <button
            id="touch-btn-right"
            type="button"
            onPointerDown={(e) => handlePointerDown(e, 'RIGHT')}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Move Right"
            className={`touch-control-btn w-15 sm:w-18 h-12 sm:h-14 bg-yellow-500 hover:bg-yellow-400 border-b-6 border-yellow-700 rounded-2xl flex items-center justify-center text-white shadow-lg focus:outline-none cursor-pointer ${
              activeBtn === 'RIGHT' ? 'is-active bg-yellow-600' : ''
            }`}
          >
            <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const TouchControls = React.memo(TouchControlsComponent);
