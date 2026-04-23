// components/PivotCanvas.tsx
'use client';
import { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export default function PivotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(7);
  const [b, setB] = useState(8);
  const [bones, setBones] = useState(420);
  const [combo, setCombo] = useState(1);

  const WIDTH = 1200;
  const HEIGHT = 700;
  const RULER_Y = 520;
  const PIVOT_Y = 180;
  const LEFT_PIVOT_X = 150;
  const RIGHT_PIVOT_X = 1050;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let dragging: 'left' | 'right' | null = null;

    function draw() {
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

      const pointerLeftX = 100 + (a * 83.33);
      const pointerRightX = 100 + (b * 83.33);

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

      const product = a * b;
      const interX = (LEFT_PIVOT_X * (RIGHT_PIVOT_X - pointerLeftX) + RIGHT_PIVOT_X * (pointerRightX - LEFT_PIVOT_X)) / (RIGHT_PIVOT_X - LEFT_PIVOT_X + pointerRightX - pointerLeftX);
      const interY = PIVOT_Y + (RULER_Y - PIVOT_Y) * 0.45;

      ctx.shadowBlur = 60;
      ctx.shadowColor = '#ffff00';
      ctx.fillStyle = '#111111';
      ctx.fillRect(interX - 65, interY - 55, 130, 90);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 8;
      ctx.strokeRect(interX - 65, interY - 55, 130, 90);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 62px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(product.toString(), interX, interY + 22);

      if (Math.random() < 0.05) {
        confetti({ particleCount: 5, spread: 20, origin: { x: interX / WIDTH, y: interY / HEIGHT } });
      }

      requestAnimationFrame(draw);
    }

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pointerLeftX = 100 + (a * 83.33);
      const pointerRightX = 100 + (b * 83.33);
      if (Math.abs(x - pointerLeftX) < 50) dragging = 'left';
      else if (Math.abs(x - pointerRightX) < 50) dragging = 'right';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(100, Math.min(1100, x));
      const unit = Math.round((x - 100) / 83.33);
      const clamped = Math.max(1, Math.min(12, unit));
      if (dragging === 'left') setA(clamped);
      else setB(clamped);
    };

    const handlePointerUp = () => {
      if (dragging) {
        const newBones = bones + 10 * combo;
        setBones(newBones);
        setCombo(Math.min(combo + 1, 4));
        confetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.6 } });
      }
      dragging = null;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [a, b, bones, combo]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="border border-[#00ffcc]/30 rounded-3xl shadow-2xl shadow-[#00ffcc]/20" />
      <div className="absolute top-8 left-8 bg-black/70 px-6 py-3 rounded-2xl text-3xl font-bold text-[#ffff00] flex items-center gap-3">
        🐼💀 BONES: <span className="text-[#00ffcc]">{bones}</span>
        <span className="text-2xl">×{combo}</span>
      </div>
    </div>
  );
}
