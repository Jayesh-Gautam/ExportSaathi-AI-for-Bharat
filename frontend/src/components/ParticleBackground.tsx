import { useEffect, useRef } from 'react';

// ─── Smooth vector field using layered trig functions (Curl-noise approximation) ───
function fieldAngle(x: number, y: number, t: number): number {
    const scale = 0.0012;
    return (
        Math.sin(x * scale * 1.3 + t * 0.4) * Math.cos(y * scale * 0.9 + t * 0.25) * Math.PI * 2 +
        Math.sin(x * scale * 0.7 - y * scale * 1.1 + t * 0.18) * Math.PI +
        Math.cos(x * scale * 2.1 + y * scale * 1.7 + t * 0.55) * 0.8
    );
}

interface Particle {
    x: number;
    y: number;
    history: Array<[number, number]>;
    speed: number;
    hue: number;      // 0-360
    alpha: number;
    life: number;
    maxLife: number;
    size: number;
}

const TRAIL_LEN = 28;
const COUNT = 90;

function randomEdgeSpawn(W: number, H: number): [number, number] {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return [Math.random() * W, 0];
    if (side === 1) return [W, Math.random() * H];
    if (side === 2) return [Math.random() * W, H];
    return [0, Math.random() * H];
}

// Premium palette: indigo → violet → cyan → emerald cycling
function hueToColor(hue: number): string {
    // Map custom hue to our brand palette range (200–310 covers cyan→indigo→violet)
    const mapped = 200 + ((hue % 360) / 360) * 150;
    return `hsl(${mapped},80%,55%)`;
}

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // ── Offscreen blur canvas for glow accumulation ──
        const offscreen = document.createElement('canvas');
        const offCtx = offscreen.getContext('2d')!;

        let W = window.innerWidth;
        let H = window.innerHeight;
        let t = 0;
        let mouse = { x: W / 2, y: H / 2, down: false };

        function resize() {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas!.width = W;
            canvas!.height = H;
            offscreen.width = W;
            offscreen.height = H;
        }
        resize();

        // ── Spawn ──
        function spawn(): Particle {
            const [x, y] = randomEdgeSpawn(W, H);
            return {
                x, y,
                history: [],
                speed: 0.8 + Math.random() * 1.4,
                hue: Math.random() * 360,
                alpha: 0.55 + Math.random() * 0.3,
                life: 0,
                maxLife: 280 + Math.random() * 320,
                size: 1.2 + Math.random() * 1.8,
            };
        }

        const particles: Particle[] = Array.from({ length: COUNT }, spawn);

        // ── Main loop ──
        function frame() {
            if (!canvas || !ctx) return;
            t += 0.007;

            // Persistent fade (creates trailing glow effect)
            ctx.fillStyle = 'rgba(248,249,252,0.13)';
            ctx.fillRect(0, 0, W, H);

            ctx.globalCompositeOperation = 'source-over';

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // ── Vector field direction + mouse vortex ──
                const angle = fieldAngle(p.x, p.y, t);

                // Mouse gravity vortex
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                let vx = Math.cos(angle) * p.speed;
                let vy = Math.sin(angle) * p.speed;
                if (dist < 200 && dist > 1) {
                    // Swirling vortex: pull inward + tangential rotation
                    const pull = mouse.down ? 3.5 : 1.2;
                    const vortexStrength = (200 - dist) / 200;
                    vx += (-dx / dist) * vortexStrength * pull;
                    vy += (-dy / dist) * vortexStrength * pull;
                    // Clockwise rotation component
                    vx += (-dy / dist) * vortexStrength * 1.8;
                    vy += (dx / dist) * vortexStrength * 1.8;
                }

                p.x += vx;
                p.y += vy;
                p.life++;
                p.hue = (p.hue + 0.4) % 360;

                // Store trail
                p.history.push([p.x, p.y]);
                if (p.history.length > TRAIL_LEN) p.history.shift();

                // ── Draw trail as gradient stroke ──
                if (p.history.length > 2) {
                    const lifeRatio = p.life / p.maxLife;
                    const fadeIn = Math.min(1, p.life / 30);
                    const fadeOut = lifeRatio > 0.8 ? 1 - (lifeRatio - 0.8) / 0.2 : 1;
                    const baseAlpha = p.alpha * fadeIn * fadeOut;

                    for (let j = 1; j < p.history.length; j++) {
                        const segProgress = j / p.history.length;
                        const segAlpha = baseAlpha * segProgress * 0.9;
                        const width = p.size * segProgress;

                        // Hue shifts along trail for rainbow ribbon effect
                        const trailHue = (p.hue + (1 - segProgress) * 30) % 360;

                        ctx.beginPath();
                        ctx.moveTo(p.history[j - 1][0], p.history[j - 1][1]);
                        ctx.lineTo(p.history[j][0], p.history[j][1]);

                        // Inner bright line
                        ctx.strokeStyle = hueToColor(trailHue).replace('hsl', 'hsla').replace(')', `,${segAlpha})`);
                        ctx.lineWidth = width;
                        ctx.lineCap = 'round';
                        ctx.stroke();

                        // Soft glow (wider, more transparent)
                        if (j > p.history.length - 6) {
                            ctx.strokeStyle = hueToColor(trailHue).replace('hsl', 'hsla').replace(')', `,${segAlpha * 0.35})`);
                            ctx.lineWidth = width * 4;
                            ctx.stroke();
                        }
                    }

                    // ── Glowing head dot ──
                    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
                    grd.addColorStop(0, hueToColor(p.hue).replace('hsl', 'hsla').replace(')', `,${baseAlpha})`));
                    grd.addColorStop(1, hueToColor(p.hue).replace('hsl', 'hsla').replace(')', ',0)'));
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
                    ctx.fillStyle = grd;
                    ctx.fill();
                }

                // ── Respawn when dead or out of bounds ──
                const oob = p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50;
                if (p.life >= p.maxLife || oob) {
                    particles[i] = spawn();
                }
            }

            // ── Occasional pulse ring from mouse ──
            if (Math.random() < 0.007) {
                const pulse = Math.random() * 40 + 20;
                const pg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, pulse);
                pg.addColorStop(0, 'rgba(99,102,241,0)');
                pg.addColorStop(0.7, 'rgba(99,102,241,0.06)');
                pg.addColorStop(1, 'rgba(99,102,241,0)');
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, pulse, 0, Math.PI * 2);
                ctx.fillStyle = pg;
                ctx.fill();
            }

            animRef.current = requestAnimationFrame(frame);
        }

        frame();

        const onResize = () => { resize(); };
        const onMouseMove = (e: MouseEvent) => { mouse = { ...mouse, x: e.clientX, y: e.clientY }; };
        const onMouseDown = () => { mouse.down = true; };
        const onMouseUp = () => { mouse.down = false; };
        const onMouseLeave = () => { mouse = { x: W / 2, y: H / 2, down: false }; };

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mouseleave', onMouseLeave);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100vw', height: '100vh',
                pointerEvents: 'none',
                zIndex: 0,
            }}
            aria-hidden="true"
        />
    );
}
