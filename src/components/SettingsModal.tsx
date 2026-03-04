import { useState, useEffect } from 'react';
import { getApiKey, setApiKey, getModel, setModel, MODELS, type ModelOption } from '@/lib/chat';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TIER_LABELS: Record<ModelOption['tier'], { label: string; color: string; desc: string }> = {
  premium: { label: '★ Premium', color: 'text-amber-600', desc: 'Best quality, higher cost' },
  standard: { label: '● Standard', color: 'text-blue-600', desc: 'Great balance of quality and cost' },
  budget: { label: '○ Budget', color: 'text-green-600', desc: 'Very affordable' },
  free: { label: '◇ Free', color: 'text-gray-500', desc: 'No cost, rate limited' },
};

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [key, setKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4-6');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKey(getApiKey() || '');
      setSelectedModel(getModel());
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(key.trim());
    setModel(selectedModel);
    setSaved(true);
    setTimeout(() => onClose(), 800);
  };

  const selectedModelInfo = MODELS.find(m => m.id === selectedModel);

  // Group models by tier
  const tiers: ModelOption['tier'][] = ['premium', 'standard', 'budget', 'free'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black tracking-irc-tight">Settings</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-irc-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-irc-gray-700 mb-1">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full px-3 py-2 border border-irc-gray-200 rounded-md text-sm focus:ring-2 focus:ring-irc-yellow focus:border-transparent"
            />
            <p className="mt-1 text-xs text-irc-gray-500">
              Get a key at{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                openrouter.ai/keys
              </a>
              . Stored locally in your browser only.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-irc-gray-700 mb-1">
              AI Model
            </label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-irc-gray-200 rounded-md text-sm focus:ring-2 focus:ring-irc-yellow focus:border-transparent"
            >
              {tiers.map(tier => {
                const tierModels = MODELS.filter(m => m.tier === tier);
                if (tierModels.length === 0) return null;
                const info = TIER_LABELS[tier];
                return (
                  <optgroup key={tier} label={`${info.label} — ${info.desc}`}>
                    {tierModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {selectedModelInfo && (
              <p className="mt-1 text-xs text-irc-gray-500">
                <span className={TIER_LABELS[selectedModelInfo.tier].color + ' font-medium'}>
                  {TIER_LABELS[selectedModelInfo.tier].label}
                </span>
                {' — '}
                {selectedModelInfo.description}
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-2 rounded-md text-sm font-bold transition-colors ${
              saved
                ? 'bg-black text-irc-yellow'
                : 'bg-irc-yellow text-black hover:bg-irc-yellow-light'
            }`}
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
