import { useEffect, useRef, useCallback, useState } from 'react';
import './ShipIntroAnimation.css';

interface ShipIntroAnimationProps {
  onComplete: () => void;
}

/* ── Constants ─────────────────────────────────────────────────────────── */
const ANIMATION_DURATION = 5000;       // 5 seconds hard cap
const DEFAULT_SPEED = 0.6;             // base ship speed (px/frame at 60fps)
const MAX_SCROLL_BOOST = 4.0;          // max multiplier from scroll
const SCROLL_DECAY = 0.92;             // how fast scroll boost decays
const FADE_OUT_MS = 800;
const LOW_FPS_THRESHOLD = 30;
const PERF_CHECK_MS = 500;

/* ── Wave Generator ────────────────────────────────────────────────────── */
function drawWaves(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  shipProgress: number,
) {
  const waterlineY = h * 0.62;
  const layers = [
    { y: waterlineY, amp: 8, freq: 0.008, speed: 0.6, color: 'rgba(14,116,144,0.85)' },
    { y: waterlineY + 18, amp: 6, freq: 0.012, speed: 0.9, color: 'rgba(8,145,178,0.75)' },
    { y: waterlineY + 34, amp: 5, freq: 0.015, speed: 1.2, color: 'rgba(6,182,212,0.7)' },
    { y: waterlineY + 48, amp: 4, freq: 0.02, speed: 1.5, color: 'rgba(22,78,99,0.8)' },
  ];

  for (const layer of layers) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 3) {
      const y =
        layer.y +
        Math.sin(x * layer.freq + time * layer.speed + shipProgress * 0.2) * layer.amp +
        Math.sin(x * layer.freq * 1.8 + time * layer.speed * 0.7) * (layer.amp * 0.4);
      if (x === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  }
}

/* ── Seabirds (replaced stars for dawn scene) ─────────────────────────── */
function drawSeabirds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  birds: { x: number; y: number; size: number; twinkleSpeed: number }[],
) {
  ctx.strokeStyle = 'rgba(30,41,59,0.25)';
  ctx.lineWidth = 1.5;
  // Draw only first 12 as birds
  for (let i = 0; i < Math.min(birds.length, 12); i++) {
    const bird = birds[i];
    const bx = ((bird.x * w + time * 20 * bird.twinkleSpeed) % (w + 100)) - 50;
    const by = bird.y * h * 0.45 + Math.sin(time * bird.twinkleSpeed + bird.x * 10) * 6;
    const s = bird.size * 5 + 4;
    ctx.beginPath();
    ctx.moveTo(bx - s, by + s * 0.3);
    ctx.quadraticCurveTo(bx - s * 0.3, by - s * 0.4, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.3, by - s * 0.4, bx + s, by + s * 0.3);
    ctx.stroke();
  }
}

/* ── Clouds ────────────────────────────────────────────────────────────── */
function drawClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  shipSpeed: number,
) {
  const clouds = [
    { x: 0.1, y: 0.12, scale: 1.0 },
    { x: 0.4, y: 0.08, scale: 0.7 },
    { x: 0.7, y: 0.15, scale: 0.85 },
    { x: 0.9, y: 0.1, scale: 0.6 },
  ];

  for (const cloud of clouds) {
    const cx = ((cloud.x * w + time * 15 * (1 + shipSpeed * 0.3)) % (w + 200)) - 100;
    const cy = cloud.y * h;
    const s = cloud.scale * 40;

    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 1.6, s * 0.6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - s * 0.7, cy + s * 0.15, s * 0.9, s * 0.45, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + s * 0.8, cy + s * 0.1, s * 1.0, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  }
}

