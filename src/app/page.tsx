'use client';

import React, { useEffect, useState } from 'react';
import { ArticleCard, ArticleData } from '../components/ArticleCard';
import { ArticlePreviewPanel } from '../components/ArticlePreviewPanel';
import { TrendingTopicsWidget, TrendTopic } from '../components/TrendingTopicsWidget';
import { PersonalizationModal, FeedSettings } from '../components/PersonalizationModal';

const defaultSettings: FeedSettings = {
  onlyAi: false,
  onlyHardware: false,
  noApple: false,
  moreLinux: false,
  onlyStartups: false,
  noPromo: true,
  noCrypto: true,
  noSeo: true,
  noShortRewrite: false,
  onlyVerified: false,
};

export default function Home() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'quality'>('date');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedSettings, setFeedSettings] = useState<FeedSettings>(defaultSettings);
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);

  // Quick Tags
  const quickTags = ['AI', 'Hardware', 'Software', 'Science', 'Gaming', 'Startups', 'Ukrainian IT'];

  // Load personalization from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('uaytech_feed_settings');
      if (stored) {
        setFeedSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch articles and trends
  const fetchFeedData = async () => {
    setLoading(true);
    try {
      // 1. Build Query Parameters based on filters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('sort', sortBy);

      if (search) params.append('search', search);

      // Determine Tag logic: priority to activeTag chip, then onlyAi/onlyHardware settings
      if (activeTag) {
        params.append('tag', activeTag);
      } else if (feedSettings.onlyAi) {
        params.append('tag', 'AI');
      } else if (feedSettings.onlyHardware) {
        params.append('tag', 'Hardware');
      } else if (feedSettings.onlyStartups) {
        params.append('tag', 'Startups');
      }

      // Exclusions
      if (feedSettings.noApple) {
        params.append('excludeTag', 'Apple');
      }

      // Quality filters
      const qualityFlags: string[] = [];
      if (feedSettings.noPromo) qualityFlags.push('noPromo');
      if (feedSettings.noCrypto) qualityFlags.push('noCrypto');
      if (feedSettings.noSeo) qualityFlags.push('noSeo');
      if (feedSettings.noShortRewrite) qualityFlags.push('noShortRewrite');
      
      if (qualityFlags.length > 0) {
        params.append('qualityFilters', qualityFlags.join(','));
      }

      if (feedSettings.onlyVerified) {
        params.append('trustMin', '4');
      }

      // Fetch Articles
      const articlesRes = await fetch(`/api/articles?${params.toString()}`);
      const articlesJson = await articlesRes.json();
      if (articlesJson.success) {
        setArticles(articlesJson.data);
        setTotalPages(articlesJson.pagination.totalPages);
      }

      // Fetch Trends
      const trendsRes = await fetch('/api/trends');
      const trendsJson = await trendsRes.json();
      if (trendsJson.success) {
        setTrends(trendsJson.data);
      }
    } catch (err) {
      console.error('Error loading feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedData();
  }, [page, sortBy, activeTag, feedSettings]);

  // Handle Search Input (debounce/enter key)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFeedData();
  };

  const handleSettingsChange = (newSettings: FeedSettings) => {
    setFeedSettings(newSettings);
    setPage(1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
      {/* Premium minimal header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-800/60 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl text-purple-500 font-extrabold animate-[pulse_2s_infinite]">▲</span>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              UA<span className="text-purple-500">Tech</span> Aggregator
            </h1>
          </div>
          <p className="text-xs text-gray-400">Преміальний агрегатор новин та оглядів української ІТ-індустрії</p>
        </div>

        {/* Header navigation hubs */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <a href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
            Головний Фід
          </a>
          <a href="/hub/ai" className="text-gray-400 hover:text-purple-300 transition-colors">
            🤖 ШІ Хаб
          </a>
          <a href="/hub/hardware" className="text-gray-400 hover:text-purple-300 transition-colors">
            🔌 Залізо Хаб
          </a>
          <a href="/hub/articles" className="text-gray-400 hover:text-purple-300 transition-colors font-semibold">
            ✍️ Статті
          </a>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border border-purple-800/40 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚙️</span> Фільтри
          </button>
        </div>
      </header>

      {/* Control panel: search & tags */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-md flex items-center gap-2">
            <input
              type="text"
              placeholder="Пошук новин..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs bg-[#0C0C16] border border-gray-800 focus:border-purple-500/50 px-4 py-2.5 rounded-xl text-white outline-none transition-colors"
            />
            <button
              type="submit"
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Шукати
            </button>
          </form>

          {/* Sort selection */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">Сортувати:</span>
            <div className="bg-[#0C0C16] border border-gray-800 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  sortBy === 'date' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Найновіші
              </button>
              <button
                onClick={() => setSortBy('quality')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  sortBy === 'quality' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                ШІ-Якість
              </button>
            </div>
          </div>
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mr-1">Швидкі теги:</span>
          <button
            onClick={() => { setActiveTag(''); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTag === '' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-gray-900/60 text-gray-400 border border-transparent hover:border-gray-800'
            }`}
          >
            Усі
          </button>
          {quickTags.map((tag) => {
            const isSelected = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => { setActiveTag(isSelected ? '' : tag); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'bg-gray-900/60 text-gray-400 border border-transparent hover:border-gray-800'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Layout (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Feed (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {loading && articles.length === 0 ? (
            // Shimmer Loading States
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card skeleton-shimmer h-72"></div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            // Empty State
            <div className="glass-card p-12 text-center border border-gray-800/40">
              <span className="text-3xl">📭</span>
              <h3 className="text-sm font-bold text-gray-300 mt-3">Жодних новин не знайдено</h3>
              <p className="text-xs text-gray-500 mt-1">Спробуйте змінити фільтри якості або параметри пошуку.</p>
            </div>
          ) : (
            // Article Grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} onSelect={setSelectedArticle} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="text-xs bg-[#0C0C16] border border-gray-800 hover:border-purple-500/30 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                ◀ Попередня
              </button>
              <span className="text-xs text-gray-500 font-semibold">
                Стор. {page} з {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="text-xs bg-[#0C0C16] border border-gray-800 hover:border-purple-500/30 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Наступна ▶
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Widgets / Sidebar (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Trending Topics Accoridon widget */}
          <TrendingTopicsWidget trends={trends} />

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800/40 mt-12 pt-6 text-center text-xs text-gray-600">
        <p>&copy; {new Date().getFullYear()} UATech Aggregator. Усі права застережено за відповідними авторами.</p>
        <p className="mt-1.5">Швидкий та мінімалістичний агрегатор українського тех-простору.</p>
      </footer>

      {/* Personalization configuration modal */}
      <PersonalizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSettingsChange={handleSettingsChange}
      />

      <ArticlePreviewPanel
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
