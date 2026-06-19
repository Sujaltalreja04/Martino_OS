import { useState, useRef } from 'react';

export default function TiltCard({ children, className = '', style = {}, maxTilt = 10 }) {
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element

    const width = rect.width;
    const height = rect.height;

    // Calculate rotate values: from -maxTilt to +maxTilt
    const rotateY = ((x / width) - 0.5) * maxTilt * 2; // horizontal tilt
    const rotateX = (0.5 - (y / height)) * maxTilt * 2; // vertical tilt

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)',
    });

    setGlareStyle({
      opacity: 1,
      background: `radial-gradient(circle 180px at ${x}px ${y}px, rgba(255, 255, 255, 0.12), transparent)`,
      transition: 'opacity 0.15s ease',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    });

    setGlareStyle({
      opacity: 0,
      transition: 'opacity 0.5s ease',
    });
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card-container ${className}`}
      style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        ...style,
        ...tiltStyle
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Specular Glare/Shine Effect */}
      <div
        className="tilt-card-glare"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
          borderRadius: 'inherit',
          ...glareStyle
        }}
      />
      {/* Children content wrapper */}
      <div style={{ transform: 'translateZ(10px)', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}
