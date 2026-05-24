'use client';

import React, { useEffect, useState } from 'react';
import { ArticleCard, ArticleData } from '../../../components/ArticleCard';
import { ArticlePreviewPanel } from '../../../components/ArticlePreviewPanel';

export default function ArticlesHub() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'quality'>('date');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        isArticle: 'true',
        page: page.toString(),
        sort: sortBy,
      });
      if (search) params.append('search', search);

      const res = await fetch(`/api/articles?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setArticles(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-800/60 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl text-purple-500 font-extrabold">✍️</span>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              Аналітичні Статті <span className="text-purple-500">та Огляди</span>
            </h1>
          </div>
          <p className="text-xs text-gray-400">Спеціальний розділ агрегатора: довгоформатні матеріали, тести заліза, порівняння та детальні гайди</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <a href="/" className="text-gray-400 hover:text-purple-300 transition-colors">
            ◀ На головну
          </a>
          <a href="/hub/ai" className="text-gray-400 hover:text-purple-300 transition-colors">
            🤖 ШІ Хаб
          </a>
          <a href="/hub/hardware" className="text-gray-400 hover:text-purple-300 transition-colors">
            🔌 Залізо Хаб
          </a>
          <a href="/hub/articles" className="text-purple-400 hover:text-purple-300 transition-colors">
            ✍️ Статті
          </a>
        </div>
      </header>

      {/* Search and sorting */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <form onSubmit={handleSearch} className="w-full sm:max-w-md flex gap-2">
          <input
            type="text"
            placeholder="Шукати в статтях та оглядах..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs bg-[#0C0C16] border border-gray-800 focus:border-purple-500/50 px-4 py-2.5 rounded-xl text-white outline-none"
          />
          <button type="submit" className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4.5 py-2.5 rounded-xl">
            Шукати
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">Сортувати:</span>
          <div className="bg-[#0C0C16] border border-gray-800 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                sortBy === 'date' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Найновіші
            </button>
            <button
              onClick={() => setSortBy('quality')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                sortBy === 'quality' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              ШІ-Якість
            </button>
          </div>
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Feed (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {loading && articles.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 4].map((n) => (
                <div key={n} className="glass-card skeleton-shimmer h-72"></div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="glass-card p-12 text-center border border-gray-800/40 bg-[#0C0C16]/20">
              <span className="text-3xl">📭</span>
              <h3 className="text-sm font-bold text-gray-300 mt-3">Жодних лонгрідів чи статей не знайдено</h3>
              <p className="text-xs text-gray-500 mt-1">Очікуйте оновлень стрічки або спробуйте інший пошуковий запит.</p>
            </div>
          ) : (
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
                className="text-xs bg-[#0C0C16] border border-gray-800 text-gray-400 px-4 py-2.5 rounded-xl disabled:opacity-30"
              >
                ◀ Попередня
              </button>
              <span className="text-xs text-gray-500 font-semibold">
                Стор. {page} з {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="text-xs bg-[#0C0C16] border border-gray-800 text-gray-400 px-4 py-2.5 rounded-xl disabled:opacity-30"
              >
                Наступна ▶
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Info Widget / Banner (1/3 width) */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-5 bg-gradient-to-br from-[#120B20]/40 to-[#0A0A16]/50">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2.5">✍️ Про Хаб Статей</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Цей розділ автоматично збирає довгоформатні огляди, детальні аналізи, інструкції, тести та гайди від 14 українських джерел.
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Класифікація здійснюється шляхом перевірки заголовка та змісту статей на спеціальні маркери довгих аналітичних матеріалів.
            </p>
          </div>
        </div>
      </div>

      <ArticlePreviewPanel
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
