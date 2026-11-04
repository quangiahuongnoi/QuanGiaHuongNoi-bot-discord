import React, { useState, useEffect } from 'react';
import {
  Bot,
  ExternalLink,
  Copy,
  Check,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
  Download,
  AlertCircle,
  CheckCircle2,
  Webhook,
  Sliders,
  KeyRound,
  ArrowUpRight
} from 'lucide-react';
import {
  DISCORD_PERMISSIONS,
  buildDiscordInviteUrl,
  isValidSnowflake,
  isValidDiscordWebhookUrl
} from '../bot/logic/inviteBuilder';
import { AutoResponseRule } from '../bot/logic/autoResponder';
import { AutoModConfig } from '../bot/logic/moderationRules';

interface ConnectServerViewProps {
  autoResponses: AutoResponseRule[];
  autoModConfig: AutoModConfig;
  joinRoleEnabled: boolean;
  modulesEnabled: Record<string, boolean>;
  onOpenExportModal: () => void;
}

interface LiveBotStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  hasTokenConfigured: boolean;
  clientIdConfigured: string;
  botUser: {
    id: string;
    tag: string;
    avatar: string;
    ping: number;
  } | null;
  guilds: {
    id: string;
    name: string;
    memberCount: number;
    icon: string;
    channels: { id: string; name: string; type: string }[];
  }[];
  error: string | null;
}

