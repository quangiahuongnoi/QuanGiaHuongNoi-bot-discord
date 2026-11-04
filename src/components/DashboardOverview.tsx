import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Music, 
  ShieldCheck, 
  ExternalLink, 
  Key, 
  Copy, 
  Check, 
  ArrowUpRight, 
  SlidersHorizontal,
  Sparkles,
  Zap
} from 'lucide-react';
import { GuildInfo, TabType } from '../bot/types';

interface DashboardOverviewProps {
  guild: GuildInfo;
  modulesEnabled: {
    autoResponder: boolean;
    music: boolean;
    moderation: boolean;
    social: boolean;
    autoRole: boolean;
    logs: boolean;
  };
  onToggleModule: (moduleKey: keyof DashboardOverviewProps['modulesEnabled']) => void;
  onNavigateTab: (tab: TabType) => void;
  onOpenExport: () => void;
  discordClientId?: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  guild,
  modulesEnabled,
  onToggleModule,
  onNavigateTab,
  onOpenExport,
  discordClientId = ''
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [selectedPerms, setSelectedPerms] = React.useState<string[]>([
    'ADMINISTRATOR',
    'MANAGE_ROLES',
    'MANAGE_CHANNELS',
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'SEND_MESSAGES',
    'CONNECT',
    'SPEAK'
  ]);

  const botInviteUrl = discordClientId
    ? `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(discordClientId)}&permissions=8&scope=bot%20applications.commands`
    : '';

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const moduleCards = [
    {
      id: 'autoResponder' as const,
      tab: 'auto-responder' as TabType,
      name: 'Tự Động Phản Hồi',
      desc: 'Tự động bắt từ khóa, cú pháp regex, hỗ trợ embed phong phú & trả lời theo kênh chỉ định.',
      active: modulesEnabled.autoResponder,
      icon: MessageSquare,
      color: 'from-blue-500/20 to-indigo-500/20',
      tag: '4 quy tắc đang chạy'
    },
    {
      id: 'music' as const,
      tab: 'music' as TabType,
      name: 'Phát Nhạc Hi-Fi 24/7',
      desc: 'Stream âm thanh chất lượng cao, hỗ trợ hàng đợi, lyrics thời gian thực và bộ lọc âm Equalizer.',
      active: modulesEnabled.music,
      icon: Music,
      color: 'from-emerald-500/20 to-teal-500/20',
      tag: 'Phòng Voice 01'
    },
    {
      id: 'moderation' as const,
      tab: 'moderation' as TabType,
      name: 'Kiểm Duyệt & Auto-Mod',
      desc: 'Chống spam link mời server khác, chặn danh sách từ cấm, giới hạn mention và lưu lịch sử warn.',
      active: modulesEnabled.moderation,
      icon: ShieldCheck,
      color: 'from-amber-500/20 to-orange-500/20',
      tag: 'Shield cấp 2'
    },
    {
      id: 'social' as const,
      tab: 'social' as TabType,
      name: 'Thông Báo TikTok & YouTube',
      desc: 'Tự động kiểm tra và bắn thông báo khi các kênh TikTok, YouTube đã đăng ký ra video hoặc Live.',
      active: modulesEnabled.social,
      icon: Zap,
      color: 'from-rose-500/20 to-pink-500/20',
      tag: '4 kênh liên kết'
    },
    {
      id: 'autoRole' as const,
      tab: 'auto-role' as TabType,
      name: 'Cấp Quyền Tự Động (Auto-Role)',
      desc: 'Gán vai trò khi mới vào máy chủ, bảng chọn nút Reaction Role và thăng cấp vai trò theo Level.',
      active: modulesEnabled.autoRole,
      icon: Users,
      color: 'from-purple-500/20 to-violet-500/20',
      tag: '2 bảng chọn vai trò'
    },
    {
      id: 'logs' as const,
      tab: 'logs' as TabType,
      name: 'Nhật Ký Audit Logs',
      desc: 'Ghi lại chi tiết mọi hành động xóa/sửa tin nhắn, lệnh phạt vi phạm và lượt tham gia thoại.',
      active: modulesEnabled.logs,
      icon: SlidersHorizontal,
      color: 'from-slate-500/20 to-slate-700/20',
      tag: 'Lưu trữ theo thời gian thực'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Server Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-3xl shadow-xl">
              {guild.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {guild.name}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                  Hoạt động
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Chủ sở hữu: <strong className="text-slate-200">{guild.ownerName}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Khu vực: <strong className="text-slate-200">{guild.region}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Thành lập: <strong className="text-slate-200">{guild.createdDate}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenExport}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Đưa Bot Vào Server Của Tôi</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('commands')}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Hệ Thống Lệnh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tổng Thành Viên</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {guild.memberCount.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+12 hôm nay</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Đang trực tuyến: <strong className="text-slate-300 font-mono tabular-nums">{guild.onlineCount}</strong>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tin Nhắn Đã Xử Lý</span>
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              24,850
            </span>
            <span className="text-xs text-blue-400 font-medium">99.4% an toàn</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tốc độ phản hồi trung bình: <strong className="text-slate-300 font-mono">18ms</strong>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Thời Lượng Phát Nhạc</span>
            <Music className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              142 giờ
            </span>
            <span className="text-xs text-emerald-400 font-medium">24/7 online</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            4 bài hát đang chờ trong hàng đợi
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Can Thiệp Auto-Mod</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              29
            </span>
            <span className="text-xs text-amber-400 font-medium">7 ngày qua</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            18 cảnh cáo · 6 timeout · 3 kick · 2 ban
          </div>
        </div>
      </div>

      {/* Modules Activation Control Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Các Phân Hệ Tính Năng Của Bot</h2>
            <p className="text-xs text-slate-400">Bật tắt các phân hệ để bot kích hoạt hoặc tạm dừng xử lý trên máy chủ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            return (
              <div 
                key={mod.id} 
                className={`rounded-xl border transition-all p-5 flex flex-col justify-between ${
                  mod.active 
                    ? 'bg-slate-900/90 border-slate-700/80 shadow-sm' 
                    : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700/60">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-white">{mod.name}</h3>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onToggleModule(mod.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        mod.active ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={mod.active}
                      aria-label={`Bật tắt module ${mod.name}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          mod.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {mod.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">{mod.tag}</span>
                  <button
                    type="button"
                    onClick={() => onNavigateTab(mod.tab)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Cấu hình</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bot Invite & Credentials Information */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-sm font-bold text-white mb-1">Cấu Hình Kết Nối & Mời Bot</h3>
        <p className="text-xs text-slate-400 mb-4">
          Tạo link mời bot với quyền Adminstrator và Slash Commands vào máy chủ Discord của bạn
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Link Mời Bot Vào Server (OAuth2 URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={botInviteUrl || 'Chưa cấu hình DISCORD_CLIENT_ID'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(botInviteUrl)}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Discord Bot Token
            </label>
            <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-400">
              Token được giữ trong <code className="text-indigo-300">.env</code> / Secrets và không hiển thị trong giao diện quản trị.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