/* ── Ship Drawing ──────────────────────────────────────────────────────── */
function drawShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
) {
  ctx.save();
  const bob = Math.sin(time * 1.5) * 3;
  const tilt = Math.sin(time * 1.2) * 0.015;
  ctx.translate(x, y + bob);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);

  // Hull
  ctx.beginPath();
  ctx.moveTo(-70, 0);
  ctx.lineTo(-80, 20);
  ctx.lineTo(80, 20);
  ctx.lineTo(90, 0);
  ctx.lineTo(70, -5);
  ctx.lineTo(-60, -5);
  ctx.closePath();
  const hullGrad = ctx.createLinearGradient(-80, -5, -80, 25);
  hullGrad.addColorStop(0, '#334155');
  hullGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = hullGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(79,70,229,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hull waterline stripe
  ctx.beginPath();
  ctx.moveTo(-75, 12);
  ctx.lineTo(85, 12);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Superstructure (cabin)
  ctx.beginPath();
  ctx.rect(-25, -30, 50, 25);
  const cabinGrad = ctx.createLinearGradient(-25, -30, -25, -5);
  cabinGrad.addColorStop(0, '#475569');
  cabinGrad.addColorStop(1, '#334155');
  ctx.fillStyle = cabinGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(79,70,229,0.25)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Bridge (upper cabin)
  ctx.beginPath();
  ctx.rect(-15, -45, 30, 15);
  ctx.fillStyle = '#475569';
  ctx.fill();

  // Windows
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.rect(-18 + i * 10, -25, 6, 5);
    const windowAlpha = 0.5 + 0.5 * Math.sin(time * 2 + i * 0.8);
    ctx.fillStyle = `rgba(99,102,241,${windowAlpha})`;
    ctx.fill();
  }

  // Bridge windows
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.rect(-10 + i * 8, -42, 5, 8);
    ctx.fillStyle = `rgba(6,182,212,${0.4 + 0.3 * Math.sin(time * 1.5 + i)})`;
    ctx.fill();
  }

  // Mast
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.lineTo(0, -65);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mast light
  ctx.beginPath();
  ctx.arc(0, -65, 3, 0, Math.PI * 2);
  const lightAlpha = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(239,68,68,${lightAlpha})`;
  ctx.fill();
  ctx.shadowColor = `rgba(239,68,68,${lightAlpha * 0.8})`;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Smokestack
  ctx.beginPath();
  ctx.rect(25, -42, 10, 12);
  ctx.fillStyle = '#444';
  ctx.fill();

  // Smoke particles
  for (let i = 0; i < 4; i++) {
    const smokeX = 30 + i * 12 + Math.sin(time * 2 + i) * 4;
    const smokeY = -48 - i * 10 - Math.sin(time * 1.5 + i * 0.5) * 3;
    const smokeAlpha = 0.15 - i * 0.03;
    const smokeSize = 5 + i * 3;
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100,116,139,${smokeAlpha})`;
    ctx.fill();
  }

  // Cargo containers
  const containerColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.beginPath();
      ctx.rect(-55 + col * 16, -18 + row * 7, 14, 6);
      ctx.fillStyle = containerColors[(row * 3 + col) % containerColors.length];
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  // Bow wave splash
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const splashX = 85 + i * 5 + Math.sin(time * 4 + i) * 2;
    const splashY = 15 + Math.sin(time * 3 + i * 0.7) * 3;
    ctx.moveTo(splashX, splashY);
    ctx.arc(splashX, splashY, 2 - i * 0.3, 0, Math.PI * 2);
  }
  ctx.fillStyle = 'rgba(14,165,233,0.35)';
  ctx.fill();

  ctx.restore();
}

