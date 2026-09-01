import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './GameHUD';
import { TouchControls } from './TouchControls';
import { GameEngine } from '../game/engine';
import { GameRenderer } from '../game/renderer';
import { DifficultyConfig, getDifficultyForDistance } from '../game/difficulty';
import { Direction, SkinId } from '../types';

interface GameCanvasProps {
  equippedSkin: SkinId;
  highScore: number;
  seed?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onGameOver: (finalScore: number, coinsInRun: number, reason: 'CAR' | 'WOLF') => void;
  onCoinCollected: (totalRunCoins: number) => void;
  onNewHighScore?: (newScore: number) => void;
  onPause: () => void;
  isPaused: boolean;
  isInputEnabled?: boolean; // Whether the game screen is active and modals are closed
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  equippedSkin,
  highScore,
  seed,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
  onGameOver,
  onCoinCollected,
  onNewHighScore,
  onPause,
  isPaused,
  isInputEnabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  const [currentScore, setCurrentScore] = useState(0);
  const [coinsInRun, setCoinsInRun] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [idleRatio, setIdleRatio] = useState(0);
  const [difficultyTier, setDifficultyTier] = useState<DifficultyConfig>(() => getDifficultyForDistance(0));
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const isDebugModeRef = useRef(false);

  // Swipe detection & gesture tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastMoveTimeRef = useRef<number>(0);

  // Active pressed keys set to track keydown & keyup accurately and prevent auto-repeat stutter
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const handleGameOverRef = useRef(onGameOver);
  handleGameOverRef.current = onGameOver;

  const handleCoinCollectedRef = useRef(onCoinCollected);
  handleCoinCollectedRef.current = onCoinCollected;

  const handleNewHighScoreRef = useRef(onNewHighScore);
  handleNewHighScoreRef.current = onNewHighScore;

  // Initialize engine once per run (GameCanvas lifecycle is controlled by key in App.tsx)
  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(isTouch);

    const engine = new GameEngine(equippedSkin, highScore, {
      onScoreUpdate: (score, coins, _maxDist, newRecordFlag) => {
        setCurrentScore(score);
        setCoinsInRun(coins);
        setIsNewRecord(newRecordFlag);
      },
      onGameOver: (finalScore, coins, reason) => {
        handleGameOverRef.current(finalScore, coins, reason);
      },
      onCoinCollected: (totalRun) => {
        setCoinsInRun(totalRun);
        handleCoinCollectedRef.current(totalRun);
      },
      onNewHighScore: (newScore) => {
        handleNewHighScoreRef.current?.(newScore);
      },
      onDifficultyChange: (tier) => {
        setDifficultyTier(tier);
      },
    });

    if (seed) {
      engine.setSeed(seed);
      engine.resetWorld();
    }

    engineRef.current = engine;

