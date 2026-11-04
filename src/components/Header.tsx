import React from 'react';
import { TabType, GuildInfo } from '../bot/types';
import { Terminal, Bot, Sparkles, ExternalLink } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeGuild: GuildInfo;
  onInviteBot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeGuild,
  onInviteBot
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100 z-10 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#overview"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('overview');
        }}
        className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
      >
        AegisBot Studio
      </a>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'overview' ? 'text-indigo-400 font-semibold' : ''
          }`}
        >
          Tổng Quan
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('commands')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'commands' ? 'text-indigo-400 font-semibold' : ''
          }`}
        >
          Lệnh Discord (! & /)
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('auto-responder')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'auto-responder' ? 'text-indigo-400 font-semibold' : ''
          }`}
        >
          Tự Động Phản Hồi
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('music')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'music' ? 'text-indigo-400 font-semibold' : ''
          }`}
        >
          Phát Nhạc 24/7
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('bot-deploy')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'bot-deploy' ? 'text-indigo-400 font-semibold' : ''
          }`}
        >
          Chạy 24/24 & Kết Nối
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onInviteBot}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors whitespace-nowrap shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Kết Nối Server Của Tôi</span>
        </button>
      </div>
    </header>
  );
};
