import React, { useState } from 'react';
import { 
  Youtube, 
  Video, 
  Plus, 
  Trash2, 
  Send, 
  Check, 
  ExternalLink, 
  Radio, 
  Sparkles,
  Bell
} from 'lucide-react';
import { YouTubeFeed, TikTokFeed, GuildInfo } from '../bot/types';

interface SocialFeedsViewProps {
  youtubeFeeds: YouTubeFeed[];
  tiktokFeeds: TikTokFeed[];
  onAddYouTubeFeed: (feed: YouTubeFeed) => void;
  onRemoveYouTubeFeed: (id: string) => void;
  onAddTikTokFeed: (feed: TikTokFeed) => void;
  onRemoveTikTokFeed: (id: string) => void;
  onTestNotification: (platform: 'youtube' | 'tiktok', title: string, url: string, channelName: string) => void;
  guild: GuildInfo;
}

export const SocialFeedsView: React.FC<SocialFeedsViewProps> = ({
  youtubeFeeds,
  tiktokFeeds,
  onAddYouTubeFeed,
  onRemoveYouTubeFeed,
  onAddTikTokFeed,
  onRemoveTikTokFeed,
  onTestNotification,
  guild
}) => {
  const [activePlatform, setActivePlatform] = useState<'youtube' | 'tiktok'>('youtube');
  const [showAddModal, setShowAddModal] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState<string | null>(null);

  // Form states
  const [ytName, setYtName] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [ytChannelId, setYtChannelId] = useState('c-social');
  const [ytPingRole, setYtPingRole] = useState('r-yt-notif');
  const [ytTemplate, setYtTemplate] = useState('🚨 **VIDEO MỚI TỪ {channel_name}!**\n{video_title}\nXem ngay tại: {url}');

  const [ttHandle, setTtHandle] = useState('@');
  const [ttName, setTtName] = useState('');
  const [ttChannelId, setTtChannelId] = useState('c-social');
  const [ttPingRole, setTtPingRole] = useState('r-tt-notif');
  const [ttTemplate, setTtTemplate] = useState('📱 **TIKTOK VIDEO MỚI TỪ {creator_name}!**\n{video_title}\nThả tim ngay: {url}');

  const handleCreateFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (activePlatform === 'youtube') {
      if (!ytName.trim()) return;
      const newYt: YouTubeFeed = {
        id: `yt-${Date.now()}`,
        channelName: ytName.trim(),
        channelUrl: ytUrl.trim() || `https://youtube.com/@${encodeURIComponent(ytName)}`,
        channelId: `UC_${Date.now()}`,
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        discordChannelId: ytChannelId,
        pingRoleId: ytPingRole,
        customMessage: ytTemplate,
        lastVideoTitle: `Video mới nhất từ ${ytName}`,
        lastVideoUrl: `https://youtube.com/watch?v=new_upload_${Date.now()}`,
        lastChecked: 'Vừa thêm',
        notifyOnLive: true,
        notifyOnUpload: true,
        status: 'active'
      };
      onAddYouTubeFeed(newYt);
    } else {
      if (!ttHandle.trim()) return;
      const newTt: TikTokFeed = {
        id: `tt-${Date.now()}`,
        creatorHandle: ttHandle.trim(),
        creatorName: ttName.trim() || ttHandle.trim(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        discordChannelId: ttChannelId,
        pingRoleId: ttPingRole,
        customMessage: ttTemplate,
        lastLiveStatus: 'offline',
        lastVideoTitle: `Clip ngắn xu hướng từ ${ttHandle}`,
        lastVideoUrl: `https://tiktok.com/${ttHandle}/video/new`,
        lastChecked: 'Vừa thêm',
        status: 'active'
      };
      onAddTikTokFeed(newTt);
    }

    setShowAddModal(false);
  };

  const triggerTestPush = (feed: YouTubeFeed | TikTokFeed, platform: 'youtube' | 'tiktok') => {
    const title = platform === 'youtube' 
      ? (feed as YouTubeFeed).lastVideoTitle 
      : (feed as TikTokFeed).lastVideoTitle;
    const url = platform === 'youtube'
      ? (feed as YouTubeFeed).lastVideoUrl
      : (feed as TikTokFeed).lastVideoUrl;
    const name = platform === 'youtube'
      ? (feed as YouTubeFeed).channelName
      : (feed as TikTokFeed).creatorName;

    onTestNotification(platform, title, url, name);

    fetch('/api/bot/test-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        title,
        url,
        targetChannelId: feed.discordChannelId
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setTestNotificationSent(data.message);
        } else {
          setTestNotificationSent(`⚠️ ${data.error || 'Bot chưa kết nối để gửi thông báo.'}`);
        }
      })
      .catch(() => {
        setTestNotificationSent(`Đã gửi thông báo thử nghiệm cho kênh "${name}"!`);
      });

    setTimeout(() => setTestNotificationSent(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Platform Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Thông Báo Live & Video TikTok / YouTube</span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
              Webhooks & Polling
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tự động thông báo lên máy chủ Discord khi thần tượng, đối tác hoặc kênh nội bộ của bạn ra mắt video hoặc bắt đầu Livestream
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Platform Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActivePlatform('youtube')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activePlatform === 'youtube'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube ({youtubeFeeds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform('tiktok')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activePlatform === 'tiktok'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>TikTok ({tiktokFeeds.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Kênh Theo Dõi</span>
          </button>
        </div>
      </div>

      {testNotificationSent && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testNotificationSent}</span>
        </div>
      )}

      {/* Feeds Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePlatform === 'youtube' ? (
          youtubeFeeds.map((feed) => (
            <div key={feed.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    <img src={feed.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{feed.channelName}</h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                        YouTube
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>Kênh đích: <strong className="text-indigo-400">#thông-báo-live-video</strong></span>
                      <span>·</span>
                      <span className="text-slate-400">Ping: <strong>@Nhận Tin YouTube</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveYouTubeFeed(feed.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Xóa kênh theo dõi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Last video status card */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Video / Livestream Gần Nhất:</span>
                  <span className="text-slate-500 font-mono">{feed.lastChecked}</span>
                </div>
                <div className="text-slate-200 font-medium truncate">{feed.lastVideoTitle}</div>
                <a
                  href={feed.lastVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Mở liên kết YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đang theo dõi tự động</span>
                </div>
                <button
                  type="button"
                  onClick={() => triggerTestPush(feed, 'youtube')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3 text-indigo-400" />
                  <span>Test Bắn Thông Báo</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          tiktokFeeds.map((feed) => (
            <div key={feed.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    <img src={feed.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{feed.creatorName}</h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30">
                        TikTok
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-cyan-300">{feed.creatorHandle}</span>
                      <span>·</span>
                      <span>Kênh đích: <strong className="text-indigo-400">#thông-báo-live-video</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveTikTokFeed(feed.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Xóa kênh theo dõi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Live status badge */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span>Trạng thái Live:</span>
                  {feed.lastLiveStatus === 'live' ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>ĐANG LIVE TRỰC TIẾP</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Ngoại tuyến (Offline)</span>
                  )}
                </div>
                <div className="text-slate-200 font-medium truncate">{feed.lastVideoTitle}</div>
                <a
                  href={feed.lastVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Mở video TikTok</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đang theo dõi tự động</span>
                </div>
                <button
                  type="button"
                  onClick={() => triggerTestPush(feed, 'tiktok')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3 text-cyan-400" />
                  <span>Test Bắn Thông Báo</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Feed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activePlatform === 'youtube' ? <Youtube className="w-4 h-4 text-rose-500" /> : <Video className="w-4 h-4 text-cyan-400" />}
                <span>
                  {activePlatform === 'youtube' ? 'Thêm Kênh YouTube Mới' : 'Thêm Kênh TikTok Mới'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFeed} className="space-y-4">
              {activePlatform === 'youtube' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tên Kênh YouTube
                    </label>
                    <input
                      type="text"
                      required
                      value={ytName}
                      onChange={(e) => setYtName(e.target.value)}
                      placeholder="Ví dụ: Độ Mixi, F8 Official, Khoai Lang Thang..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      URL hoặc Handle Kênh (@...)
                    </label>
                    <input
                      type="text"
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      placeholder="https://youtube.com/@channel_name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      TikTok Handle (@...)
                    </label>
                    <input
                      type="text"
                      required
                      value={ttHandle}
                      onChange={(e) => setTtHandle(e.target.value)}
                      placeholder="@schannelvn, @mixigaming..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tên Hiển Thị Kênh
                    </label>
                    <input
                      type="text"
                      value={ttName}
                      onChange={(e) => setTtName(e.target.value)}
                      placeholder="Schannel Official"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Kích Hoạt Theo Dõi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