    return () => {
      engine.isRunning = false;
    };
  }, []); // Mount once per run - do NOT re-instantiate on highScore or prop changes!

  const prevIdleRatioRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Handle Pause state updates
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isPaused = isPaused;
    }
    if (!isPaused) {
      lastTimeRef.current = performance.now();
    }
  }, [isPaused]);

  // Move command helper with debounce lock to prevent double movement from both swipe & button
  const handleMove = useCallback(
    (dir: Direction) => {
      if (!isInputEnabled || isPaused) return;

      const now = performance.now();
      // Enforce a tight debounce window (40ms) to ignore accidental double-firing
      if (now - lastMoveTimeRef.current < 40) {
        return;
      }
      lastMoveTimeRef.current = now;

      if (engineRef.current) {
        engineRef.current.move(dir);
      }
    },
    [isInputEnabled, isPaused]
  );

  // Keyboard controls listener (Desktop WASD & Arrows)
  useEffect(() => {
    // If input is disabled (e.g., Shop, Main Menu, Game Over, How to Play modals open), ignore keyboard
    if (!isInputEnabled) {
      pressedKeysRef.current.clear();
      return;
    }

    const GAME_KEYS = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'KeyW',
      'KeyS',
      'KeyA',
      'KeyD',
      'Space',
      'KeyP',
      'Escape',
    ]);

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Prevent default browser page scrolling for gameplay keys (Arrow keys, Spacebar, etc.)
      if (GAME_KEYS.has(e.code)) {
        e.preventDefault();
      }

      // If paused, only handle unpause/resume keys
      if (isPaused) {
        if (e.code === 'KeyP' || e.code === 'Escape') {
          if (!e.repeat) {
            onPause();
          }
        }
        return;
      }

      // Handle debug monitor toggle (F3 or Backquote / Tilde)
      if (e.code === 'F3' || e.code === 'Backquote') {
        if (!e.repeat) {
          setIsDebugMode((prev) => {
            const next = !prev;
            isDebugModeRef.current = next;
            return next;
          });
        }
        return;
      }

      // Handle pause toggle
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (!e.repeat) {
          onPause();
        }
        return;
      }

      // Ignore auto-repeated keydown events from holding a key down (prevents abnormal rapid hopping)
      if (e.repeat) {
        return;
      }

      // Track key press state
      pressedKeysRef.current.add(e.code);

      // Check if vertical or horizontal keys are held for crisp directional movement
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          handleMove('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          handleMove('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          handleMove('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          handleMove('RIGHT');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) {
        e.preventDefault();
      }
      pressedKeysRef.current.delete(e.code);
    };

    const handleWindowBlur = () => {
      pressedKeysRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      pressedKeysRef.current.clear();
    };
  }, [handleMove, isInputEnabled, isPaused, onPause]);

  // Setup Canvas Renderer, High-DPI Scaling, and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);
    rendererRef.current = renderer;

    let animId: number;
    lastTimeRef.current = performance.now();
    let currentBufferWidth = 0;
    let currentBufferHeight = 0;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0); // Cap to 2.0 for mobile battery and memory optimization

      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);

      // Only resize buffer if dimensions actually changed
      if (targetW !== currentBufferWidth || targetH !== currentBufferHeight) {
        currentBufferWidth = targetW;
        currentBufferHeight = targetH;
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        ctx.scale(dpr, dpr);
        renderer.resize(rect.width, rect.height, dpr);
      }

      // Always synchronize engine's logical viewport bounds
      if (engineRef.current) {
        engineRef.current.setViewport(rect.width, rect.height);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    window.visualViewport?.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Background tab visibility handling: prevent delta time jump on tab return
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab moved to background
      } else {
        // Tab restored to foreground: reset timestamp so delta time doesn't explode
        lastTimeRef.current = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Main Game Loop
    const loop = (time: number) => {
      const rawDt = (time - lastTimeRef.current) * 0.001;
      lastTimeRef.current = time;

      // Clamp delta time: never simulate more than 50ms in a single frame
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      const engine = engineRef.current;
      if (engine && !engine.isPaused && !document.hidden) {
        engine.update(dt);

        const currentIdle = engine.getIdleWarningRatio();
        // Performance optimization: Decouple React state from high-frequency rAF loop
        // Only trigger React state updates when danger threshold is crossed or value steps significantly
        const roundedIdle = currentIdle <= 0 ? 0 : Math.round(currentIdle * 10) / 10;
        if (
          Math.abs(roundedIdle - prevIdleRatioRef.current) >= 0.1 ||
          (currentIdle > 0 && prevIdleRatioRef.current === 0) ||
          (currentIdle === 0 && prevIdleRatioRef.current > 0)
        ) {
          prevIdleRatioRef.current = roundedIdle;
          setIdleRatio(roundedIdle);
        }

        renderer.clear();
        renderer.render(
          engine.currentCameraX,
          engine.currentCameraY,
          engine.lanes,
          engine.player,
          engine.wolf,
          engine.particles,
          engine.floatingTexts,
          currentIdle,
          engine.coinsInRun,
          engine.screenShake,
          isDebugModeRef.current
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.visualViewport?.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Pointer & Swipe Event Handlers on Game Screen
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isInputEnabled || isPaused) return;
    // Only track primary pointer
    if (!e.isPrimary) return;
    e.preventDefault();

    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isInputEnabled || isPaused) return;
    if (!e.isPrimary || !touchStartRef.current) return;
    e.preventDefault();

    const start = touchStartRef.current;
    touchStartRef.current = null;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = performance.now() - start.time;
    const distance = Math.hypot(dx, dy);

    // 1. Quick tap -> Hop Forward (Move UP)
    // Ignore if held too long or moved beyond threshold
    if (distance < 14 && dt < 320) {
      handleMove('UP');
      return;
    }

    // 2. Swipe Gesture Recognition
    // Ignore tiny accidental swipes (must be >= 26px and reasonable speed)
    if (distance >= 26 && dt < 800) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        // Horizontal swipe: Left or Right
        if (dx > 0) {
          handleMove('RIGHT');
        } else {
          handleMove('LEFT');
        }
      } else {
        // Vertical swipe: Up or Down
        if (dy < 0) {
          handleMove('UP');
        } else {
          handleMove('DOWN');
        }
      }
    }
  };

  const handlePointerCancel = () => {
    touchStartRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-emerald-400 overflow-hidden select-none touch-none overscroll-none"
    >
      {/* Game Canvas with Pointer Events for Tap & Swipe */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="block w-full h-full cursor-pointer touch-none select-none overscroll-none"
      />

      {/* Heads-up Display */}
      <GameHUD
        score={currentScore}
        highScore={highScore}
        coinsInRun={coinsInRun}
        isNewRecord={isNewRecord}
        idleWarningRatio={idleRatio}
        difficultyTier={difficultyTier}
        onPause={onPause}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
      />

      {/* On-screen D-Pad Controls for one-handed mobile play */}
      <TouchControls onMove={handleMove} visible={isTouchDevice} />
    </div>
  );
};
