'use client';

import React, { useEffect, useState } from 'react';

export interface RadarItem {
  id: string;
  englishTitle: string;
  englishUrl: string;
  englishSource: string;
  translatedTitle: string;
  translatedSummary: string;
  publishDate: string;
}

export const RadarWidget: React.FC = () => {
  const [items, setItems] = useState<RadarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRadar() {
      try {
        const res = await fetch('/api/radar');
        const json = await res.json();
        if (json.success) {
          setItems(json.data);
        }
      } catch (err) {
        console.error('Failed loading radar:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRadar();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-5 bg-[#0C0C16]/50 skeleton-shimmer h-40">
        <div className="h-4 bg-gray-800 rounded w-1/4 mb-3"></div>
        <div className="h-3 bg-gray-800 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-800 rounded w-5/6"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-5 bg-[#0A0E17]/40 border-cyan-500/20 relative overflow-hidden">
      {/* Decorative scan pulse effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-[pulse_2s_infinite]"></div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>📡</span> Глобальний радар
        </h3>
        <span className="text-[9px] bg-cyan-950/40 text-cyan-300 border border-cyan-900/40 px-2 py-0.5 rounded-full uppercase tracking-widest">
          Ексклюзив
        </span>
      </div>

      <p className="text-[10px] text-gray-500 mb-3.5 leading-snug">
        Теми, що бурхливо обговорюють на Заході (TechCrunch, Wired, The Verge), але про які ще не написало жодне українське ІТ-видання:
      </p>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border-b border-gray-800/40 last:border-0 pb-3.5 last:pb-0">
            {/* Translated headline */}
            <h4 className="text-xs font-bold text-gray-200 mb-1 leading-snug hover:text-cyan-400 transition-colors">
              {item.translatedTitle}
            </h4>

            {/* Translation description */}
            <p className="text-[11px] text-gray-400 leading-normal mb-2">
              {item.translatedSummary}
            </p>

            {/* Original link details */}
            <div className="flex items-center justify-between text-[9px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-300/80 font-semibold">{item.englishSource}</span>
                <span>•</span>
                <span className="truncate max-w-[120px]" title={item.englishTitle}>
                  {item.englishTitle}
                </span>
              </div>
              <a
                href={item.englishUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
              >
                Читати оригінал (EN) ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default RadarWidget;