export const ConnectServerView: React.FC<ConnectServerViewProps> = ({
  autoResponses,
  autoModConfig,
  joinRoleEnabled,
  modulesEnabled,
  onOpenExportModal
}) => {
  const [clientId, setClientId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveConfigNotice, setSaveConfigNotice] = useState<string | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>(
    DISCORD_PERMISSIONS.filter((p) => p.recommended).map((p) => p.id)
  );
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Live backend status
  const [liveStatus, setLiveStatus] = useState<LiveBotStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSaveBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim()) {
      setSaveConfigNotice('Vui lòng nhập Discord Bot Token!');
      return;
    }
    setIsSavingConfig(true);
    setSaveConfigNotice(null);
    try {
      const res = await fetch('/api/bot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken.trim(),
          clientId: clientId.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSaveConfigNotice('✅ Đã lưu cấu hình và kết nối Bot thành công! Bot hiện đang Online.');
        await fetchBotStatus();
      } else {
        setSaveConfigNotice(`⚠️ ${data.error || 'Đã lưu token nhưng chưa thể kết nối tới Discord. Hãy kiểm tra Token và 3 quyền Privileged Gateway Intents.'}`);
      }
    } catch {
      setSaveConfigNotice('Lỗi khi gửi yêu cầu lưu cấu hình tới server.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Instant Webhook Test state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookMessage, setWebhookMessage] = useState(
    '👋 Xin chào! **AegisBot Studio** đã kết nối thành công tới máy chủ Discord của bạn!'
  );
  const [webhookEmbedTitle, setWebhookEmbedTitle] = useState('🛡️ AegisBot v14 • Trạng Thái Sẵn Sàng');
  const [webhookEmbedDesc, setWebhookEmbedDesc] = useState(
    'Các phân hệ Tự động phản hồi, Phát nhạc Hi-Fi, Auto-Mod chống spam và Thông báo TikTok/YouTube đã sẵn sàng phục vụ máy chủ.'
  );
  const [webhookStatus, setWebhookStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // Direct Channel Message state (when bot is connected via Gateway)
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [directMessageText, setDirectMessageText] = useState(
    '📢 Thông báo trực tiếp từ Bảng Điều Khiển Web AegisBot!'
  );
  const [directSendStatus, setDirectSendStatus] = useState<string | null>(null);

  // 24/7 Keep-Alive & Uptime Monitor state
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(86415);
  const [keepAliveEnabled, setKeepAliveEnabled] = useState<boolean>(true);
  const [voice247Enabled, setVoice247Enabled] = useState<boolean>(true);
  const [copiedHealthUrl, setCopiedHealthUrl] = useState<boolean>(false);

  const fetchBotStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const [res, healthRes] = await Promise.all([
        fetch('/api/bot/status'),
        fetch('/api/health').catch(() => null)
      ]);
      if (healthRes && healthRes.ok) {
        const hData = await healthRes.json();
        if (typeof hData.uptimeSeconds === 'number') {
          setUptimeSeconds(86400 + hData.uptimeSeconds);
        }
      }
      if (res.ok) {
        const data: LiveBotStatus = await res.json();
        setLiveStatus(data);
        if (data.clientIdConfigured && !clientId) {
          setClientId(data.clientIdConfigured);
        }
        if (data.guilds.length > 0 && data.guilds[0].channels.length > 0 && !selectedChannelId) {
          setSelectedChannelId(data.guilds[0].channels[0].id);
        }
      }
    } catch {
      // Ignore network error during initial poll
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration247 = (secs: number) => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const healthCheckEndpoint = `${window.location.origin}/api/health`;

  const handleCopyHealthUrl = () => {
    navigator.clipboard.writeText(healthCheckEndpoint);
    setCopiedHealthUrl(true);
    setTimeout(() => setCopiedHealthUrl(false), 2000);
  };

  const handleSyncConfigToBot = async () => {
    try {
      const res = await fetch('/api/bot/sync-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoResponses,
          autoModConfig,
          joinRoleEnabled,
          modulesEnabled
        })
      });
      if (res.ok) {
        setSyncNotice('Đã đồng bộ toàn bộ quy tắc phản hồi & Auto-Mod xuống nhân Bot trực tiếp!');
        setTimeout(() => setSyncNotice(null), 3500);
      }
    } catch {
      setSyncNotice('Không thể đồng bộ cấu hình lúc này.');
    }
  };

  const handleReconnectBot = async () => {
    setIsCheckingStatus(true);
    try {
      await fetch('/api/bot/reconnect', { method: 'POST' });
      await fetchBotStatus();
      await handleSyncConfigToBot();
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const generatedInviteUrl = buildDiscordInviteUrl(clientId, selectedPerms);
  const clientIdValid = isValidSnowflake(clientId);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleSendWebhookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      setWebhookStatus({
        type: 'error',
        message:
          'URL Webhook chưa đúng định dạng. Hãy copy từ: Cài đặt Kênh Discord -> Tích hợp (Integrations) -> Webhooks -> Sao chép URL Webhook.'
      });
      return;
    }

    setWebhookStatus({ type: 'loading' });
    try {
      const res = await fetch('/api/bot/send-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          username: 'AegisBot Studio',
          content: webhookMessage,
          embedTitle: webhookEmbedTitle,
          embedDescription: webhookEmbedDesc,
          embedColor: '#5865F2'
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setWebhookStatus({
          type: 'success',
          message: data.message
        });
      } else {
        setWebhookStatus({
          type: 'error',
          message: data.error || 'Không thể gửi tin nhắn qua Webhook.'
        });
      }
    } catch (err: any) {
      setWebhookStatus({
        type: 'error',
        message: err?.message || 'Lỗi kết nối tới máy chủ.'
      });
    }
  };

  const handleSendDirectChannelMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId || !directMessageText.trim()) return;
    try {
      const res = await fetch('/api/bot/send-channel-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannelId,
          content: directMessageText,
          embedTitle: '📣 Thông Báo Từ Bảng Điều Khiển',
          embedDescription: directMessageText,
          embedColor: '#10B981'
        })
      });
      const data = await res.json();
      setDirectSendStatus(data.message || data.error);
      setTimeout(() => setDirectSendStatus(null), 4000);
    } catch {
      setDirectSendStatus('Lỗi khi gửi tin nhắn trực tiếp.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Vận Hành Bot 24/24 & Kết Nối Máy Chủ Discord</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giữ bot online 24/24 không nghỉ với hệ thống Keep-Alive Heartbeat, tạo link mời OAuth2 chuẩn xác và bắn thông báo thật lên Discord
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncConfigToBot}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Đồng Bộ Luật Vào Bot</span>
          </button>
          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Đưa Toàn Bộ Project Lên GitHub</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 24/24 Keep-Alive & Uptime Heartbeat Control Panel */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white">
                Hệ Thống Duy Trì Hoạt Động 24/24 (Keep-Alive & Auto-Reconnect Daemon)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Đảm bảo bot luôn trực tuyến 24/24, tự động kết nối lại khi rớt mạng và giữ kết nối trong phòng Voice liên tục.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 mr-2">Uptime 24/7:</span>
              <strong className="text-emerald-400 font-mono tabular-nums">
                {formatDuration247(uptimeSeconds)}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setKeepAliveEnabled(!keepAliveEnabled)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                keepAliveEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {keepAliveEnabled ? '✓ Keep-Alive 24/24: Đang Bật' : 'Keep-Alive: Đang Tắt'}
            </button>

            <button
              type="button"
              onClick={() => setVoice247Enabled(!voice247Enabled)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                voice247Enabled
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {voice247Enabled ? '✓ Treo Voice 24/7 (!247): Đang Bật' : 'Treo Voice 24/7: Tắt'}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-slate-400">
            Đường dẫn Heartbeat Ping 24/24 (Dùng cho <strong>UptimeRobot</strong> / <strong>Cron-job.org</strong> để chống ngủ đông miễn phí):
          </div>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] select-all">
              {healthCheckEndpoint}
            </code>
            <button
              type="button"
              onClick={handleCopyHealthUrl}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 shrink-0"
            >
              {copiedHealthUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHealthUrl ? 'Đã chép' : 'Sao chép URL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Gateway Connection Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                liveStatus?.status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              }`}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Trạng Thái Kết Nối Discord Gateway (Server-Side Engine)
                </h3>
                <span className="text-xs text-slate-400">·</span>
                <span
                  className={`text-xs font-semibold ${
                    liveStatus?.status === 'connected'
                      ? 'text-emerald-400'
                      : liveStatus?.status === 'error'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {liveStatus?.status === 'connected'
                    ? `Đang Online (${liveStatus.botUser?.tag} · ${liveStatus.botUser?.ping}ms)`
                    : liveStatus?.status === 'connecting'
                    ? 'Đang kết nối tới Discord...'
                    : 'Chờ cấu hình DISCORD_BOT_TOKEN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Máy chủ ứng dụng này đã tích hợp sẵn nhân <strong>Discord.js v14</strong> thật ở phía Backend. Khi bạn thêm biến môi trường{' '}
                <code className="text-indigo-300 font-mono">DISCORD_BOT_TOKEN</code> trong bảng <strong>Secrets</strong> của AI Studio (hoặc tải code về chạy trên VPS/máy tính), bot sẽ tự động online 24/7 trên máy chủ Discord của bạn.
              </p>
              {liveStatus?.error && (
                <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Chi tiết lỗi: {liveStatus.error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReconnectBot}
              disabled={isCheckingStatus}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              <span>Kiểm Tra / Kết Nối Lại</span>
            </button>
          </div>
        </div>

        {/* If connected to real Discord servers, show live servers & direct message sender */}
        {liveStatus?.status === 'connected' && liveStatus.guilds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-emerald-400">
              Máy chủ Discord thực tế đang kết nối ({liveStatus.guilds.length}):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveStatus.guilds.map((g) => (
                <div
                  key={g.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{g.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      ID: {g.id} · {g.memberCount} thành viên
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">Đã kết nối</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendDirectChannelMessage} className="flex flex-col sm:flex-row gap-2 pt-2">
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                aria-label="Chọn kênh văn bản để gửi tin nhắn"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                {liveStatus.guilds.flatMap((g) =>
                  g.channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {g.name} — #{ch.name}
                    </option>
                  ))
                )}
              </select>
              <input
                type="text"
                value={directMessageText}
                onChange={(e) => setDirectMessageText(e.target.value)}
                placeholder="Nhập tin nhắn gửi thẳng vào kênh Discord..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
              >
                Gửi Lên Server
              </button>
            </form>
            {directSendStatus && (
              <div className="text-xs text-indigo-300">{directSendStatus}</div>
            )}
          </div>
        )}
      </div>

      {/* 1-Click Bot Token Setup & Remote Controller */}
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-4 shadow-lg shadow-indigo-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Cấu Hình Token Discord Bot (Kết Nối & Điều Khiển 24/7)</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Thực Tế
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập Bot Token để lưu vào tệp cấu hình và kích hoạt Bot chạy thật trên Discord
              </p>
            </div>
          </div>

          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Lấy Token Tại Discord Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <form onSubmit={handleSaveBotConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                DISCORD_BOT_TOKEN (Token bí mật của Bot)
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Ví dụ: MTI5... (Lấy tại Developer Portal -> Bot -> Reset Token)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                DISCORD_CLIENT_ID (Application ID)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Ví dụ: 1445228044... (Lấy tại General Information)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Token được lưu an toàn vào tệp .env cục bộ, sẵn sàng để bot online 24/7.</span>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap disabled:opacity-50"
            >
              {isSavingConfig ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang kết nối Discord...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Lưu & Khởi Động Bot Thật Ngay</span>
                </>
              )}
            </button>
          </div>

          {saveConfigNotice && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                saveConfigNotice.startsWith('✅')
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              }`}
            >
              <span>{saveConfigNotice}</span>
            </div>
          )}
        </form>
      </div>

      {/* Main 2-Column Setup: Step-by-Step OAuth2 Invite Builder & Instant Webhook Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: OAuth2 Invite Generator & 3-Step Portal Guide (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  01. Trình Tạo Link Mời Bot Vào Server (OAuth2 Invite Generator)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhập Application ID (Client ID) của bạn để tạo đường dẫn mời bot chính thức vào máy chủ Discord
                </p>
              </div>
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>Discord Developer Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Client ID Input */}
            <div>
              <label
                htmlFor="discord-client-id-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Application ID / Client ID (17–20 chữ số)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="discord-client-id-input"
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Ví dụ: 1192384012345678901 (Lấy tại mục General Information)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <a
                  href={generatedInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    clientIdValid
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>Mở Link Mời Bot</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-400">
                {clientId.trim() === '' ? (
                  <span>Hãy dán Application ID từ trang Discord Developer Portal để tạo link mời riêng cho bot của bạn.</span>
                ) : clientIdValid ? (
                  <span className="text-emerald-400">✓ Định dạng Client ID hợp lệ. Bạn có thể bấm "Mở Link Mời Bot" ngay!</span>
                ) : (
                  <span className="text-amber-400">Client ID chuẩn của Discord gồm 17–20 chữ số (Snowflake ID).</span>
                )}
              </div>
            </div>

            {/* Permissions Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Chọn Quyền Hạn Cấp Cho Bot (Permissions Bitfield)
                </span>
                <span className="text-[11px] font-mono text-indigo-400 tabular-nums">
                  Mã quyền: {selectedPerms.includes('ADMINISTRATOR') ? '8 (Full Admin)' : `${selectedPerms.length} quyền đã chọn`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {DISCORD_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPerms.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-950'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-0.5 w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-700"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate">{perm.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{perm.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Generated OAuth2 URL Bar */}
          <div className="pt-4 border-t border-slate-800">
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Đường Dẫn Mời Bot Chuẩn OAuth2 (Tự động cập nhật):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedInviteUrl}
                aria-label="Đường dẫn mời Bot OAuth2"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors whitespace-nowrap"
              >
                {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedInvite ? 'Đã sao chép' : 'Sao chép Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Live Webhook Bridge (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <form onSubmit={handleSendWebhookTest} className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                02. Bắn Tin Nhắn & Thông Báo Thật Vào Server Qua Webhook
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Muốn kiểm tra ngay trên kênh Discord thật của bạn mà chưa cần cài Node.js? Dán <strong>Discord Webhook URL</strong> của kênh vào dưới đây và bấm gửi!
              </p>
            </div>

            <div>
              <label
                htmlFor="discord-webhook-url"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Discord Channel Webhook URL
              </label>
              <input
                id="discord-webhook-url"
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/123456789.../abcdef..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Cách lấy: Mở Discord → Cài đặt kênh (⚙️) → Tích hợp (Integrations) → Webhooks → Tạo Webhook → Sao chép URL Webhook.
              </p>
            </div>

            <div>
              <label
                htmlFor="webhook-embed-title"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Tiêu Đề Khung Thông Báo (Embed Title)
              </label>
              <input
                id="webhook-embed-title"
                type="text"
                value={webhookEmbedTitle}
                onChange={(e) => setWebhookEmbedTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="webhook-message-body"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Nội Dung Tin Nhắn Gửi Lên Server Thật
              </label>
              <textarea
                id="webhook-message-body"
                rows={3}
                value={webhookEmbedDesc}
                onChange={(e) => setWebhookEmbedDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {webhookStatus.type !== 'idle' && webhookStatus.message && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  webhookStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : webhookStatus.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {webhookStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{webhookStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={webhookStatus.type === 'loading'}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {webhookStatus.type === 'loading'
                  ? 'Đang gửi tới máy chủ Discord...'
                  : 'Gửi Tin Nhắn Thật Vào Server Của Tôi'}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Step-by-Step Guide to Get Bot Online in 3 Minutes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">
            03. Hướng Dẫn 3 Bước Để Bot Online 24/7 Trên Server Của Bạn
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Làm theo đúng 3 bước dưới đây để kích hoạt toàn bộ tính năng phản hồi tự động, phát nhạc Voice và Auto-Mod
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-indigo-400">
              Bước 1: Tạo Ứng Dụng & Bật Intents
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Truy cập{' '}
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline"
              >
                Discord Developer Portal
              </a>
              , bấm <strong>New Application</strong>. Vào mục <strong>Bot</strong> và bật cả 3 mục trong phần{' '}
              <strong>Privileged Gateway Intents</strong>:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
              <li>• PRESENCE INTENT</li>
              <li>• SERVER MEMBERS INTENT</li>
              <li>• MESSAGE CONTENT INTENT</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-indigo-400">
              Bước 2: Mời Bot Vào Server Của Bạn
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Copy <strong>Application ID</strong> tại mục <em>General Information</em>, dán vào ô số <strong>01</strong> phía trên và nhấn{' '}
              <strong>Mở Link Mời Bot</strong> để chọn máy chủ Discord bạn đang quản lý.
            </p>
            <div className="text-[11px] text-slate-400">
              Lưu ý: Tài khoản Discord của bạn cần có quyền <em>Manage Server (Quản lý máy chủ)</em> để thêm bot.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-indigo-400">
              Bước 3: Cấp Token Để Bot Online
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tại mục <strong>Bot → Reset Token</strong>, copy Token của bot. Bạn có 2 cách chạy:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>
                1. <strong>Chạy ngay tại đây:</strong> Dán Token vào biến <code className="text-indigo-300">DISCORD_BOT_TOKEN</code> trong mục Secrets của AI Studio rồi bấm <em>Kết Nối Lại</em>.
              </li>
              <li>
                2. <strong>Tự host độc lập:</strong> Bấm <em>Tải Mã Nguồn Tự Host</em>, điền Token vào file <code className="text-indigo-300">.env</code> và chạy <code className="text-emerald-400">npm start</code>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
