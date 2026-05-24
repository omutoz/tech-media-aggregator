'use client';

import React, { useEffect, useState } from 'react';

export interface TimeCapsuleData {
  success: boolean;
  date: string;
  headlines: { title: string; sourceName: string }[];
  retrospective: string;
}

export const TimeCapsuleWidget: React.FC = () => {
  const [data, setData] = useState<TimeCapsuleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCapsule() {
      try {
        const res = await fetch('/api/time-capsule');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed loading time capsule:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCapsule();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-5 bg-[#0C0C16]/50 skeleton-shimmer h-48">
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-4/5"></div>
      </div>
    );
  }

  if (!data || data.headlines.length === 0) {
    return null;
  }

  // Format historical date
  const histDate = new Date(data.date);
  histDate.setFullYear(histDate.getFullYear() - 1);
  const formattedHistoricalDate = histDate.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="glass-card p-5 bg-gradient-to-br from-[#120B20]/60 to-[#0A0A16]/50 border-purple-500/25 relative overflow-hidden">
      {/* Visual glowing aura inside card */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
      
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⏳</span> Машина часу
        </h3>
        <span className="text-[10px] bg-purple-950/40 text-purple-300 border border-purple-900/40 px-2 py-0.5 rounded-full">
          Рік тому: {formattedHistoricalDate}
        </span>
      </div>

      {/* Retrospective Note */}
      <div className="mb-4">
        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1">
          ШІ-Ретроспектива (Як це пройшло перевірку часом):
        </div>
        <p className="text-xs text-gray-300 leading-relaxed bg-[#0A0714] p-3 rounded-lg border border-purple-950/20">
          {data.retrospective}
        </p>
      </div>

      {/* Headlines List */}
      <div>
        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-2">
          Про що тоді писали:
        </div>
        <ul className="space-y-2 text-xs">
          {data.headlines.map((headline, idx) => (
            <li key={idx} className="flex gap-2 text-gray-400">
              <span className="text-purple-500">•</span>
              <div>
                <span className="text-gray-500 text-[10px] font-semibold mr-1">
                  [{headline.sourceName}]
                </span>
                <span className="hover:text-purple-300 transition-colors leading-tight">
                  {headline.title}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default TimeCapsuleWidget;
