import React from 'react';

/**
 * Logo components for Snabb.
 * Fredoka font is loaded globally via next/font in layout.tsx.
 * The SVG uses font-family: 'Fredoka', sans-serif directly.
 */

export const Logo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 350 120" xmlns="http://www.w3.org/2000/svg" className={className} style={{ fontFamily: 'inherit' }}>
        <defs>
            <linearGradient id="snabb-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#E65100" />
            </linearGradient>
        </defs>
        {/* Organic blob */}
        <path
            transform="translate(80, 60) scale(0.65)"
            d="M37.5,-64.8C47.8,-53.4,54.7,-38.7,60.6,-23.4C66.5,-8.1,71.4,7.8,67.7,21.8C64,35.8,51.8,47.9,38.1,56.5C24.4,65.1,9.2,70.2,-5.9,71.4C-21,72.6,-36.1,69.9,-48.9,61.1C-61.7,52.3,-72.3,37.4,-76.5,20.8C-80.7,4.2,-78.6,-14,-70.7,-28.9C-62.8,-43.8,-49,-55.4,-34.5,-62.7C-20,-70,-4.7,-73,11,-72C26.7,-71,37.5,-64.8,37.5,-64.8Z"
            fill="url(#snabb-orange-grad)"
            style={{ filter: 'drop-shadow(0px 6px 8px rgba(230, 81, 0, 0.22))' }}
        />
        <text
            x="80" y="56"
            dominantBaseline="middle" textAnchor="middle"
            fontFamily="'Fredoka', 'Trebuchet MS', 'Arial Rounded MT Bold', sans-serif"
            fontWeight="700" fontSize="110" fill="#FFFFFF"
        >s</text>
        <text
            x="128" y="64"
            dominantBaseline="middle" textAnchor="start"
            fontFamily="'Fredoka', 'Trebuchet MS', 'Arial Rounded MT Bold', sans-serif"
            fontWeight="700" fontSize="76" fill="currentColor" letterSpacing="-2"
        >nabb</text>
    </svg>
);

