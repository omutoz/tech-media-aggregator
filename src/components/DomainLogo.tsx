import React from 'react';

interface DomainLogoProps {
  name: string;
  domain: string;
  size?: number;
}

export const DomainLogo: React.FC<DomainLogoProps> = ({ name, domain, size = 24 }) => {
  // A dictionary mapping domains to sleek custom inline SVGs/styles
  const logoColors: Record<string, { bg: string; text: string; char: string }> = {
    'itc.ua': { bg: 'linear-gradient(135deg, #FF6B00 0%, #FF8A00 100%)', text: '#FFFFFF', char: 'I' },
    'mezha.ua': { bg: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)', text: '#FFFFFF', char: 'M' },
    'proit.ua': { bg: 'linear-gradient(135deg, #FF3366 0%, #FF0033 100%)', text: '#FFFFFF', char: 'P' },
    'ain.ua': { bg: 'linear-gradient(135deg, #111111 0%, #333333 100%)', text: '#FFFFFF', char: 'A' },
    'dev.ua': { bg: 'linear-gradient(135deg, #00FFCC 0%, #009977 100%)', text: '#0A0A0A', char: 'D' },
    'gagadget.com': { bg: 'linear-gradient(135deg, #9933FF 0%, #6600CC 100%)', text: '#FFFFFF', char: 'G' },
    'dou.ua': { bg: 'linear-gradient(135deg, #FF0000 0%, #990000 100%)', text: '#FFFFFF', char: 'Д' },
    'speka.media': { bg: 'linear-gradient(135deg, #FFFF00 0%, #FFCC00 100%)', text: '#0A0A0A', char: 'S' },
    'techno.nv.ua': { bg: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)', text: '#FFFFFF', char: 'N' },
    'tech.liga.net': { bg: 'linear-gradient(135deg, #0000FF 0%, #000088 100%)', text: '#FFFFFF', char: 'L' },
    'itechua.com': { bg: 'linear-gradient(135deg, #00FF00 0%, #008800 100%)', text: '#FFFFFF', char: 'i' },
    'overclockers.ua': { bg: 'linear-gradient(135deg, #FF9900 0%, #FF6600 100%)', text: '#FFFFFF', char: 'O' },
    'highload.tech': { bg: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', text: '#FFFFFF', char: 'H' },
    'root-nation.com': { bg: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', text: '#FFFFFF', char: 'R' },
  };

  const config = logoColors[domain] || {
    bg: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
    text: '#FFFFFF',
    char: name.charAt(0).toUpperCase(),
  };

  return (
    <div
      style={{
        background: config.bg,
        color: config.text,
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.55}px`,
        fontWeight: 'bold',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        userSelect: 'none',
      }}
      title={name}
    >
      {config.char}
    </div>
  );
};
