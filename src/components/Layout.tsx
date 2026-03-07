import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import SettingsModal from './SettingsModal';
import { MessageCircle } from 'lucide-react';
import ircLogoIcon from '@/assets/irc-logo-icon.svg';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/navigator', label: 'Navigator' },
  { path: '/resources', label: 'Resources' },
];

// Site config for cross-site navigation
const isGitHub = typeof window !== 'undefined' && window.location.hostname === 'bobkitchen.github.io';

const SITES = {
  classification: {
    label: 'Emergency Classification',
    shortLabel: 'Classification',
    description: 'Classify and track emergency responses',
    url: isGitHub ? '/emergency-classification/' : 'https://bobkitchen.github.io/emergency-classification/',
  },
  navigator: {
    label: 'Response Navigator',
    shortLabel: 'Navigator',
    description: 'Emergency response guidance and tasks',
    url: isGitHub ? '/emergency-response-navigator/' : '/',
  },
};

function SiteSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0 mr-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-irc-gray-700 rounded-md text-xs font-semibold uppercase tracking-wider text-irc-gray-300 hover:text-white hover:border-irc-gray-500 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>Navigator</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 12 12"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 min-w-[260px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <a
            href={SITES.navigator.url}
            className="block px-4 py-3 bg-amber-50 border-l-[3px] border-l-irc-yellow"
          >
            <span className="block text-sm font-bold text-black">{SITES.navigator.label}</span>
            <span className="block text-xs text-gray-500 mt-0.5">{SITES.navigator.description}</span>
          </a>
          <a
            href={SITES.classification.url}
            className="block px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="block text-sm font-bold text-black">{SITES.classification.label}</span>
            <span className="block text-xs text-gray-500 mt-0.5">{SITES.classification.description}</span>
          </a>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — IRC black bar with yellow accents */}
      <header className="bg-black text-white shadow-md sticky top-0 z-40 border-b-4 border-b-irc-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Site Switcher + Logo / Brand */}
            <div className="flex items-center">
              <SiteSwitcher />
              <Link to="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0 tracking-irc-tight">
                <img src={ircLogoIcon} alt="IRC" className="h-8 w-8" />
                <span className="hidden sm:inline">Emergency Response Navigator</span>
                <span className="sm:hidden">ERN</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                      ? 'bg-irc-yellow text-black font-bold'
                      : 'text-irc-gray-200 hover:bg-irc-gray-700 hover:text-white font-bold'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-irc-yellow text-black hover:bg-irc-yellow-light transition-colors"
                title="Ask Albert"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline font-bold">Ask Albert</span>
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-md hover:bg-irc-gray-700 transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover:bg-irc-gray-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-irc-yellow text-black'
                      : 'text-irc-gray-200 hover:bg-irc-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex relative">
        <main className={`flex-1 transition-all duration-300 ${chatOpen ? 'mr-0 lg:mr-[32rem]' : ''}`}>
          {children}
        </main>

        {/* Chat Panel */}
        <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} onOpenSettings={() => setSettingsOpen(true)} />
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Footer */}
      <footer className="bg-irc-gray-50 border-t border-irc-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-irc-gray-500">
          <div className="flex items-center gap-2">
            <img src={ircLogoIcon} alt="IRC" className="h-5 w-5 opacity-60" />
            <span>Emergency Response Navigator</span>
          </div>
          <span>Based on IRC Emergency Management Guidelines v2.0</span>
        </div>
      </footer>
    </div>
  );
}
