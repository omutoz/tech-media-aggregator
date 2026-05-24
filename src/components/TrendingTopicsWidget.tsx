'use client';

import React, { useState } from 'react';
import { ArticleData } from './ArticleCard';

export interface TrendTopic {
  id: string;
  topicName: string;
  weeklySummary?: string;
  updatedAt: string;
  articles: ArticleData[];
}

interface TrendingTopicsWidgetProps {
  trends: TrendTopic[];
}

export const TrendingTopicsWidget: React.FC<TrendingTopicsWidgetProps> = ({ trends }) => {
  const [activeTrendId, setActiveTrendId] = useState<string | null>(null);

  if (trends.length === 0) {
    return (
      <div className="glass-card p-5 bg-[#0C0C16]/50">
        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">🔥 Гарячі тренди</h3>
        <p className="text-xs text-gray-500 italic">Сьогодні ще не сформувалося достатньо трендів. Очікуємо нових новин.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 bg-[#0C0C16]/50 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>🔥</span> Гарячі тренди тижня
      </h3>

      <div className="flex flex-col gap-2">
        {trends.map((trend) => {
          const isActive = activeTrendId === trend.id;
          return (
            <div
              key={trend.id}
              className={`border border-gray-800/40 rounded-xl overflow-hidden transition-all duration-300 ${
                isActive ? 'bg-[#121222]/80 border-purple-500/20' : 'bg-[#0B0B14]/40 hover:bg-[#10101E]/60'
              }`}
            >
              {/* Trend Header Accordion Button */}
              <button
                onClick={() => setActiveTrendId(isActive ? null : trend.id)}
                className="w-full text-left px-4 py-3 flex items-center justify-between text-xs cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">#{trend.topicName}</span>
                  <span className="bg-[#1C1B34] text-purple-300 text-[10px] px-2 py-0.5 rounded-full">
                    {trend.articles.length} джерел(а)
                  </span>
                </div>
                <span className={`text-gray-500 transition-transform ${isActive ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Trend Body */}
              {isActive && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-800/30 text-xs">
                  {/* Weekly summary by Gemini 3.1 Pro */}
                  {trend.weeklySummary ? (
                    <div className="mb-4">
                      <div className="text-[10px] uppercase font-bold text-purple-300 mb-1.5 flex items-center gap-1">
                        <span>📊</span> Хроніка розвитку подій (ШІ-Підсумок):
                      </div>
                      <p className="text-gray-300 leading-relaxed bg-[#0A0A14] p-3 rounded-lg border border-gray-800/40">
                        {trend.weeklySummary}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic mb-3">
                      ШІ ще збирає аналітику про розвиток цієї події...
                    </p>
                  )}

                  {/* Chronological list of developments */}
                  <div className="space-y-3">
                    <div className="text-[10px] uppercase font-bold text-gray-500">Публікації у медіа:</div>
                    <div className="relative pl-3 border-l border-purple-500/20 space-y-3.5">
                      {trend.articles.map((article) => (
                        <div key={article.id} className="relative">
                          {/* Dot connector */}
                          <span className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-[#06060c]"></span>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-0.5">
                            <span className="text-purple-300 font-semibold">{article.source.name}</span>
                            <span>•</span>
                            <span>
                              {new Date(article.publishDate).toLocaleDateString('uk-UA', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-purple-300 transition-colors font-medium hover:underline block leading-snug"
                          >
                            {article.title}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TrendingTopicsWidget;
