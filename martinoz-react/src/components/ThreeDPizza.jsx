import { useState } from 'react';

export default function ThreeDPizza() {
  const [isExploded, setIsExploded] = useState(false);

  return (
    <div
      className="dashboard-card interactive-3d-pizza-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '360px',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsExploded(true)}
      onMouseLeave={() => setIsExploded(false)}
    >
      <div className="card-header" style={{ width: '100%', marginBottom: '16px' }}>
        <h3>
          <i className="fa-solid fa-pizza-slice text-orange"></i> Live 3D Recipe Explorer
        </h3>
        <span className="badge badge-info">Hover to Explode Layers</span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
        {/* Steam particles (animated) */}
        <div className={`steam-container ${isExploded ? 'exploded' : ''}`}>
          <div className="steam-particle s1"></div>
          <div className="steam-particle s2"></div>
          <div className="steam-particle s3"></div>
        </div>

        {/* 3D Scene Wrapper */}
        <div
          className="pizza-3d-scene"
          style={{
            width: '280px',
            height: '240px',
            perspective: '1200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className={`pizza-3d-object ${isExploded ? 'exploded' : ''}`}
            style={{
              width: '200px',
              height: '200px',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: 'rotateX(60deg) rotateZ(-30deg)',
              transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Layer 1: Shadow (Bottom) */}
            <div
              className="pizza-layer shadow-layer"
              style={{
                transform: 'translateZ(-20px)',
                opacity: isExploded ? 0.3 : 0.6,
                filter: 'blur(10px)',
                background: 'rgba(0,0,0,0.6)'
              }}
            />

            {/* Layer 2: Hand-Tossed Crust */}
            <div
              className="pizza-layer crust-layer"
              style={{
                transform: `translateZ(${isExploded ? '-10px' : '0px'})`,
                background: 'linear-gradient(135deg, #e7a96e 0%, #c67d3d 100%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', fill: '#bd7230' }}>
                {/* Charred woodfired spots */}
                <circle cx="20" cy="50" r="3" opacity="0.3" />
                <circle cx="80" cy="45" r="4" opacity="0.3" />
                <circle cx="45" cy="80" r="3.5" opacity="0.3" />
                <circle cx="50" cy="15" r="2.5" opacity="0.3" />
                {/* Pizza slice segment border lines for texture */}
                <path d="M 50 50 L 50 5 A 45 45 0 0 1 95 50 Z" fill="#b06422" opacity="0.3" />
              </svg>
              <div className="layer-tag">Crust: Double-Fermented</div>
            </div>

            {/* Layer 3: Tomato Sauce Base */}
            <div
              className="pizza-layer sauce-layer"
              style={{
                transform: `translateZ(${isExploded ? '25px' : '3px'})`,
                background: 'radial-gradient(circle, #e63946 30%, #b70929 100%)',
                border: '4px solid transparent',
                borderRadius: '50%',
                scale: '0.9'
              }}
            >
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', fill: '#a3001e' }}>
                {/* Oregano and herb flakes */}
                <rect x="30" y="30" width="1.5" height="4" transform="rotate(30 30 30)" opacity="0.5" />
                <rect x="65" y="40" width="2" height="3.5" transform="rotate(75 65 40)" opacity="0.5" />
                <rect x="45" y="70" width="1.5" height="5" transform="rotate(-45 45 70)" opacity="0.5" />
                <rect x="50" y="20" width="2" height="3" transform="rotate(15 50 20)" opacity="0.5" />
              </svg>
              <div className="layer-tag">Sauce: San Marzano Tomato</div>
            </div>

            {/* Layer 4: Shredded Mozzarella Cheese */}
            <div
              className="pizza-layer cheese-layer"
              style={{
                transform: `translateZ(${isExploded ? '60px' : '6px'})`,
                background: 'rgba(255, 235, 180, 0.85)',
                backdropFilter: 'blur(2px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1), inset 0 0 15px rgba(255,183,3,0.3)',
                scale: '0.86'
              }}
            >
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                {/* Bubbling cheese details */}
                <circle cx="35" cy="40" r="8" fill="#ffa200" opacity="0.4" />
                <circle cx="65" cy="55" r="10" fill="#ffa200" opacity="0.4" />
                <circle cx="50" cy="65" r="7" fill="#ffb703" opacity="0.5" />
                <circle cx="55" cy="30" r="6" fill="#ffb703" opacity="0.5" />
              </svg>
              <div className="layer-tag">Cheese: Artisanal Mozzarella</div>
            </div>

            {/* Layer 5: Pepperoni & Basil Leaves */}
            <div
              className="pizza-layer toppings-layer"
              style={{
                transform: `translateZ(${isExploded ? '95px' : '10px'})`,
                background: 'transparent',
                scale: '0.84',
                pointerEvents: 'none'
              }}
            >
              {/* Floating SVG Toppings */}
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                {/* Pepperoni Slices (deep red circles with inner shade) */}
                <circle cx="28" cy="32" r="7" fill="#bc3908" stroke="#741a06" strokeWidth="1" />
                <circle cx="26" cy="31" r="5" fill="#a62c00" />
                
                <circle cx="70" cy="36" r="7.5" fill="#bc3908" stroke="#741a06" strokeWidth="1" />
                <circle cx="69" cy="35" r="5.5" fill="#a62c00" />

                <circle cx="48" cy="68" r="7.2" fill="#bc3908" stroke="#741a06" strokeWidth="1" />
                <circle cx="47" cy="67" r="5.2" fill="#a62c00" />

                <circle cx="50" cy="22" r="6.8" fill="#bc3908" stroke="#741a06" strokeWidth="1" />
                <circle cx="49" cy="21" r="4.8" fill="#a62c00" />

                <circle cx="25" cy="60" r="7" fill="#bc3908" stroke="#741a06" strokeWidth="1" />
                <circle cx="24" cy="59" r="5" fill="#a62c00" />

                <circle cx="72" cy="62" r="6.5" fill="#bc3908" stroke="#741a06" strokeWidth="1" />
                <circle cx="71" cy="61" r="4.5" fill="#a62c00" />

                {/* Fresh Basil Leaves (green curved paths) */}
                <path d="M 38 48 C 38 48, 42 42, 45 46 C 45 46, 40 52, 38 48 Z" fill="#2d6a4f" />
                <path d="M 58 46 C 58 46, 62 40, 65 44 C 65 44, 60 50, 58 46 Z" fill="#2d6a4f" />
                <path d="M 48 48 C 48 48, 52 54, 48 58 C 48 58, 44 52, 48 48 Z" fill="#40916c" />
              </svg>
              <div className="layer-tag">Toppings: Spicy Pepperoni & Basil</div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory subtitle */}
      <div style={{ marginTop: '16px', textAlign: 'center', zIndex: 5 }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {isExploded 
            ? '3D Parallax Active: Rotating ingredients expanded for analysis.' 
            : 'Hover above to separate elements into individual ingredient layers.'
          }
        </p>
      </div>
    </div>
  );
}
