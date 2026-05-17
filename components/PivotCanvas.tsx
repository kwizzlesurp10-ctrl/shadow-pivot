// components/PivotCanvas.tsx
'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

export default function PivotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(7);
  const [b, setB] = useState(8);

  // Persistence: Load from localStorage
  const [bones, setBones] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shadow-pivot-bones');
      return saved ? parseInt(saved, 10) : 420;
    }
    return 420;
  });

  const [combo, setCombo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shadow-pivot-combo');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  // Raid Mode state (skeleton)
  const [raidMode, setRaidMode] = useState(false);

  const liveRegionRef = useRef<HTMLDivElement>(null);

  const aRef = useRef(a);
  const bRef = useRef(b);
  const bonesRef = useRef(bones);
  const comboRef = useRef(combo);
  const draggingRef = useRef<'left' | 'right' | null>(null);
  const prefersReducedMotionRef = useRef(false);

  const lastProductRef = useRef(56);
  const productPopRef = useRef(0);

  useEffect(() => { aRef.current = a; }, [a]);
  useEffect(() => { bRef.current = b; }, [b]);
  useEffect(() => { bonesRef.current = bones; }, [bones]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  // Persist bones and combo whenever they change
  useEffect(() => {
    localStorage.setItem('shadow-pivot-bones', bones.toString());
  }, [bones]);

  useEffect(() => {
    localStorage.setItem('shadow-pivot-combo', combo.toString());
  }, [combo]);

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

  const PRODUCT_BOX_WIDTH = 130;
  const PRODUCT_BOX_HEIGHT = 90;
  const MARGIN = 80;

  const announce = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      setTimeout(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = '';
      }, 1500);
    }
  };

  const getLineIntersection = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
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
      announce(`Factor updated. A: ${newA}, B: ${newB}. Product is now ${newA * newB}`);
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

      const intersection = getLineIntersection(
        LEFT_PIVOT_X, PIVOT_Y, pointerRightX, RULER_Y - 40,
        RIGHT_PIVOT_X, PIVOT_Y, pointerLeftX, RULER_Y - 40
      );

      let targetX = (LEFT_PIVOT_X + RIGHT_PIVOT_X) / 2;
      let targetY = PIVOT_Y + (RULER_Y - PIVOT_Y) * 0.42;

      if (intersection) {
        targetX = intersection.x;
        targetY = intersection.y;
      }

      const minX = MARGIN + PRODUCT_BOX_WIDTH / 2;
      const maxX = WIDTH - MARGIN - PRODUCT_BOX_WIDTH / 2;
      const minY = 120;
      const maxY = RULER_Y - 80;

      const interX = Math.max(minX, Math.min(maxX, targetX));
      const interY = Math.max(minY, Math.min(maxY, targetY));

      if (product !== lastProductRef.current) {
        productPopRef.current = 9;
        lastProductRef.current = product;
      }

      const popScale = productPopRef.current > 0
        ? 1 + (productPopRef.current / 9) * 0.22
        : 1;

      if (productPopRef.current > 0) productPopRef.current--;

      ctx.save();
      ctx.translate(interX, interY);
      ctx.scale(popScale, popScale);

      ctx.shadowBlur = 55;
      ctx.shadowColor = '#ffff00';
      ctx.fillStyle = '#111111';
      ctx.fillRect(-PRODUCT_BOX_WIDTH / 2, -PRODUCT_BOX_HEIGHT / 2, PRODUCT_BOX_WIDTH, PRODUCT_BOX_HEIGHT);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 7;
      ctx.strokeRect(-PRODUCT_BOX_WIDTH / 2, -PRODUCT_BOX_HEIGHT / 2, PRODUCT_BOX_WIDTH, PRODUCT_BOX_HEIGHT);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 58px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(product.toString(), 0, 18);

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

        // In Raid Mode, multiply bone rewards
        const multiplier = raidMode ? 2 : 1;
        const newBones = bonesRef.current + (10 * comboRef.current * multiplier);
        setBones(newBones);
        bonesRef.current = newBones;

        const newCombo = Math.min(comboRef.current + 1, 4);
        setCombo(newCombo);
        comboRef.current = newCombo;

        if (!prefersReducedMotionRef.current) {
          confetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.6 } });
        }

        const modeText = raidMode ? ' (Raid Mode!)' : '';
        announce(`Pivot complete${modeText}. Product is ${aRef.current * bRef.current}. Bones increased to ${newBones}. Combo x${newCombo}`);
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
  }, [raidMode]); // Re-run effect when raidMode changes so handlePointerUp has latest value

  // Simple Raid Mode toggle handler
  const toggleRaidMode = () => {
    const newMode = !raidMode;
    setRaidMode(newMode);
    announce(newMode ? 'Raid Mode activated! Bone rewards doubled.' : 'Raid Mode deactivated.');
  };

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

      {/* Bones + Combo Display */}
      <div className="absolute top-8 left-8 bg-black/70 px-6 py-3 rounded-2xl text-3xl font-bold text-[#ffff00] flex items-center gap-3">
        🐼💀 BONES: <span className="text-[#00ffcc]">{bones}</span>
        <span className="text-2xl">×{combo}</span>
      </div>

      {/* Raid Mode Toggle (Skeleton) */}
      <button
        onClick={toggleRaidMode}
        className={`absolute top-8 right-8 px-5 py-2 rounded-2xl text-sm font-bold transition-all active:scale-[0.985] border
          ${raidMode
            ? 'bg-[#ff3366] text-white border-[#ff3366] shadow-[0_0_20px_#ff3366]'
            : 'bg-black/70 text-[#ffcc00] border-[#ffcc00]/40 hover:border-[#ffcc00]'
          }`}
      >
        {raidMode ? '⚔️ RAID MODE ACTIVE' : '⚔️ Enter Raid Mode'}
      </button>

      {raidMode && (
        <div className="absolute top-20 right-8 text-[10px] text-[#ff3366] font-mono tracking-widest">
          2× BONE REWARDS
        </div>
      )}
    </div>
  );
}
