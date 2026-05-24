'use client';

import React, { useEffect, useState } from 'react';

export interface FeedSettings {
  // Topics Axis
  onlyAi: boolean;
  onlyHardware: boolean;
  noApple: boolean;
  moreLinux: boolean;
  onlyStartups: boolean;

  // Quality Axis
  noPromo: boolean;
  noCrypto: boolean;
  noSeo: boolean;
  noShortRewrite: boolean;
  onlyVerified: boolean;
}

const defaultSettings: FeedSettings = {
  onlyAi: false,
  onlyHardware: false,
  noApple: false,
  moreLinux: false,
  onlyStartups: false,

  noPromo: true, // Default to true to filter junk out of the box
  noCrypto: true,
  noSeo: true,
  noShortRewrite: false,
  onlyVerified: false,
};

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: FeedSettings) => void;
}

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<FeedSettings>(defaultSettings);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('uaytech_feed_settings');
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed loading settings from localStorage:', e);
    }
  }, [isOpen]);

  const handleCheckboxChange = (key: keyof FeedSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    // Mutually exclusive tags safety
    if (key === 'onlyAi' && updated.onlyAi) {
      updated.onlyHardware = false;
    }
    if (key === 'onlyHardware' && updated.onlyHardware) {
      updated.onlyAi = false;
    }

    setSettings(updated);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('uaytech_feed_settings', JSON.stringify(settings));
      onSettingsChange(settings);
      onClose();
    } catch (e) {
      console.error('Failed saving settings:', e);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md bg-[#0A0A14] border border-purple-500/20 p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800/60 mb-5">
          <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <span>⚙️</span> Персоналізація фіду
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Axis 1: Topics Filter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">
              Тематика (Що показувати)
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.onlyAi}
                  onChange={() => handleCheckboxChange('onlyAi')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Тільки Штучний Інтелект</div>
                  <div className="text-[10px] text-gray-500">Залишає в стрічці лише новини з тегом #AI</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.onlyHardware}
                  onChange={() => handleCheckboxChange('onlyHardware')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Тільки Залізо та Гаджети</div>
                  <div className="text-[10px] text-gray-500">Залишає в стрічці лише новини про комп'ютери та техніку</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.noApple}
                  onChange={() => handleCheckboxChange('noApple')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Без новин Apple</div>
                  <div className="text-[10px] text-gray-500">Виключає будь-які згадки про iPhone, Mac та екосистему iOS</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.moreLinux}
                  onChange={() => handleCheckboxChange('moreLinux')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Більше Linux / Open Source</div>
                  <div className="text-[10px] text-gray-500">Пріоритет матеріалам про відкритий софт</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.onlyStartups}
                  onChange={() => handleCheckboxChange('onlyStartups')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Тільки українські стартапи</div>
                  <div className="text-[10px] text-gray-500">Залишає в стрічці виключно матеріали про IT-індустрію України</div>
                </div>
              </label>
            </div>
          </div>

          {/* Axis 2: Quality Filter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">
              ШІ-фільтри якості (Шлакоріз)
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.noPromo}
                  onChange={() => handleCheckboxChange('noPromo')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Приховати рекламні псевдоновини</div>
                  <div className="text-[10px] text-gray-500">Блокує приховану рекламу, партнерські прес-релізи та джинсу</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.noCrypto}
                  onChange={() => handleCheckboxChange('noCrypto')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Приховати крипто-хайп та спам</div>
                  <div className="text-[10px] text-gray-500">Прибирає рекламу токенів, курсів валют, прогнози трейдерів</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.noSeo}
                  onChange={() => handleCheckboxChange('noSeo')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Приховати SEO-сміття</div>
                  <div className="text-[10px] text-gray-500">Видаляє пусті тексти, написані виключно під пошукові запити</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.noShortRewrite}
                  onChange={() => handleCheckboxChange('noShortRewrite')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Приховати короткі рерайти</div>
                  <div className="text-[10px] text-gray-500">Фільтрує копіпаст з інших ресурсів без авторської аналітики</div>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.onlyVerified}
                  onChange={() => handleCheckboxChange('onlyVerified')}
                  className="rounded border-gray-700 bg-gray-800/80 text-purple-600 focus:ring-purple-500/30"
                />
                <div>
                  <div className="font-semibold text-gray-200">Тільки перевірені новини (Висока довіра)</div>
                  <div className="text-[10px] text-gray-500">Лише публікації з рівнем довіри ШІ ≥ 4 (посилання на першоджерела)</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800/60 mt-5">
          <button
            onClick={handleReset}
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Скинути до початкових
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-gray-300 px-3.5 py-2 rounded-lg transition-colors"
            >
              Скасувати
            </button>
            <button
              onClick={handleSave}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4.5 py-2 rounded-lg transition-colors"
            >
              Застосувати фільтри
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PersonalizationModal;
