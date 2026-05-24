'use client';

import React, { useEffect, useState } from 'react';
import { ArticleData } from './ArticleCard';
import { DomainLogo } from './DomainLogo';

interface ArticlePreviewPanelProps {
  article: ArticleData | null;
  onClose: () => void;
}

function getPreviewParagraphs(content: string, count: number = 4): string[] {
  if (!content) return [];
  return content
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .slice(0, count);
}

export const ArticlePreviewPanel: React.FC<ArticlePreviewPanelProps> = ({
  article,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (article) {
      setMounted(true);
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setMounted(false), 300); // matches duration-300
      return () => clearTimeout(timer);
    }
  }, [article]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (article) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [article, onClose]);

  if (!mounted || !article) return null;

  // Formatting date
  const formattedDate = new Date(article.publishDate).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tags: string[] = article.autoTags ? JSON.parse(article.autoTags) : [];

  // Paragraph extraction & fallbacks
  const rawContent = article.rawContent;
  const fallbackContent = article.aiSummary; // MVP summary contains short RSS text

  let contentToUse = rawContent || '';
  
  if (!contentToUse || contentToUse.trim().length < 100) {
    contentToUse = fallbackContent || '';
  }

  const paragraphs = getPreviewParagraphs(contentToUse, 4);
  const isEmpty = paragraphs.length === 0;

  // Image proxy routing
  const proxiedImageUrl = article.imageUrl
    ? `/api/proxy-image?url=${encodeURIComponent(article.imageUrl)}`
    : null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity duration-300 cursor-pointer ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Side panel / Bottom sheet */}
      <div
        className={`fixed z-[101] bg-[#0C0C16] border-gray-800/80 shadow-2xl flex flex-col transition-all duration-300 ease-out 
          /* Mobile styling (Bottom sheet) */
          bottom-0 left-0 right-0 h-[85vh] w-full rounded-t-3xl border-t border-r-0 border-l-0
          /* Desktop styling (Right side panel) */
          md:top-0 md:bottom-0 md:right-0 md:left-auto md:h-full md:w-[500px] md:rounded-none md:border-l md:border-t-0
          ${animate ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-gray-800/60 p-5">
          <div className="flex items-center gap-2.5">
            <DomainLogo name={article.source.name} domain={article.source.domain} size={24} />
            <span className="text-xs font-black tracking-wider text-purple-400 uppercase">
              {article.source.name}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрити панель"
            className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Cover image if available */}
          {proxiedImageUrl && (
            <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-900/40 border border-gray-800/40 relative">
              <img
                src={proxiedImageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C16] to-transparent opacity-40"></div>
            </div>
          )}

          <div>
            <time className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-2">
              {formattedDate}
            </time>
            <h2 className="text-base md:text-lg font-black text-white leading-snug">
              {article.title}
            </h2>
          </div>

          {/* Badges / metadata row */}
          <div className="flex flex-wrap gap-2 items-center">
            {article.trustLevel && (
              <div className="flex items-center gap-1.5 bg-gray-900/60 border border-gray-800/60 px-3 py-1 rounded-xl">
                <span className="text-[10px] text-gray-400 font-medium">Довіра:</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    article.trustLevel >= 4
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/30'
                      : article.trustLevel >= 3
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/30'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/30'
                  }`}
                >
                  {article.trustLevel}/5
                </span>
              </div>
            )}
            
            {article.isArticle && (
              <span className="bg-purple-950/80 text-purple-300 border border-purple-800/30 px-3 py-1 rounded-xl text-[10px] font-bold">
                ✍️ Стаття
              </span>
            )}
          </div>

          {/* Article Text Preview */}
          <div className="border-t border-gray-800/40 pt-5">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-gray-800/80 rounded-2xl bg-[#08080C]/40 my-2">
                <span className="text-2xl mb-2.5">📭</span>
                <p className="text-xs font-bold text-gray-300">Попередній перегляд недоступний</p>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed max-w-xs">
                  Для ознайомлення з матеріалом, будь ласка, відкрийте повну версію на сайті джерела.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-normal">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="transition-colors duration-200 hover:text-white">
                    {p}
                  </p>
                ))}
                {/* Fading bottom indicator */}
                <div className="h-14 bg-gradient-to-t from-[#0C0C16] to-transparent pointer-events-none mt-2 relative -bottom-2"></div>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-gray-900/80 text-gray-400 border border-gray-800/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Footer with CTA Button */}
        <div className="border-t border-gray-800/60 p-5 bg-[#0A0A12]/80 backdrop-blur-sm">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center block text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
          >
            Читати повністю на {article.source.name} ↗
          </a>
        </div>
      </div>
    </>
  );
};
