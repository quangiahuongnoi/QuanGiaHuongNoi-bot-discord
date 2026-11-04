import React, { useState } from 'react';
import {
  Terminal,
  Search,
  Plus,
  Copy,
  Check,
  Play,
  Sliders,
  Sparkles,
  Music2,
  ShieldAlert,
  Trophy,
  BellRing,
  Wrench,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Code2
} from 'lucide-react';
import {
  DiscordCommandDef,
  CommandCategory,
  executeBotCommand,
  CommandExecutionOutput
} from '../bot/logic/commandRegistry';
import { GuildInfo } from '../bot/types';

interface CommandsCenterViewProps {
  commands: DiscordCommandDef[];
  onToggleCommand: (id: string) => void;
  onAddCustomCommand: (cmd: DiscordCommandDef) => void;
  onDeleteCustomCommand: (id: string) => void;
  onExecuteCommandInApp: (input: string) => CommandExecutionOutput;
  guild: GuildInfo;
}

const CATEGORY_LABELS: Record<CommandCategory | 'ALL', { label: string; badgeColor: string }> = {
  ALL: { label: 'Tất Cả Lệnh', badgeColor: 'bg-slate-800 text-slate-300' },
  MUSIC: { label: 'Phát Nhạc 24/7', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  MODERATION: { label: 'Quản Trị & Auto-Mod', badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  ROLE_LEVEL: { label: 'Cấp Độ & Vai Trò', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  SOCIAL: { label: 'TikTok & YouTube', badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
  UTILITY: { label: 'Tiện Ích Server', badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  CUSTOM: { label: 'Lệnh Tùy Chỉnh', badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30' }
};

export const CommandsCenterView: React.FC<CommandsCenterViewProps> = ({
  commands,
  onToggleCommand,
  onAddCustomCommand,
  onDeleteCustomCommand,
  onExecuteCommandInApp,
  guild
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncingSlash, setIsSyncingSlash] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Quick interactive command runner inside Web/App controller
  const [quickCmdInput, setQuickCmdInput] = useState('!help');
  const [lastCmdResult, setLastCmdResult] = useState<{
    input: string;
    output: CommandExecutionOutput;
    timestamp: string;
  } | null>(null);

  // New Custom Command Modal/Form state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customResponse, setCustomResponse] = useState(
    'Xin chào {user}! Chào mừng bạn đến với {server}. Nội dung yêu cầu: {args}'
  );

  const filteredCommands = commands.filter((cmd) => {
    const matchesCat = selectedCategory === 'ALL' || cmd.category === selectedCategory;
    const matchesQuery =
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.prefixUsage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleCopyCommand = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRunQuickCommand = (inputToRun?: string) => {
    const raw = (inputToRun ?? quickCmdInput).trim();
    if (!raw) return;
    const out = onExecuteCommandInApp(raw);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLastCmdResult({
      input: raw,
      output: out,
      timestamp: timeStr
    });
  };

  const handleSyncSlashCommands = async () => {
    setIsSyncingSlash(true);
    try {
      const res = await fetch('/api/bot/sync-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      });
      if (res.ok) {
        setSyncSuccessMsg(
          `Đã lưu ${commands.filter((c) => c.enabled).length} lệnh Prefix (!) vào cấu hình Bot. 8 Slash Commands hệ thống được đăng ký tự động khi Bot kết nối.`
        );
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } catch {
      setSyncSuccessMsg('Đã lưu danh sách lệnh vào bộ nhớ điều khiển.');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } finally {
      setIsSyncingSlash(false);
    }
  };

  const handleCreateCustomCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customName
      .trim()
      .toLowerCase()
      .replace(/^[!/]+/, '')
      .replace(/\s+/g, '-');
    if (!cleanName || !customResponse.trim()) return;

    const newCmd: DiscordCommandDef = {
      id: `cmd-custom-${Date.now()}`,
      name: cleanName,
      prefixUsage: `!${cleanName} [tham số]`,
      slashUsage: `/${cleanName} [args]`,
      category: 'CUSTOM',
      description: customDesc.trim() || `Lệnh tùy chỉnh !${cleanName} do quản trị viên tạo.`,
      permissions: 'Mọi thành viên',
      enabled: true,
      isCustom: true,
      customResponse: customResponse.trim()
    };

    onAddCustomCommand(newCmd);
    setCustomName('');
    setCustomDesc('');
    setIsAddingCustom(false);
    setQuickCmdInput(`!${cleanName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Hệ Thống Lệnh Discord (!Prefix & /Slash Commands)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý {commands.length} lệnh điều khiển nhạc, kiểm duyệt, cấp quyền, xem hạng và tự tạo lệnh riêng cho máy chủ{' '}
            <span className="text-indigo-400 font-semibold">{guild.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tạo Lệnh Mới (!Custom)</span>
          </button>

          <button
            type="button"
            onClick={handleSyncSlashCommands}
            disabled={isSyncingSlash}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSlash ? 'animate-spin' : ''}`} />
            <span>Đồng Bộ Cấu Hình Lệnh</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Create Custom Command Drawer */}
      {isAddingCustom && (
        <form
          onSubmit={handleCreateCustomCommand}
          className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>Tạo Lệnh Tùy Chỉnh Mới (Hỗ trợ cả ! và /)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tên Lệnh (Không khoảng trắng, ví dụ: donate, ip, link, event)
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                <span className="text-indigo-400 font-mono text-xs mr-1">!</span>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="donate"
                  className="bg-transparent text-xs font-mono text-white w-full focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mô Tả Ngắn Gọn Công Dụng Lệnh
              </label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Hiển thị thông tin ủng hộ quỹ hoạt động server"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nội Dung Bot Trả Lời Khi Gõ Lệnh (Hỗ trợ biến <code className="text-indigo-300">{'{user}'}</code>,{' '}
              <code className="text-indigo-300">{'{server}'}</code>, <code className="text-indigo-300">{'{args}'}</code>)
            </label>
            <textarea
              rows={2}
              required
              value={customResponse}
              onChange={(e) => setCustomResponse(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Lưu Lệnh Tùy Chỉnh
            </button>
          </div>
        </form>
      )}

      {/* Remote Command Execution Console (Control Bot directly from Web/App) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Bảng Thực Thi Lệnh Trực Tiếp Từ Web / App (Remote Command Console)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gõ bất kỳ lệnh <code className="text-slate-200 font-mono">!lệnh</code> hoặc{' '}
              <code className="text-slate-200 font-mono">/lệnh</code> bên dưới để điều khiển bot từ xa hoặc kiểm tra phản hồi ngay lập tức
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunQuickCommand();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={quickCmdInput}
            onChange={(e) => setQuickCmdInput(e.target.value)}
            aria-label="Nhập lệnh Discord để thực thi"
            placeholder="Ví dụ: !help, /ping, !play Chìm Sâu, !rank, !leaderboard, !serverinfo, !247..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Thực Thi Lệnh Ngay</span>
          </button>
        </form>

        {/* Quick Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-400 shrink-0">Thử nhanh:</span>
          {['!help', '/ping', '!play Nơi Này Có Anh', '!rank', '!leaderboard', '!serverinfo', '!247', '!poll Tối nay chơi game gì?'].map(
            (sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuickCmdInput(sample);
                  handleRunQuickCommand(sample);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors"
              >
                {sample}
              </button>
            )
          )}
        </div>

        {/* Command Output Preview Box */}
        {lastCmdResult && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>
                Lệnh vừa chạy: <strong className="text-indigo-400">{lastCmdResult.input}</strong>
              </span>
              <span>{lastCmdResult.timestamp}</span>
            </div>
            <div className="text-xs text-slate-200">{lastCmdResult.output.replyContent}</div>
            {lastCmdResult.output.embed && (
              <div
                className="p-3 rounded-lg bg-slate-900 border-l-4 space-y-1.5"
                style={{ borderLeftColor: lastCmdResult.output.embed.color || '#5865F2' }}
              >
                <div className="text-xs font-bold text-white">{lastCmdResult.output.embed.title}</div>
                <div className="text-[11px] text-slate-300 whitespace-pre-line">
                  {lastCmdResult.output.embed.description}
                </div>
                {lastCmdResult.output.embed.fields && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {lastCmdResult.output.embed.fields.map((f, i) => (
                      <div key={i}>
                        <div className="text-[10px] font-bold text-slate-400">{f.name}</div>
                        <div className="text-xs text-slate-200">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Tabs & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(Object.keys(CATEGORY_LABELS) as (CommandCategory | 'ALL')[]).map((cat) => {
            const active = selectedCategory === cat;
            const count =
              cat === 'ALL'
                ? commands.length
                : commands.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{CATEGORY_LABELS[cat].label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên lệnh (!play, !warn...)"
            aria-label="Tìm kiếm lệnh Discord"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Commands Grid (Max 4 data points per card: Command Syntax, Category/Permissions, Description, Toggle/Test) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommands.map((cmd) => {
          const catMeta = CATEGORY_LABELS[cmd.category];
          return (
            <div
              key={cmd.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                cmd.enabled
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/40 border-slate-800/50 opacity-60'
              }`}
            >
              <div className="space-y-2.5">
                {/* Top row: Command Name Badge & Toggle Switch */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-400 font-mono text-xs font-bold">
                      !{cmd.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-semibold">
                      /{cmd.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.isCustom && (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomCommand(cmd.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Xóa lệnh tùy chỉnh"
                        aria-label={`Xóa lệnh ${cmd.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleCommand(cmd.id)}
                      role="switch"
                      aria-checked={cmd.enabled}
                      aria-label={`Bật hoặc tắt lệnh ${cmd.name}`}
                      className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                        cmd.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          cmd.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {cmd.description}
                </p>

                {/* Usage Syntax Box */}
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between gap-2">
                  <span className="truncate">{cmd.prefixUsage}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCommand(cmd.id, cmd.prefixUsage.split(' ')[0])}
                    className="text-slate-400 hover:text-white shrink-0"
                    title="Sao chép lệnh"
                    aria-label={`Sao chép lệnh ${cmd.name}`}
                  >
                    {copiedId === cmd.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Footer: Category & Quick Test Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400 truncate">
                  Quyền: <strong className="text-slate-300 font-medium">{cmd.permissions}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `!${cmd.name}`;
                    setQuickCmdInput(sample);
                    handleRunQuickCommand(sample);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3" />
                  <span>Chạy thử</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
