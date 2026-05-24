'use client';

import React from 'react';
import { DomainLogo } from './DomainLogo';

export interface ArticleSource {
  id: string;
  name: string;
  domain: string;
  url: string;
}

export interface DuplicateArticle {
  id: string;
  title: string;
  url: string;
  publishDate: string;
  source: ArticleSource;
}

export interface ArticleData {
  id: string;
  title: string;
  url: string;
  publishDate: string;
  imageUrl?: string;
  aiSummary?: string;
  oneSentenceDigest?: string;
  qualityScore?: number;
  depthScore?: number;
  credibilityScore?: number;
  antiClickbaitScore?: number;
  clickbaitReason?: string;
  trustLevel?: number;
  primarySourceUrl?: string;
  englishSourceUrl?: string;
  autoTags?: string; // JSON string
  sourceChain?: string; // JSON string
  source: ArticleSource;
  duplicates?: DuplicateArticle[];
  rawContent?: string;
  isArticle?: boolean;
}

interface ArticleCardProps {
  article: ArticleData;
  onSelect?: (article: ArticleData) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSelect }) => {
  // Parse JSON data safely
  const tags: string[] = article.autoTags ? JSON.parse(article.autoTags) : [];

  const formattedDate = new Date(article.publishDate).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Image proxy routing
  const proxiedImageUrl = article.imageUrl
    ? `/api/proxy-image?url=${encodeURIComponent(article.imageUrl)}`
    : '/default-article.png';

  // Helper to extract and clean preview text (rawContent first, fallback to aiSummary)
  const previewText = (() => {
    const sourceText = article.rawContent || article.aiSummary || '';
    const cleanText = sourceText
      .replace(/<\/?[^>]+(>|$)/g, '') // strip HTML tags
      .replace(/[\#\*\_\[\]\(\)\`\-\>\+]/g, '') // strip markdown symbols
      .replace(/\s+/g, ' ') // collapse whitespaces
      .trim();
    return cleanText.slice(0, 400);
  })();

  return (
    <article
      onClick={() => onSelect && onSelect(article)}
      className={`glass-card flex flex-col overflow-hidden relative group transition-all duration-300 hover:border-purple-500/30 ${
        onSelect ? 'cursor-pointer hover:shadow-lg hover:shadow-purple-950/10' : ''
      }`}
    >
      {/* Article Image & Badges */}
      {proxiedImageUrl && (
        <div className="w-full h-48 relative overflow-hidden bg-slate-900/40">
          <img
            src={proxiedImageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060c] to-transparent opacity-60"></div>
          
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Source Branding */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DomainLogo name={article.source.name} domain={article.source.domain} size={20} />
            <span className="text-xs font-medium text-purple-300">{article.source.name}</span>
          </div>
          <time className="text-[10px] text-gray-500">{formattedDate}</time>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-100 leading-snug mb-2 group-hover:text-purple-300 transition-colors">
          {article.title}
        </h3>



        {/* Article Summary */}
        {previewText && (
          <p className="mt-2 text-sm text-gray-400 leading-relaxed line-clamp-6">
            {previewText}
          </p>
        )}

        {/* Smart Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-800/60 text-gray-400 border border-gray-700/30"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end mt-5 pt-3 border-t border-gray-800/40">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            Джерело ↗
          </a>
        </div>


      </div>
    </article>
  );
};
