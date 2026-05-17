// components/PivotCanvas.tsx
'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

export default function PivotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(7);
  const [b, setB] = useState(8);
  const [bones, setBones] = useState(420);
  const [combo, setCombo] = useState(1);

  const liveRegionRef = useRef<HTMLDivElement>(null);

  const aRef = useRef(a);
  const bRef = useRef(b);
  const bonesRef = useRef(bones);
  const comboRef = useRef(combo);
  const draggingRef = useRef<'left' | 'right' | null>(null);
  const prefersReducedMotionRef = useRef(false);

  // For subtle product pop animation
  const lastProductRef = useRef(56);
  const productPopRef = useRef(0); // frame counter for pop effect

  useEffect(() => { aRef.current = a; }, [a]);
  useEffect(() => { bRef.current = b; }, [b]);
  useEffect(() => { bonesRef.current = bones; }, [bones]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotionRef.current = mediaQuery.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const WIDTH = 1200;
  const HEIGHT = 700;
  const RULER_Y = 520;
  const PIVOT_Y = 180;
  const LEFT_PIVOT_X = 150;
  const RIGHT_PIVOT_X = 1050;

  const announce = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      setTimeout(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = '';
      }, 1500);
    }
  };

  // Simple line intersection helper (for better product positioning)
  const getLineIntersection = (
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
  ) => {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return null; // parallel lines

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const ix = x1 + t * (x2 - x1);
    const iy = y1 + t * (y2 - y1);
    return { x: ix, y: iy };
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let changed = false;
    let newA = aRef.current;
    let newB = bRef.current;

    switch (e.key) {
      case 'ArrowLeft': newA = Math.max(1, aRef.current - 1); aRef.current = newA; changed = true; break;
      case 'ArrowRight': newA = Math.min(12, aRef.current + 1); aRef.current = newA; changed = true; break;
      case 'ArrowUp': newB = Math.min(12, bRef.current + 1); bRef.current = newB; changed = true; break;
      case 'ArrowDown': newB = Math.max(1, bRef.current - 1); bRef.current = newB; changed = true; break;
      default: return;
    }

    if (changed) {
      e.preventDefault();
      setA(newA);
      setB(newB);
      const product = newA * newB;
      announce(`Factor updated. A: ${newA}, B: ${newB}. Product is now ${product}`);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let rafId: number;

    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      grad.addColorStop(0, '#1a1a1a');
      grad.addColorStop(1, '#0f0a05');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = '#22ff88';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(100, RULER_Y);
      ctx.lineTo(1100, RULER_Y);
      ctx.stroke();

      for (let i = 1; i <= 12; i++) {
        const x = 100 + (i * 83.33);
        ctx.fillStyle = '#22ff88';
        ctx.fillRect(x - 2, RULER_Y - 30, 4, 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(i.toString(), x - 10, RULER_Y + 55);
      }

      ctx.fillStyle = '#ff0033';
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ff0033';
      ctx.fillRect(LEFT_PIVOT_X - 18, PIVOT_Y - 18, 36, 36);
      ctx.fillRect(RIGHT_PIVOT_X - 18, PIVOT_Y - 18, 36, 36);

      const pointerLeftX = 100 + (aRef.current * 83.33);
      const pointerRightX = 100 + (bRef.current * 83.33);

      ctx.shadowBlur = 30;
      ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#00ffff';
      ctx.beginPath(); ctx.arc(pointerLeftX, RULER_Y - 40, 28, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pointerRightX, RULER_Y - 40, 28, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 14;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(LEFT_PIVOT_X, PIVOT_Y);
      ctx.lineTo(pointerRightX, RULER_Y - 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(RIGHT_PIVOT_X, PIVOT_Y);
      ctx.lineTo(pointerLeftX, RULER_Y - 40);
      ctx.stroke();

      const product = aRef.current * bRef.current;

      // Calculate intersection of the two pivot lines for better visual metaphor
      const intersection = getLineIntersection(
        LEFT_PIVOT_X, PIVOT_Y, pointerRightX, RULER_Y - 40,
        RIGHT_PIVOT_X, PIVOT_Y, pointerLeftX, RULER_Y - 40
      );

      let interX = (LEFT_PIVOT_X + RIGHT_PIVOT_X) / 2;
      let interY = PIVOT_Y + (RULER_Y - PIVOT_Y) * 0.45;

      if (intersection) {
        interX = intersection.x;
        interY = intersection.y;
      }

      // Subtle product pop animation
      if (product !== lastProductRef.current) {
        productPopRef.current = 10; // start pop (10 frames)
        lastProductRef.current = product;
      }

      const popScale = productPopRef.current > 0 
        ? 1 + (productPopRef.current / 10) * 0.25 
        : 1;

      if (productPopRef.current > 0) productPopRef.current--;

      // Draw product box with pop scale
      ctx.save();
      ctx.translate(interX, interY);
      ctx.scale(popScale, popScale);

      ctx.shadowBlur = 60;
      ctx.shadowColor = '#ffff00';
      ctx.fillStyle = '#111111';
      ctx.fillRect(-65, -55, 130, 90);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 8;
      ctx.strokeRect(-65, -55, 130, 90);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 62px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(product.toString(), 0, 22);

      ctx.restore();

      rafId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pointerLeftX = 100 + (aRef.current * 83.33);
      const pointerRightX = 100 + (bRef.current * 83.33);
      if (Math.abs(x - pointerLeftX) < 50) draggingRef.current = 'left';
      else if (Math.abs(x - pointerRightX) < 50) draggingRef.current = 'right';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(100, Math.min(1100, x));
      const unit = Math.round((x - 100) / 83.33);
      const clamped = Math.max(1, Math.min(12, unit));
      if (draggingRef.current === 'left') {
        aRef.current = clamped;
      } else {
        bRef.current = clamped;
      }
    };

    const handlePointerUp = () => {
      if (draggingRef.current) {
        setA(aRef.current);
        setB(bRef.current);

        const newBones = bonesRef.current + 10 * comboRef.current;
        setBones(newBones);
        bonesRef.current = newBones;

        const newCombo = Math.min(comboRef.current + 1, 4);
        setCombo(newCombo);
        comboRef.current = newCombo;

        if (!prefersReducedMotionRef.current) {
          confetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.6 } });
        }

        announce(`Pivot complete. Product is ${aRef.current * bRef.current}. Bones increased to ${newBones}. Combo x${newCombo}`);
      }
      draggingRef.current = null;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  return (
    <div className="relative">
      <div className="mb-3 text-center text-sm text-[#00ffcc]/70 font-mono">
        Drag the cyan pointers • Arrow keys when focused • Release to earn Bones
      </div>

      <canvas
        ref={canvasRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="application"
        aria-label="Interactive multiplication pivot game. Use arrow keys or drag the cyan pointers."
        aria-describedby="game-instructions"
        className="border border-[#00ffcc]/30 rounded-3xl shadow-2xl shadow-[#00ffcc]/20 focus:outline-none focus:ring-2 focus:ring-[#00ffcc] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
      />

      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div id="game-instructions" className="sr-only">
        Use mouse, touch, or keyboard arrow keys to change the factors.
        Left/Right arrows adjust factor A. Up/Down arrows adjust factor B.
        The large yellow number shows the current product.
      </div>

      <div className="absolute top-8 left-8 bg-black/70 px-6 py-3 rounded-2xl text-3xl font-bold text-[#ffff00] flex items-center gap-3">
        🐼💀 BONES: <span className="text-[#00ffcc]">{bones}</span>
        <span className="text-2xl">×{combo}</span>
      </div>
    </div>
  );
}
