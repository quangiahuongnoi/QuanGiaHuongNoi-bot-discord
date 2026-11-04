import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Terminal,
  FolderGit2,
  ExternalLink,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  RefreshCw,
  Archive
} from 'lucide-react';
import { sanitizeRepoName } from '../bot/logic/githubPublisher';

interface BotCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BotCodeExportModal: React.FC<BotCodeExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeMode, setActiveMode] = useState<'github-push' | 'code-files'>('github-push');
  const [activeFile, setActiveFile] = useState<string>('index.js');
  const [copied, setCopied] = useState(false);

  // GitHub 1-Click Publisher State
  const [repoName, setRepoName] = useState('aegis-discord-bot');
  const [repoDescription, setRepoDescription] = useState(
    'AegisBot - Full-Stack Discord.js v14 Bot (Voice 24/7, Auto-Mod, Auto-Responder & Web/PWA Dashboard)'
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [projectFilesCount, setProjectFilesCount] = useState<number>(36);
  const [pushStatus, setPushStatus] = useState<{
    state: 'idle' | 'pushing' | 'success' | 'error';
    message?: string;
    repoUrl?: string;
  }>({ state: 'idle' });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/github/project-files')
        .then((r) => r.json())
        .then((d) => {
          if (typeof d.totalFiles === 'number') {
            setProjectFilesCount(d.totalFiles);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setPushStatus({ state: 'pushing' });

    try {
      const res = await fetch('/api/github/push-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken: githubToken.trim(),
          repoName: sanitizeRepoName(repoName),
          description: repoDescription.trim(),
          isPrivate
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPushStatus({
          state: 'success',
          message: data.message,
          repoUrl: data.repoUrl
        });
      } else {
        setPushStatus({
          state: 'error',
          message: data.error || 'Không thể đẩy dự án lên GitHub.'
        });
      }
    } catch (err: any) {
      setPushStatus({
        state: 'error',
        message: err?.message || 'Lỗi kết nối máy chủ.'
      });
    }
  };

  const codeFiles: Record<string, { filename: string; language: string; content: string }> = {
    'index.js': {
      filename: 'index.js',
      language: 'javascript',
      content: `/**
 * AegisBot - Discord.js v14 Production Engine (Hoạt động 24/24)
 * Chức năng: 26+ Lệnh (! & /), Auto-Responder, Music Voice 24/7 (@discordjs/voice + FFmpeg), Auto-Mod, Social Feeds, Auto-Role
 */
const http = require('http');
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder 
} = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior
} = require('@discordjs/voice');
require('dotenv').config();

// 0. HTTP Keep-Alive Server giúp Bot chạy 24/24 trên Render / Railway / VPS kết hợp UptimeRobot
const PORT = process.env.PORT || 8080;
const startTime = Date.now();
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    ok: true,
    bot: 'AegisBot 24/7 Engine',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
  }));
}).listen(PORT, () => {
  console.log(\`🌐 Keep-Alive Server 24/24 đang lắng nghe tại cổng \${PORT}\`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.trim();
  const lower = content.toLowerCase();

  if (lower.startsWith('!play') || lower === '!join') {
    const member = await message.guild.members.fetch({ user: message.author.id, force: true }).catch(() => message.member);
    const voiceChannel = member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply('⚠️ Bạn hãy vào một phòng Voice trước khi gọi lệnh để bot tự động nhảy vào nhé!');
    }
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: true
    });
    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    connection.subscribe(player);
    return message.reply(\`🔊 Đã tự động nhảy vào phòng **\${voiceChannel.name}** và sẵn sàng phát nhạc 24/7!\`);
  }
});

client.once('ready', () => {
  console.log(\`✅ AegisBot 24/7 đã đăng nhập thành công với tên: \${client.user.tag}\`);
});

client.login(process.env.DISCORD_BOT_TOKEN);`
    },
    'Dockerfile': {
      filename: 'Dockerfile',
      language: 'dockerfile',
      content: `FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]`
    },
    '.env.example': {
      filename: '.env.example',
      language: 'shell',
      content: `# Discord Bot Credentials
DISCORD_BOT_TOKEN="YOUR_DISCORD_BOT_TOKEN_HERE"
DISCORD_CLIENT_ID="YOUR_DISCORD_CLIENT_ID"
DEFAULT_MEMBER_ROLE_ID=""`
    }
  };

  const currentCode = codeFiles[activeFile] || codeFiles['index.js'];

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Đưa Toàn Bộ Project Lên GitHub & Xuất Mã Nguồn ({projectFilesCount} tệp Full-Stack)
              </h2>
              <p className="text-[11px] text-slate-400">
                Đẩy thẳng toàn bộ dự án (React + Express + Discord.js v14 + Voice FFmpeg + Dockerfile) lên tài khoản GitHub của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Đóng cửa sổ xuất GitHub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('github-push')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'github-push'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>1-Click Đẩy Lên GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('code-files')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'code-files'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Xem File Cấu Hình Lẻ</span>
            </button>
          </div>

          <a
            href="/api/github/download-bundle"
            download="aegis-discord-bot-fullstack.tar.gz"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Tải Trọn Bộ Project (.tar.gz)</span>
          </a>
        </div>

        {/* Body */}
        {activeMode === 'github-push' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Cách 1: Nút GitHub có sẵn trên thanh công cụ AI Studio */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <span>💡 Mẹo Nhanh Nhất: Nút "GitHub" Trên Thanh Công Cụ Phía Trên Cùng</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bạn có thể bấm trực tiếp vào biểu tượng <strong>GitHub (Export to GitHub)</strong> ở góc trên cùng bên phải giao diện Google AI Studio, hoặc điền <strong>GitHub Personal Access Token</strong> vào biểu mẫu bên dưới để hệ thống tự động tạo Repository và commit toàn bộ <strong>{projectFilesCount} tệp mã nguồn</strong> lên GitHub cho bạn ngay lập tức!
              </p>
            </div>

            {/* Cách 2: Form 1-Click Push trực tiếp qua GitHub API */}
            <form onSubmit={handlePushToGitHub} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Đẩy Tự Động Toàn Bộ {projectFilesCount} Tệp Lên GitHub Của Bạn
                </h3>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=AegisBot+Studio+Deploy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>Lấy GitHub Token (Quyền repo) tại đây</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên Repository Mới (Hoặc Đã Có)
                  </label>
                  <input
                    type="text"
                    required
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="aegis-discord-bot"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chế Độ Hiển Thị Repository
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                        !isPrivate
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public (Công khai)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                        isPrivate
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Private (Riêng tư)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub Personal Access Token (Bắt đầu bằng <code className="text-indigo-300">ghp_...</code> hoặc <code className="text-indigo-300">github_pat_...</code>)
                </label>
                <input
                  type="password"
                  required
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  🔒 An toàn tuyệt đối: File <code className="text-emerald-400">.env</code> chứa Token Discord của bạn đã được tự động loại bỏ khỏi bản đẩy lên GitHub (chỉ đẩy <code className="text-slate-300">.env.example</code>).
                </p>
              </div>

              {pushStatus.state !== 'idle' && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                    pushStatus.state === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : pushStatus.state === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {pushStatus.state === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : pushStatus.state === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0 mt-0.5" />
                    )}
                    <span>
                      {pushStatus.state === 'pushing'
                        ? `Đang khởi tạo repository và tải toàn bộ ${projectFilesCount} tệp mã nguồn lên GitHub...`
                        : pushStatus.message}
                    </span>
                  </div>

                  {pushStatus.repoUrl && (
                    <a
                      href={pushStatus.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shrink-0"
                    >
                      <span>Mở GitHub Repo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={pushStatus.state === 'pushing'}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {pushStatus.state === 'pushing'
                    ? 'Đang Đẩy Toàn Bộ Project Lên GitHub...'
                    : `Đẩy Nguyên Project (${projectFilesCount} File) Lên GitHub Ngay`}
                </span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto">
                {Object.keys(codeFiles).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFile(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      activeFile === key
                        ? 'bg-slate-800 text-indigo-400 font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{key}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={copyCode}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép file này'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed select-text">
              <pre className="whitespace-pre overflow-x-auto">
                <code>{currentCode.content}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>
              Chạy sau khi clone từ GitHub:{' '}
              <code className="text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                npm install && npm run build && npm start
              </code>
            </span>
          </div>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
          >
            <span>Tạo Repo trên GitHub.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
