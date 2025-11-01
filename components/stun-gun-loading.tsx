"use client"

import React from "react"

export const StunGunLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-full max-w-[600px] h-[450px]">
        {/* Main SVG Scene */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="person-skin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFDAB9" />
              <stop offset="100%" stopColor="#F4A460" />
            </linearGradient>
            <linearGradient id="person-shirt" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4299E1" />
              <stop offset="100%" stopColor="#2B6CB0" />
            </linearGradient>
            <linearGradient id="person-pants" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D3748" />
              <stop offset="100%" stopColor="#1A202C" />
            </linearGradient>
            <linearGradient id="baton-body" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1A202C" />
              <stop offset="50%" stopColor="#4A5568" />
              <stop offset="100%" stopColor="#1A202C" />
            </linearGradient>
            <linearGradient id="duck-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF700" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00FFFF" />
              <stop offset="50%" stopColor="#0080FF" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <radialGradient id="electric-glow">
              <stop offset="0%" stopColor="#00FFFF" stopOpacity="1"/>
              <stop offset="50%" stopColor="#0080FF" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
            </radialGradient>
            
            {/* Filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="strong-glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Background lightning bolts */}
          <g className="background-lightning">
            <path className="bg-bolt bolt-1" d="M80 50 L70 90 L85 90 L55 150 L75 110 L65 110 L80 50Z" fill="url(#lightning-gradient)" opacity="0.4" filter="url(#glow)" />
            <path className="bg-bolt bolt-2" d="M520 60 L510 100 L525 100 L495 160 L515 120 L505 120 L520 60Z" fill="url(#lightning-gradient)" opacity="0.4" filter="url(#glow)" />
            <path className="bg-bolt bolt-3" d="M150 40 L140 80 L155 80 L125 140 L145 100 L135 100 L150 40Z" fill="url(#lightning-gradient)" opacity="0.4" filter="url(#glow)" />
            <path className="bg-bolt bolt-4" d="M450 45 L440 85 L455 85 L425 145 L445 105 L435 105 L450 45Z" fill="url(#lightning-gradient)" opacity="0.4" filter="url(#glow)" />
          </g>

          {/* Person holding baton */}
          <g className="person" transform="translate(120, 180)" filter="url(#shadow)">
            {/* Body */}
            <ellipse cx="50" cy="90" rx="40" ry="55" fill="url(#person-shirt)" stroke="#000" strokeWidth="4"/>
            
            {/* Pants */}
            <rect x="25" y="135" width="50" height="60" rx="8" fill="url(#person-pants)" stroke="#000" strokeWidth="3"/>
            
            {/* Left leg */}
            <rect x="30" y="180" width="18" height="40" rx="4" fill="url(#person-pants)" stroke="#000" strokeWidth="3"/>
            {/* Left shoe */}
            <ellipse cx="39" cy="220" rx="12" ry="8" fill="#2D3748" stroke="#000" strokeWidth="2"/>
            
            {/* Right leg */}
            <rect x="52" y="180" width="18" height="40" rx="4" fill="url(#person-pants)" stroke="#000" strokeWidth="3"/>
            {/* Right shoe */}
            <ellipse cx="61" cy="220" rx="12" ry="8" fill="#2D3748" stroke="#000" strokeWidth="2"/>
            
            {/* Left arm (not holding baton) */}
            <path d="M 15 75 Q -5 90, 0 115" stroke="#FFDAB9" strokeWidth="15" fill="none" strokeLinecap="round"/>
            <circle cx="0" cy="115" r="10" fill="url(#person-skin)" stroke="#000" strokeWidth="2"/>
            
            {/* Right arm (holding baton) - animated */}
            <g className="arm-holding-baton">
              <path d="M 85 75 Q 130 70, 170 95" stroke="#FFDAB9" strokeWidth="15" fill="none" strokeLinecap="round"/>
              <circle cx="170" cy="95" r="10" fill="url(#person-skin)" stroke="#000" strokeWidth="2"/>
            </g>
            
            {/* Head */}
            <circle cx="50" cy="35" r="30" fill="url(#person-skin)" stroke="#000" strokeWidth="4"/>
            
            {/* Face - excited/evil expression */}
            <g className="face-expression">
              {/* Eyes - wide open with gleam */}
              <ellipse cx="38" cy="30" rx="5" ry="7" fill="#000"/>
              <ellipse cx="62" cy="30" rx="5" ry="7" fill="#000"/>
              <circle cx="39" cy="28" r="2.5" fill="#fff"/> {/* Eye shine */}
              <circle cx="63" cy="28" r="2.5" fill="#fff"/>
              
              {/* Eyebrows - mischievous */}
              <path d="M 30 20 Q 38 18, 43 20" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M 57 20 Q 62 18, 70 20" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round"/>
              
              {/* Mouth - big evil grin */}
              <path d="M 30 45 Q 50 60, 70 45" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round"/>
              {/* Teeth */}
              <line x1="40" y1="48" x2="40" y2="52" stroke="#000" strokeWidth="2"/>
              <line x1="50" y1="52" x2="50" y2="56" stroke="#000" strokeWidth="2"/>
              <line x1="60" y1="48" x2="60" y2="52" stroke="#000" strokeWidth="2"/>
            </g>
            
            {/* Hair - spiky */}
            <g>
              <path d="M 25 12 L 20 5 L 25 8" fill="#2D3748" stroke="#000" strokeWidth="2"/>
              <path d="M 35 8 L 35 0 L 38 6" fill="#2D3748" stroke="#000" strokeWidth="2"/>
              <path d="M 50 5 L 52 -3 L 53 5" fill="#2D3748" stroke="#000" strokeWidth="2"/>
              <path d="M 65 8 L 68 0 L 68 6" fill="#2D3748" stroke="#000" strokeWidth="2"/>
              <path d="M 75 12 L 80 5 L 75 8" fill="#2D3748" stroke="#000" strokeWidth="2"/>
            </g>
          </g>

          {/* Electric Baton */}
          <g className="electric-baton" transform="translate(280, 265)">
            {/* Baton handle with grip */}
            <rect x="0" y="8" width="70" height="20" rx="10" fill="#2D3748" stroke="#000" strokeWidth="3"/>
            <rect x="5" y="10" width="60" height="16" rx="8" fill="#4A5568" stroke="#000" strokeWidth="2" opacity="0.6"/>
            
            {/* Grip texture */}
            <line x1="15" y1="12" x2="15" y2="24" stroke="#1A202C" strokeWidth="2"/>
            <line x1="25" y1="12" x2="25" y2="24" stroke="#1A202C" strokeWidth="2"/>
            <line x1="35" y1="12" x2="35" y2="24" stroke="#1A202C" strokeWidth="2"/>
            <line x1="45" y1="12" x2="45" y2="24" stroke="#1A202C" strokeWidth="2"/>
            <line x1="55" y1="12" x2="55" y2="24" stroke="#1A202C" strokeWidth="2"/>
            
            {/* Baton shaft */}
            <rect x="65" y="0" width="100" height="36" rx="18" fill="url(#baton-body)" stroke="#000" strokeWidth="4"/>
            
            {/* Metal rings on shaft for detail */}
            <rect x="80" y="2" width="4" height="32" rx="2" fill="#718096" opacity="0.9"/>
            <rect x="105" y="2" width="4" height="32" rx="2" fill="#718096" opacity="0.9"/>
            <rect x="130" y="2" width="4" height="32" rx="2" fill="#718096" opacity="0.9"/>
            <rect x="155" y="2" width="4" height="32" rx="2" fill="#718096" opacity="0.9"/>
            
            {/* Electric tip - glowing and pulsing */}
            <g className="baton-tip-group">
              <ellipse className="baton-tip-glow" cx="175" cy="18" rx="25" ry="30" fill="url(#electric-glow)" opacity="0.8"/>
              <ellipse className="baton-tip" cx="175" cy="18" rx="15" ry="20" fill="#FFD700" stroke="#FF6B00" strokeWidth="4" filter="url(#strong-glow)"/>
              <ellipse cx="175" cy="18" rx="8" ry="12" fill="#00FFFF" opacity="0.8"/>
            </g>
            
            {/* Power button */}
            <circle cx="55" cy="18" r="5" fill="#FF4444" stroke="#000" strokeWidth="2"/>
            <circle cx="55" cy="18" r="2" fill="#FF8888"/>
          </g>

          {/* Electric arcs from baton to duck - multiple animated arcs */}
          <g className="electric-arcs">
            <path className="arc arc-1" d="M 460 283 Q 485 255, 510 270 Q 535 285, 560 275" stroke="#00FFFF" strokeWidth="5" fill="none" filter="url(#strong-glow)" strokeLinecap="round"/>
            <path className="arc arc-2" d="M 465 290 Q 495 275, 520 285 Q 545 295, 565 285" stroke="#FFD700" strokeWidth="4" fill="none" filter="url(#strong-glow)" strokeLinecap="round"/>
            <path className="arc arc-3" d="M 462 278 Q 480 245, 505 260 Q 530 275, 555 268" stroke="#0080FF" strokeWidth="4" fill="none" filter="url(#strong-glow)" strokeLinecap="round"/>
            <path className="arc arc-4" d="M 467 286 Q 500 265, 525 278 Q 550 290, 570 280" stroke="#00FFFF" strokeWidth="3" fill="none" filter="url(#glow)" strokeLinecap="round" opacity="0.6"/>
            <path className="arc arc-5" d="M 463 280 Q 490 250, 515 265 Q 540 280, 558 272" stroke="#FFD700" strokeWidth="3" fill="none" filter="url(#glow)" strokeLinecap="round" opacity="0.6"/>
          </g>

          {/* Duck - getting electrocuted! */}
          <g className="duck-victim" transform="translate(420, 230)" filter="url(#shadow)">
            {/* Duck body - shaking */}
            <ellipse className="duck-body-shake" cx="35" cy="60" rx="40" ry="48" fill="url(#duck-body)" stroke="#000" strokeWidth="4"/>
            
            {/* Wing - flapping frantically */}
            <ellipse className="duck-wing" cx="15" cy="55" rx="25" ry="18" fill="#FFE55C" stroke="#000" strokeWidth="3" opacity="0.9"/>
            
            {/* Duck head - shaking */}
            <circle className="duck-head-shake" cx="30" cy="25" r="22" fill="url(#duck-body)" stroke="#000" strokeWidth="4"/>
            
            {/* Beak - open in shock */}
            <ellipse cx="45" cy="25" rx="15" ry="10" fill="#FF6B00" stroke="#000" strokeWidth="3"/>
            <line x1="38" y1="25" x2="50" y2="25" stroke="#000" strokeWidth="2"/>
            
            {/* Eyes - X_X shocked/dead expression */}
            <g className="duck-eyes-shocked">
              <line x1="20" y1="18" x2="28" y2="26" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
              <line x1="28" y1="18" x2="20" y2="26" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
            </g>
            
            {/* Feathers on head sticking up from shock */}
            <g className="shocked-feathers">
              <line x1="25" y1="5" x2="22" y2="-5" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
              <line x1="30" y1="3" x2="30" y2="-8" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
              <line x1="35" y1="5" x2="38" y2="-5" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
            </g>
            
            {/* Legs - stiff from shock */}
            <rect x="22" y="100" width="8" height="25" fill="#FF6B00" stroke="#000" strokeWidth="3"/>
            <rect x="40" y="100" width="8" height="25" fill="#FF6B00" stroke="#000" strokeWidth="3"/>
            
            {/* Feet - webbed */}
            <g>
              <ellipse cx="26" cy="125" rx="10" ry="5" fill="#FF6B00" stroke="#000" strokeWidth="2"/>
              <line x1="20" y1="125" x2="17" y2="128" stroke="#000" strokeWidth="2"/>
              <line x1="26" y1="125" x2="26" y2="130" stroke="#000" strokeWidth="2"/>
              <line x1="32" y1="125" x2="35" y2="128" stroke="#000" strokeWidth="2"/>
            </g>
            <g>
              <ellipse cx="44" cy="125" rx="10" ry="5" fill="#FF6B00" stroke="#000" strokeWidth="2"/>
              <line x1="38" y1="125" x2="35" y2="128" stroke="#000" strokeWidth="2"/>
              <line x1="44" y1="125" x2="44" y2="130" stroke="#000" strokeWidth="2"/>
              <line x1="50" y1="125" x2="53" y2="128" stroke="#000" strokeWidth="2"/>
            </g>
          </g>

          {/* Electric sparks around duck - many animated sparks */}
          <g className="sparks-around-duck">
            <circle className="spark spark-1" cx="440" cy="220" r="4" fill="#FFD700" filter="url(#glow)"/>
            <circle className="spark spark-2" cx="510" cy="240" r="4" fill="#00FFFF" filter="url(#glow)"/>
            <circle className="spark spark-3" cx="470" cy="200" r="4" fill="#FFD700" filter="url(#glow)"/>
            <circle className="spark spark-4" cx="490" cy="310" r="4" fill="#00FFFF" filter="url(#glow)"/>
            <circle className="spark spark-5" cx="430" cy="280" r="4" fill="#FFD700" filter="url(#glow)"/>
            <circle className="spark spark-6" cx="520" cy="270" r="4" fill="#0080FF" filter="url(#glow)"/>
            <circle className="spark spark-7" cx="450" cy="250" r="4" fill="#00FFFF" filter="url(#glow)"/>
            <circle className="spark spark-8" cx="500" cy="295" r="4" fill="#FFD700" filter="url(#glow)"/>
          </g>

          {/* "ZAP" and "BZZT" text effects - comic book style */}
          <text className="zap-text" x="360" y="180" fontSize="32" fontWeight="bold" fontFamily="Arial Black, sans-serif" fill="#FFD700" stroke="#000" strokeWidth="2" filter="url(#glow)">ZAP!</text>
          <text className="zap-text-2" x="480" y="360" fontSize="26" fontWeight="bold" fontFamily="Arial Black, sans-serif" fill="#00FFFF" stroke="#000" strokeWidth="2" filter="url(#glow)">BZZT!</text>
          <text className="zap-text-3" x="400" y="150" fontSize="24" fontWeight="bold" fontFamily="Arial Black, sans-serif" fill="#0080FF" stroke="#000" strokeWidth="2" filter="url(#glow)" opacity="0.8">POW!</text>
        </svg>
      </div>

      {/* Loading text */}
      <div className="mt-8 text-center">
        <h3 className="text-2xl font-bold loading-text">Loading Products...</h3>
        <p className="text-sm text-muted-foreground mt-2">Electrifying the shop ⚡🦆</p>
      </div>

      <style jsx>{`
        /* Person arm animation - moving baton */
        .arm-holding-baton {
          animation: arm-move 0.6s ease-in-out infinite;
          transform-origin: 85px 75px;
        }

        @keyframes arm-move {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }

        /* Baton tip pulsing and glowing */
        .baton-tip-group {
          animation: baton-pulse 0.3s ease-in-out infinite;
        }

        @keyframes baton-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }

        .baton-tip {
          animation: tip-flash 0.2s infinite alternate;
        }

        @keyframes tip-flash {
          from { fill: #FFD700; }
          to { fill: #00FFFF; }
        }

        /* Electric arcs - flickering and animating */
        .electric-arcs path {
          animation: arc-flicker 0.15s infinite, arc-flow 0.8s linear infinite;
          stroke-dasharray: 10 5;
        }

        .arc-1 { animation-delay: 0s; }
        .arc-2 { animation-delay: 0.05s; }
        .arc-3 { animation-delay: 0.1s; }
        .arc-4 { animation-delay: 0.15s; }
        .arc-5 { animation-delay: 0.2s; }

        @keyframes arc-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes arc-flow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 30; }
        }

        /* Duck body shaking violently */
        .duck-body-shake, .duck-head-shake {
          animation: duck-shake 0.1s infinite;
          transform-origin: center;
        }

        @keyframes duck-shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-2px, 1px) rotate(-2deg); }
          50% { transform: translate(2px, -1px) rotate(2deg); }
          75% { transform: translate(-1px, 2px) rotate(-1deg); }
          100% { transform: translate(1px, -2px) rotate(1deg); }
        }

        /* Duck wing flapping frantically */
        .duck-wing {
          animation: wing-flap 0.2s infinite;
          transform-origin: 20px 55px;
        }

        @keyframes wing-flap {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(-45deg); }
        }

        /* Shocked feathers shaking */
        .shocked-feathers {
          animation: feather-shake 0.15s infinite;
        }

        @keyframes feather-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }

        /* Sparks around duck - popping and fading */
        .spark {
          animation: spark-pop 0.8s infinite;
        }

        .spark-1 { animation-delay: 0s; }
        .spark-2 { animation-delay: 0.1s; }
        .spark-3 { animation-delay: 0.2s; }
        .spark-4 { animation-delay: 0.3s; }
        .spark-5 { animation-delay: 0.4s; }
        .spark-6 { animation-delay: 0.5s; }
        .spark-7 { animation-delay: 0.6s; }
        .spark-8 { animation-delay: 0.7s; }

        @keyframes spark-pop {
          0% { transform: scale(0); opacity: 0; }
          20% { transform: scale(1.5); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }

        /* Background lightning bolts */
        .bg-bolt {
          animation: bg-lightning-strike 1.8s infinite;
          transform-origin: center;
        }

        .bolt-1 { animation-delay: 0s; }
        .bolt-2 { animation-delay: 0.4s; }
        .bolt-3 { animation-delay: 0.8s; }
        .bolt-4 { animation-delay: 1.2s; }

        @keyframes bg-lightning-strike {
          0%, 90%, 100% { opacity: 0; transform: scale(0.8); }
          5%, 15% { opacity: 0.4; transform: scale(1); }
        }

        /* ZAP text effects - popping in and out */
        .zap-text, .zap-text-2, .zap-text-3 {
          animation: text-pop 1.5s infinite;
        }

        .zap-text { animation-delay: 0s; }
        .zap-text-2 { animation-delay: 0.5s; }
        .zap-text-3 { animation-delay: 1s; }

        @keyframes text-pop {
          0%, 70%, 100% { transform: scale(0) rotate(-15deg); opacity: 0; }
          10%, 60% { transform: scale(1) rotate(0deg); opacity: 1; }
          15%, 55% { transform: scale(1.1) rotate(5deg); opacity: 1; }
        }

        /* Loading text glow */
        .loading-text {
          animation: text-glow 2s ease-in-out infinite;
        }

        @keyframes text-glow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(66, 153, 225, 0.5);
          }
          50% {
            text-shadow: 0 0 20px rgba(66, 153, 225, 0.8), 0 0 30px rgba(0, 255, 255, 0.6);
          }
        }
      `}</style>
    </div>
  )
}
