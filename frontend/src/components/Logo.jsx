import React from 'react';

export default function Logo({ size = 36, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="BITM Contineo Attendance Logo"
    >
      <defs>
        <linearGradient id="logoBitmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="logoCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      
      {/* Background Badge */}
      <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#logoBitmGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      
      {/* Academic Mortarboard Top */}
      <path d="M50 18 L82 33 L50 47 L18 33 Z" fill="url(#logoCapGrad)" />
      <path d="M50 47 L82 33 L82 41 L50 54 L18 41 L18 33 Z" fill="#ffffff" fillOpacity="0.22" />
      
      {/* Golden Cap Tassel */}
      <path d="M76 36 L76 50 C76 52 73 54 70 54" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      
      {/* Attendance Checkmark Circle */}
      <circle cx="50" cy="56" r="13" fill="#0b0f17" />
      <circle cx="50" cy="56" r="13" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <path d="M44 56.5 L48 60.5 L57 51" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* BITM Monogram */}
      <text 
        x="50" 
        y="85" 
        textAnchor="middle" 
        fill="#ffffff" 
        fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace" 
        fontSize="13" 
        fontWeight="800" 
        letterSpacing="2"
      >
        BITM
      </text>
    </svg>
  );
}
