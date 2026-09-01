import React, { useEffect, useRef } from 'react';
import { SKINS } from '../game/constants';
import { GameRenderer } from '../game/renderer';
import { SkinId } from '../types';

interface PigCharacterPreviewProps {
  skinId: SkinId;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const PigCharacterPreview: React.FC<PigCharacterPreviewProps> = ({
  skinId,
  size = 100,
  className = '',
  animate = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);
    let animationFrameId: number;
    let startTime = performance.now();

    const renderLoop = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size / 2, size / 2 + 5);

      // Cute idle breathing / hover bounce
      const bounce = animate ? Math.sin(elapsed * 4) * 3 : 0;
      const scaleX = animate ? 1 + Math.sin(elapsed * 4) * 0.04 : 1;
      const scaleY = animate ? 1 - Math.sin(elapsed * 4) * 0.04 : 1;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 20, 22 * scaleX, 10 * scaleX, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(0, -bounce);
      ctx.scale(scaleX * (size / 85), scaleY * (size / 85));

      const skin = SKINS[skinId] || SKINS.classic;
      renderer.renderPigBody(skin);

      // Draw sparkle glints for Golden Pig
      if (skin.hasSparkles && animate) {
        ctx.fillStyle = '#fbbf24';
        const sparkleTime = elapsed * 3;
        for (let i = 0; i < 3; i++) {
          const sx = Math.cos(sparkleTime + i * 2) * 26;
          const sy = Math.sin(sparkleTime + i * 2) * 26;
          ctx.beginPath();
          ctx.arc(sx, sy, 2 + Math.sin(sparkleTime * 2 + i) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      if (animate) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop(performance.now());

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [skinId, size, animate]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="drop-shadow-sm"
        style={{ width: size, height: size }}
      />
    </div>
  );
};
