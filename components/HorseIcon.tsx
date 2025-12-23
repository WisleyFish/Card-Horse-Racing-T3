
import React from 'react';
import { HorseColorConfig } from '../constants';

interface HorseIconProps {
  config: HorseColorConfig;
  name: string;
  size?: number;
}

export const HorseIcon: React.FC<HorseIconProps> = ({ config, name, size = 40 }) => {
  const { body, mane, belly, hoof } = config;
  
  return (
    <svg 
      width={size * 1.5} 
      height={size * 1.5} 
      viewBox="0 0 120 120" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      {/* Shadow */}
      <ellipse cx="60" cy="100" rx="40" ry="6" fill="rgba(0,0,0,0.1)" />

      {/* Tail */}
      <path 
        d="M25 70 Q5 60 5 80 Q5 95 25 85 Z" 
        fill={mane} 
        stroke="rgba(0,0,0,0.15)" 
        strokeWidth="1" 
      />

      {/* Secondary Legs (Behind) */}
      <g fill={body} stroke="rgba(0,0,0,0.15)" strokeWidth="1">
        <path d="M40 85 Q35 100 42 100 L50 100 Q55 100 50 85 Z" opacity="0.8" />
        <path d="M85 82 Q92 98 100 94 L104 90 Q100 82 92 82 Z" opacity="0.8" />
      </g>
      <g fill={hoof}>
        <path d="M42 98 L50 98 Q52 100 50 100 L42 100 Z" opacity="0.8" />
        <path d="M98 94 L103 91 Q105 93 102 95 L97 97 Z" opacity="0.8" />
      </g>

      {/* Neck */}
      <g>
        <path 
          d="M72 75 L95 40 L108 58 L94 78 Z" 
          fill={body} 
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1"
        />
        <path 
          d="M85 55 Q70 30 100 25 Q110 25 110 45 L95 65 Z" 
          fill={mane} 
          stroke="rgba(0,0,0,0.1)"
        />
      </g>

      {/* Main Body */}
      <path 
        d="M30 75 Q30 55 60 55 Q90 55 90 82 Q90 96 60 96 Q30 96 30 75 Z" 
        fill={body} 
        stroke="rgba(0,0,0,0.2)" 
        strokeWidth="1.5" 
      />
      
      {/* Belly Highlight */}
      <path 
        d="M40 82 Q40 70 60 70 Q80 70 80 82 Q80 92 60 92 Q40 92 40 82 Z" 
        fill={belly} 
        opacity="0.6"
      />

      {/* Primary Legs (Front) */}
      <g fill={body} stroke="rgba(0,0,0,0.15)" strokeWidth="1">
        <path d="M45 88 Q40 105 48 105 L58 105 Q63 105 58 88 Z" />
        <path d="M80 82 Q88 100 98 96 L102 92 Q98 82 88 82 Z" />
      </g>
      <g fill={hoof}>
        <path d="M48 103 L58 103 Q60 105 58 105 L48 105 Z" />
        <path d="M96 95 L101 92 Q103 94 100 96 L95 98 Z" />
      </g>

      {/* Head Group */}
      <g transform="translate(10, -5)">
        {/* 1. Head Base - Circle for Q-style look */}
        <circle 
          cx="95" 
          cy="45" 
          r="19" 
          fill={body} 
          stroke="rgba(0,0,0,0.2)" 
          strokeWidth="1.5" 
        />
        
        {/* 2. Muzzle - Diagonal orientation */}
        <ellipse 
          cx="110" 
          cy="60" 
          rx="16" 
          ry="11" 
          fill={body} 
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
          transform="rotate(35, 110, 60)" 
        />

        {/* Blush */}
        <ellipse cx="98" cy="55" rx="5" ry="3" fill="#ff9999" opacity="0.4" transform="rotate(35, 98, 55)" />

        {/* Eye & Eyebrow - Moved lower to be more "inside" the face */}
        <g>
           <path 
            d="M102 42 Q108 37 114 42" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
           <circle cx="108" cy="41" r="1.8" fill="#1e293b" />
        </g>
        
        {/* Ear */}
        <path d="M85 30 Q80 15 95 25 Z" fill={body} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />

        {/* Nostrils & Smile */}
        <circle cx="118" cy="65" r="1.5" fill="rgba(0,0,0,0.3)" />
        <path d="M112 72 Q118 74 122 66" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
