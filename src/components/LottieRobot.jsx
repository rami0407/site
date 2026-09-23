import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import robotAnimationData from '../assets/robot_assistant.json';

const LottieRobot = ({ width = '100%', height = '100%', className = '', style = {}, loop = true, autoplay = true }) => {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        animationData: robotAnimationData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet'
        }
      });
    } catch (err) {
      console.warn('Lottie render error:', err);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, [loop, autoplay]);

  return (
    <div
      ref={containerRef}
      className={`lottie-robot-wrap ${className}`}
      style={{
        width,
        height,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        ...style
      }}
    />
  );
};

export default LottieRobot;
