import React, { useRef, useEffect, useState } from 'react';

/**
 * RealisticSpacecraft - High-Fidelity NASA Space Shuttle Orbiter with Musheirifa School Mission Emblem
 * Features mathematically aligned twin supersonic plasma thrusters and real-time Canvas particle smoke physics.
 */
const RealisticSpacecraft = ({ isLaunching, onLaunch }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const animFrameId = useRef(null);

  // IntersectionObserver: Suspend rendering entirely when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Twin Nozzle Particle Physics Engine - Only runs when launching or hovered AND visible in viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = 320);
    const height = (canvas.height = 380);

    // If not visible or completely idle, immediately stop loop and clear canvas
    if (!isVisible || (!isLaunching && !isHovered)) {
      ctx.clearRect(0, 0, width, height);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
      return;
    }

    const particles = [];
    const sparks = [];

    class SmokeParticle {
      constructor(x, y, speedY, spreadX, isHeavy = false) {
        this.x = x + (Math.random() - 0.5) * spreadX;
        this.y = y;
        this.vx = (Math.random() - 0.5) * (isHeavy ? 3.0 : 1.2);
        this.vy = speedY + Math.random() * 2.2;
        this.radius = isHeavy ? Math.random() * 8 + 6 : Math.random() * 5 + 3;
        this.maxRadius = isHeavy ? Math.random() * 36 + 22 : Math.random() * 18 + 10;
        this.growthRate = isHeavy ? 0.6 : 0.3;
        this.alpha = isHeavy ? 0.8 : 0.45;
        this.decay = isHeavy ? 0.015 : 0.025;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.04;
        this.heat = 1.0;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.985;
        if (this.radius < this.maxRadius) {
          this.radius += this.growthRate;
        }
        this.rotation += this.rotSpeed;
        this.alpha -= this.decay;
        this.heat = Math.max(0, this.heat - 0.05);
      }

      draw(c) {
        if (this.alpha <= 0) return;
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);

        const grad = c.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        if (this.heat > 0.35) {
          grad.addColorStop(0, `rgba(255, 195, 60, ${this.alpha * 0.95})`);
          grad.addColorStop(0.25, `rgba(245, 100, 25, ${this.alpha * 0.75})`);
          grad.addColorStop(0.65, `rgba(180, 160, 160, ${this.alpha * 0.45})`);
          grad.addColorStop(1, `rgba(100, 100, 120, 0)`);
        } else {
          grad.addColorStop(0, `rgba(225, 230, 240, ${this.alpha * 0.85})`);
          grad.addColorStop(0.5, `rgba(175, 180, 195, ${this.alpha * 0.5})`);
          grad.addColorStop(0.8, `rgba(125, 130, 145, ${this.alpha * 0.2})`);
          grad.addColorStop(1, `rgba(70, 75, 90, 0)`);
        }

        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    class SparkParticle {
      constructor(x, y, vy) {
        this.x = x + (Math.random() - 0.5) * 16;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4.0;
        this.vy = vy + Math.random() * 4.5;
        this.length = Math.random() * 8 + 3;
        this.alpha = 1;
        this.decay = Math.random() * 0.05 + 0.03;
        this.color = Math.random() > 0.3 ? '#fef08a' : '#f97316';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw(c) {
        if (this.alpha <= 0) return;
        c.save();
        c.strokeStyle = this.color;
        c.globalAlpha = this.alpha;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(this.x, this.y);
        c.lineTo(this.x + this.vx * 1.5, this.y + this.length);
        c.stroke();
        c.restore();
      }
    }

    const nozzleLeftX = 145.7;
    const nozzleRightX = 170.6;
    const emitterY = 6;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isLaunching) {
        if (particles.length < 36) {
          for (let i = 0; i < 2; i++) {
            particles.push(new SmokeParticle(nozzleLeftX, emitterY, 4.8, 14, true));
            particles.push(new SmokeParticle(nozzleRightX, emitterY, 4.8, 14, true));
          }
        }
        if (sparks.length < 20) {
          sparks.push(new SparkParticle(nozzleLeftX, emitterY, 5.5));
          sparks.push(new SparkParticle(nozzleRightX, emitterY, 5.5));
        }
      } else if (isHovered) {
        if (particles.length < 20 && Math.random() < 0.5) {
          particles.push(new SmokeParticle(nozzleLeftX, emitterY, 2.2, 10, false));
          particles.push(new SmokeParticle(nozzleRightX, emitterY, 2.2, 10, false));
        }
        if (sparks.length < 12 && Math.random() < 0.25) {
          sparks.push(new SparkParticle(nozzleLeftX, emitterY, 3.5));
          sparks.push(new SparkParticle(nozzleRightX, emitterY, 3.5));
        }
      }

      // Update & Draw Smoke
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0 || p.y > height + 40) {
          particles.splice(i, 1);
        }
      }

      // Update & Draw Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.update();
        s.draw(ctx);
        if (s.alpha <= 0 || s.y > height + 20) {
          sparks.splice(i, 1);
        }
      }

      // If active state ceased and particles have finished fading, end loop to save CPU
      if (!isLaunching && !isHovered && particles.length === 0 && sparks.length === 0) {
        ctx.clearRect(0, 0, width, height);
        animFrameId.current = null;
        return;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
    };
  }, [isLaunching, isHovered, isVisible]);

  return (
    <div 
      ref={containerRef}
      className={`spacecraft-container ${isLaunching ? 'launch-liftoff' : 'idle-hover'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onLaunch}
      title="اضغط لتشغيل محركات مكوك الفضاء والانطلاق نحو الفضاء!"
      style={{
        position: 'relative',
        width: '280px',
        minHeight: '430px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        perspective: '1000px'
      }}
    >
      {/* Launch Pad Holographic Radar Ring */}
      <div 
        style={{
          position: 'absolute',
          bottom: '65px',
          width: '210px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid rgba(56, 189, 248, 0.45)',
          boxShadow: isHovered || isLaunching
            ? '0 0 35px rgba(56, 189, 248, 0.9), inset 0 0 18px rgba(56, 189, 248, 0.5)'
            : '0 0 18px rgba(56, 189, 248, 0.25)',
          transform: 'rotateX(60deg)',
          transition: 'all 0.4s ease',
          pointerEvents: 'none',
          animation: isLaunching ? 'pulseRadar 0.4s infinite alternate' : 'pulseRadar 2s infinite alternate'
        }}
      />

      {/* Realistic NASA & Musheirifa Space Shuttle Fuselage */}
      <div 
        className="spacecraft-hull-wrapper"
        style={{
          position: 'relative',
          width: '220px',
          height: '271px',
          zIndex: 5,
          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* Shuttle High-Res Image */}
        <img 
          src={`${import.meta.env.BASE_URL}space_shuttle_musheirifa.png`}
          alt="مكوك الفضاء - مدرسة مشيرفة"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            filter: isLaunching 
              ? 'drop-shadow(0 25px 40px rgba(249, 115, 22, 0.7)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.5))' 
              : isHovered
              ? 'drop-shadow(0 20px 35px rgba(56, 189, 248, 0.6))'
              : 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.65))',
            transition: 'filter 0.3s ease'
          }}
        />

        {/* Mathematically Aligned Twin Supersonic Plasma Jets (Directly attached to the nozzles inside the wrapper) */}
        {(isLaunching || isHovered) && (
          <div 
            className="spacecraft-plasma-plume"
            style={{
              position: 'absolute',
              top: '258px',
              left: 0,
              width: '220px',
              height: '95px',
              pointerEvents: 'none',
              zIndex: 6
            }}
          >
            <svg viewBox="0 0 220 95" fill="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="plumeLeft" x1="95.7" y1="0" x2="95.7" y2="85" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="15%" stopColor="#67e8f9" />
                  <stop offset="40%" stopColor="#3b82f6" />
                  <stop offset="75%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </linearGradient>
                <linearGradient id="plumeRight" x1="120.6" y1="0" x2="120.6" y2="85" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="15%" stopColor="#67e8f9" />
                  <stop offset="40%" stopColor="#3b82f6" />
                  <stop offset="75%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </linearGradient>
                <filter id="bloomFlames" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <g filter="url(#bloomFlames)">
                {/* Left Nozzle Flame Cone (Center 95.7px, Width 16px) */}
                <path d="M87.7 0 Q95.7 75 95.7 88 Q95.7 75 103.7 0 Z" fill="url(#plumeLeft)" />
                <ellipse cx="95.7" cy="14" rx="4.5" ry="2" fill="#ffffff" />
                <ellipse cx="95.7" cy="28" rx="3.5" ry="1.6" fill="#a5f3fc" />
                <ellipse cx="95.7" cy="42" rx="2.5" ry="1.2" fill="#38bdf8" />

                {/* Right Nozzle Flame Cone (Center 120.6px, Width 16px) */}
                <path d="M112.6 0 Q120.6 75 120.6 88 Q120.6 75 128.6 0 Z" fill="url(#plumeRight)" />
                <ellipse cx="120.6" cy="14" rx="4.5" ry="2" fill="#ffffff" />
                <ellipse cx="120.6" cy="28" rx="3.5" ry="1.6" fill="#a5f3fc" />
                <ellipse cx="120.6" cy="42" rx="2.5" ry="1.2" fill="#38bdf8" />
              </g>
            </svg>
          </div>
        )}

        {/* Dynamic Canvas Smoke & Spark Engine (Attached inside wrapper to follow liftoff) */}
        <div 
          style={{
            position: 'absolute',
            top: '258px',
            left: '-50px',
            width: '320px',
            height: '380px',
            pointerEvents: 'none',
            zIndex: 4
          }}
        >
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>

      {/* Clean Interactive Launch Mission Button (Properly spaced with no overlaps) */}
      {!isLaunching && (
        <div 
          style={{
            marginTop: '2.5rem',
            background: isHovered 
              ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.95) 0%, rgba(14, 165, 233, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.92) 100%)',
            border: '1.5px solid rgba(56, 189, 248, 0.6)',
            color: 'white',
            padding: '0.65rem 1.4rem',
            borderRadius: '24px',
            fontSize: '0.9rem',
            fontWeight: 800,
            backdropFilter: 'blur(10px)',
            boxShadow: isHovered 
              ? '0 10px 30px rgba(56, 189, 248, 0.5), 0 0 20px rgba(56, 189, 248, 0.3)'
              : '0 6px 20px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            zIndex: 10,
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <span style={{ fontSize: '1.15rem', color: '#fbbf24' }}>🚀</span>
          <span>انقر لإطلاق مكوك الفضاء نحو النجوم!</span>
          <i className="fas fa-arrow-left" style={{ fontSize: '0.85rem', color: '#38bdf8' }}></i>
        </div>
      )}
    </div>
  );
};

export default RealisticSpacecraft;