/* ── Wake / Trail ──────────────────────────────────────────────────────── */
function drawWake(
  ctx: CanvasRenderingContext2D,
  shipX: number,
  shipY: number,
  w: number,
  time: number,
  speed: number,
) {
  const wakeLength = Math.min(shipX, w * 0.4) * (0.5 + speed * 0.3);
  if (wakeLength < 10) return;

  ctx.save();
  const grad = ctx.createLinearGradient(shipX, shipY, shipX - wakeLength, shipY);
  grad.addColorStop(0, `rgba(14,165,233,${0.2 + speed * 0.08})`);
  grad.addColorStop(1, 'rgba(14,165,233,0)');

  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(shipX - 50, shipY + 15);
    const spread = (i + 1) * 8;
    for (let d = 0; d < wakeLength; d += 5) {
      const wy = shipY + 15 + (d / wakeLength) * spread +
        Math.sin(d * 0.05 + time * 2) * 2;
      ctx.lineTo(shipX - 50 - d, wy);
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5 - i * 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function ShipIntroAnimation({ onComplete }: ShipIntroAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [useSimple, setUseSimple] = useState(false);

  // Refs for animation state
  const scrollBoost = useRef(0);
  const shipX = useRef(0);
  const startTime = useRef(0);
  const animFrameId = useRef(0);
  const frameCountRef = useRef(0);
  const perfCheckDone = useRef(false);
  const completedRef = useRef(false);
  const lastTouchY = useRef(0);

  const birdsRef = useRef<{ x: number; y: number; size: number; twinkleSpeed: number }[]>([]);

  // Generate birds once
  useEffect(() => {
    birdsRef.current = Array.from({ length: 12 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.5 + 0.05,
      size: Math.random() * 1.2 + 0.4,
      twinkleSpeed: Math.random() * 1.5 + 0.3,
    }));
  }, []);

  const finishAnimation = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFadingOut(true);
    setTimeout(() => onComplete(), FADE_OUT_MS);
  }, [onComplete]);

  /* ── Main render loop ───────────────────────────────────────────────── */
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    if (startTime.current === 0) startTime.current = now;
    const elapsed = now - startTime.current;

    // Performance check
    frameCountRef.current++;
    if (!perfCheckDone.current && elapsed > PERF_CHECK_MS) {
      perfCheckDone.current = true;
      const fps = (frameCountRef.current / PERF_CHECK_MS) * 1000;
      if (fps < LOW_FPS_THRESHOLD) {
        setUseSimple(true);
        return;
      }
    }

    // Time's up
    if (elapsed >= ANIMATION_DURATION) {
      finishAnimation();
      return;
    }

    const progressVal = Math.min(elapsed / ANIMATION_DURATION, 1);
    setProgress(progressVal);

    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const time = elapsed / 1000;

    // Ship movement
    const currentSpeed = DEFAULT_SPEED + scrollBoost.current * MAX_SCROLL_BOOST;
    shipX.current += currentSpeed * (1 + progressVal * 0.5);
    scrollBoost.current *= SCROLL_DECAY;

    const actualShipX = Math.min(shipX.current, w * 0.85);
    const waterlineY = h * 0.62;
    const shipScale = Math.min(w / 900, 1.2) * dpr * 0.6;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Sky gradient — dawn/sunrise
    const sky = ctx.createLinearGradient(0, 0, 0, waterlineY);
    sky.addColorStop(0, '#bfdbfe');   // soft blue
    sky.addColorStop(0.3, '#dbeafe'); // lighter blue
    sky.addColorStop(0.6, '#fef3c7'); // warm peach
    sky.addColorStop(0.85, '#fde68a'); // golden horizon
    sky.addColorStop(1, '#fed7aa');   // soft orange
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, waterlineY);

    // Sun (rising)
    const sunX = w * 0.75;
    const sunY = waterlineY * 0.55;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28 * dpr * 0.5, 0, Math.PI * 2);
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 28 * dpr * 0.5);
    sunGrad.addColorStop(0, 'rgba(253,224,71,0.95)');
    sunGrad.addColorStop(0.7, 'rgba(251,191,36,0.6)');
    sunGrad.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Sun glow
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70 * dpr * 0.5, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 70 * dpr * 0.5);
    glowGrad.addColorStop(0, 'rgba(253,224,71,0.12)');
    glowGrad.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Seabirds
    drawSeabirds(ctx, w, h, time, birdsRef.current);

    // Clouds
    drawClouds(ctx, w, h, time, scrollBoost.current);

    // Sun reflection on water
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const rx = sunX + Math.sin(time * 2 + i * 0.5) * (3 + i * 0.8);
      const ry = waterlineY + 5 + i * 4;
      const rw = 10 - i * 0.3;
      const rAlpha = 0.18 - i * 0.007;
      ctx.fillStyle = `rgba(253,224,71,${rAlpha})`;
      ctx.fillRect(rx - rw / 2, ry, rw, 2);
    }

    // Wake trail
    drawWake(ctx, actualShipX, waterlineY - 8 * shipScale, w, time, scrollBoost.current);

    // Ship
    drawShip(ctx, actualShipX, waterlineY - 8 * shipScale, shipScale, time);

    // Waves (drawn on top, below ship hull waterline)
    drawWaves(ctx, w, h, time, shipX.current);

    // Water below waves
    ctx.fillStyle = '#164e63';
    ctx.fillRect(0, h * 0.85, w, h * 0.15);

    animFrameId.current = requestAnimationFrame(animate);
  }, [finishAnimation]);

  /* ── Setup & cleanup ────────────────────────────────────────────────── */
  useEffect(() => {
    // Prefers-reduced-motion check
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    // Scroll handlers
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const speed = Math.abs(e.deltaY) / 100;
      scrollBoost.current = Math.min(scrollBoost.current + speed * 0.15, 1);
    };

    const onTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dy = Math.abs(e.touches[0].clientY - lastTouchY.current);
      lastTouchY.current = e.touches[0].clientY;
      const speed = dy / 50;
      scrollBoost.current = Math.min(scrollBoost.current + speed * 0.15, 1);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    // Start animation loop
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      document.body.style.overflow = '';
    };
  }, [animate, onComplete]);

  /* ── Simplified fallback handler ────────────────────────────────────── */
  useEffect(() => {
    if (!useSimple) return;
    const timer = setTimeout(() => finishAnimation(), 3000);
    return () => clearTimeout(timer);
  }, [useSimple, finishAnimation]);

  /* ── Render ─────────────────────────────────────────────────────────── */

  if (useSimple) {
    return (
      <div className="ship-intro-simple">
        <div className="ship-intro-simple-content">
          <h1>ExportSaathi</h1>
          <p>AI Export Co-Pilot for Indian MSMEs</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ship-intro-overlay ${fadingOut ? 'fading-out' : ''}`}>
      <canvas ref={canvasRef} className="ship-intro-canvas" />

      <div className="ship-intro-brand">
        <h1>ExportSaathi</h1>
        <p>AI Export Co-Pilot for Indian MSMEs</p>
      </div>

      {!fadingOut && (
        <div className="ship-intro-hint">
          <span className="ship-intro-hint-text">Scroll to accelerate</span>
          <span className="ship-intro-hint-arrow" />
        </div>
      )}

      <div className="ship-intro-progress">
        <div
          className="ship-intro-progress-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
