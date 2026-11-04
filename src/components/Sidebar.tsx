import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  Music2, 
  ShieldAlert, 
  BellRing, 
  UserCheck, 
  FileText, 
  BarChart3, 
  Bot, 
  Radio,
  ChevronDown,
  Terminal,
  Download,
  Command
} from 'lucide-react';
import { TabType, GuildInfo } from '../bot/types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  guilds: GuildInfo[];
  activeGuild: GuildInfo;
  onSelectGuild: (guild: GuildInfo) => void;
  botStatus: 'online' | 'idle' | 'dnd';
  onOpenExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  guilds,
  activeGuild,
  onSelectGuild,
  botStatus,
  onOpenExport
}) => {
  const [isGuildMenuOpen, setIsGuildMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'overview' as TabType, label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'commands' as TabType, label: 'Hệ Thống Lệnh (! & /)', icon: Command, badge: '24+ Lệnh' },
    { id: 'auto-responder' as TabType, label: 'Tự Động Phản Hồi', icon: MessageSquareCode, badge: 'Smart' },
    { id: 'music' as TabType, label: 'Phát Nhạc Hi-Fi', icon: Music2, badge: '24/7' },
    { id: 'moderation' as TabType, label: 'Quản Lý & Auto-Mod', icon: ShieldAlert, badge: 'Bảo vệ' },
    { id: 'social' as TabType, label: 'Thông Báo TikTok/YT', icon: BellRing, badge: 'Live' },
    { id: 'auto-role' as TabType, label: 'Cấp Quyền Tự Động', icon: UserCheck },
    { id: 'logs' as TabType, label: 'Nhật Ký Chi Tiết', icon: FileText },
    { id: 'analytics' as TabType, label: 'Phân Tích Server', icon: BarChart3 },
    { id: 'bot-deploy' as TabType, label: 'Chạy 24/24 & Kết Nối', icon: Bot, badge: '24/24' }
  ];

  const getStatusColor = () => {
    switch (botStatus) {
      case 'online': return 'bg-emerald-500';
      case 'idle': return 'bg-amber-500';
      case 'dnd': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <aside className="w-64 md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Bot Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <span 
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${getStatusColor()}`}
              title={`Trạng thái: ${botStatus.toUpperCase()}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-sm tracking-tight">AegisBot</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                24/7
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Online 24/24 · 18ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guild Selector Dropdown */}
      <div className="p-3 border-b border-slate-800/80 relative">
        <button
          type="button"
          onClick={() => setIsGuildMenuOpen(!isGuildMenuOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left"
          aria-expanded={isGuildMenuOpen}
          aria-label="Chọn máy chủ Discord"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-xl shrink-0">{activeGuild.icon}</span>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">{activeGuild.name}</div>
              <div className="text-[11px] text-slate-400">{activeGuild.memberCount.toLocaleString()} thành viên</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isGuildMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isGuildMenuOpen && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1.5 z-50">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Chuyển máy chủ
            </div>
            {guilds.map((guild) => (
              <button
                key={guild.id}
                type="button"
                onClick={() => {
                  onSelectGuild(guild);
                  setIsGuildMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                  guild.id === activeGuild.id
                    ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">{guild.icon}</span>
                <div className="truncate">
                  <div className="truncate">{guild.name}</div>
                  <div className="text-[10px] text-slate-400">{guild.memberCount.toLocaleString()} thành viên</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Bảng Điều Khiển Bot
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* PWA App Install, Connect & Export Quick Actions Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-2">
        <PWAInstallButton />
        <button
          type="button"
          onClick={() => onSelectTab('bot-deploy')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
          aria-label="Cấu hình và kết nối Bot"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Cấu Hình & Kết Nối Bot</span>
        </button>
        <button
          type="button"
          onClick={onOpenExport}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-medium transition-colors"
          aria-label="Đưa Project lên GitHub"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Đưa Project Lên GitHub</span>
        </button>
      </div>
    </aside>
  );
};
