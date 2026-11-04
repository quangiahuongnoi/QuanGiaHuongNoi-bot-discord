import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  Music, 
  Search, 
  Plus, 
  Trash2, 
  Headphones, 
  Radio, 
  Sliders, 
  ListMusic, 
  FileText,
  Sparkles
} from 'lucide-react';
import { Track, LoopMode, formatDuration } from '../bot/logic/musicQueue';
import { GuildInfo } from '../bot/types';

interface MusicPlayerViewProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  loopMode: LoopMode;
  volume: number;
  equalizerPreset: string;
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleLoop: () => void;
  onShuffle: () => void;
  onSetVolume: (vol: number) => void;
  onSetEqualizer: (preset: any) => void;
  onAddTrack: (track: Track) => void;
  onRemoveTrack: (index: number) => void;
  guild: GuildInfo;
}

export const MusicPlayerView: React.FC<MusicPlayerViewProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  loopMode,
  volume,
  equalizerPreset,
  onPlayPause,
  onNextTrack,
  onPrevTrack,
  onToggleLoop,
  onShuffle,
  onSetVolume,
  onSetEqualizer,
  onAddTrack,
  onRemoveTrack,
  guild
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics' | 'equalizer'>('queue');
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  // Live Discord Server Voice Channel state
  const [liveVoiceChannels, setLiveVoiceChannels] = useState<{ id: string; name: string; memberCount: number }[]>([]);
  const [selectedVoiceChannelId, setSelectedVoiceChannelId] = useState<string>('');
  const [activeLiveVoiceName, setActiveLiveVoiceName] = useState<string | null>(null);
  const [liveVoiceNotice, setLiveVoiceNotice] = useState<string | null>(null);
  const [isControllingVoice, setIsControllingVoice] = useState(false);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  const fetchLiveVoiceState = async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'connected' && data.guilds?.length > 0) {
          const currentGuild = data.guilds.find((g: any) => g.id === guild.id) || data.guilds[0];
          if (Array.isArray(currentGuild.voiceChannels)) {
            setLiveVoiceChannels(currentGuild.voiceChannels);
            if (!selectedVoiceChannelId && currentGuild.voiceChannels.length > 0) {
              setSelectedVoiceChannelId(currentGuild.activeVoice?.channelId || currentGuild.voiceChannels[0].id);
            }
          }
          if (currentGuild.activeVoice?.channelName) {
            setActiveLiveVoiceName(currentGuild.activeVoice.channelName);
          } else {
            setActiveLiveVoiceName(null);
          }
        }
      }
    } catch {
      // Ignore network errors
    }
  };

  useEffect(() => {
    fetchLiveVoiceState();
  }, []);

  const handleControlRealVoice = async (
    action: 'join' | 'play' | 'pause' | 'skip' | 'stop' | 'leave',
    customQuery?: string
  ) => {
    setIsControllingVoice(true);

    const endpoint = `${window.location.origin}/api/bot/voice-control`;
    let lastError: Error | null = null;

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 12000);

          const res = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
              guildId: guild.id,
              voiceChannelId: selectedVoiceChannelId || undefined,
              action,
              query: customQuery || currentTrack?.title || 'Chìm Sâu RPT MCK'
            })
          });

          window.clearTimeout(timeout);

          const raw = await res.text();
          let data: any = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            throw new Error(
              res.status === 401
                ? 'Phiên đăng nhập Admin đã hết hạn. Hãy đăng nhập lại.'
                : res.status >= 500
                  ? `Máy chủ Admin trả HTTP ${res.status}. Hãy thử lại.`
                  : `API Voice trả dữ liệu không hợp lệ (HTTP ${res.status}).`
            );
          }

          if (res.ok && data.ok) {
            if (data.channelName) setActiveLiveVoiceName(data.channelName);
            if (action === 'leave') setActiveLiveVoiceName(null);
            setLiveVoiceNotice(data.message || 'Đã thực hiện lệnh Voice.');
            window.setTimeout(() => setLiveVoiceNotice(null), 4500);
            return data;
          }

          const backendMessage =
            data?.error ||
            data?.message ||
            `Voice API từ chối yêu cầu (HTTP ${res.status}).`;

          // 502/503/504 are transient Render/proxy failures; retry once.
          if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt === 0) {
            await new Promise((resolve) => window.setTimeout(resolve, 1200));
            continue;
          }

          setLiveVoiceNotice(backendMessage);
          window.setTimeout(() => setLiveVoiceNotice(null), 4500);
          return null;
        } catch (err: any) {
          lastError = err instanceof Error ? err : new Error(String(err || 'Unknown Voice request error'));
          if (attempt === 0) {
            await new Promise((resolve) => window.setTimeout(resolve, 1200));
            continue;
          }
        }
      }

      const detail = lastError?.name === 'AbortError'
        ? 'Voice API phản hồi quá chậm (timeout 12 giây).'
        : lastError?.message || 'Không thể kết nối Voice API.';
      setLiveVoiceNotice(`Không thể gửi lệnh Voice: ${detail} [${endpoint}]`);
      window.setTimeout(() => setLiveVoiceNotice(null), 6000);
      return null;
    } finally {
      setIsControllingVoice(false);
    }
  };

  useEffect(() => {
    setCurrentTime(0);
  }, [currentTrack?.id]);

  // Progress display follows the local UI session while Discord Voice remains authoritative.
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.durationSeconds) {
            onNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, onNextTrack]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const queryText = searchQuery.trim();
    try {
      const data = await handleControlRealVoice('play', queryText);
      if (data?.track) {
        const resolved: Track = {
          id: `discord-${Date.now()}`,
          title: data.track.title || queryText,
          artist: data.track.author || 'Discord Voice',
          durationSeconds: parseDurationToSeconds(data.track.durationText),
          url: data.track.videoUrl || '',
          thumbnailUrl: data.track.thumbnail || '',
          requestedBy: data.track.requestedBy || 'Web/App Admin',
          genre: 'Discord Voice',
          lyrics: []
        };
        onAddTrack(resolved);
        setShowAddSuccess(true);
        setSearchQuery('');
        setTimeout(() => setShowAddSuccess(false), 3000);
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Voice Channel Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white">Kênh Thoại (Voice Channel):</span>
              <span className="text-xs font-semibold text-emerald-400">
                🔊 {activeLiveVoiceName || 'Tự động vào phòng bạn đang ngồi khi gõ !play / !join'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span>Audio: <strong>nguồn trực tiếp Discord Voice</strong></span>
              <span>·</span>
              <span>Engine: <strong>@discordjs/voice + FFmpeg Opus</strong></span>
              <span>·</span>
              <span className="text-emerald-400">Tự động nhận diện phòng bạn đang ngồi trong Server</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {liveVoiceChannels.length > 0 && (
            <select
              value={selectedVoiceChannelId}
              onChange={(e) => setSelectedVoiceChannelId(e.target.value)}
              aria-label="Chọn kênh thoại Discord"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              {liveVoiceChannels.map((vc) => (
                <option key={vc.id} value={vc.id}>
                  🔊 {vc.name} ({vc.memberCount} người)
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            disabled={isControllingVoice}
            onClick={() => handleControlRealVoice('join')}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Vào Phòng Voice Ngay
          </button>

          <button
            type="button"
            disabled={isControllingVoice}
            onClick={() => handleControlRealVoice('play')}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Phát Lên Server Thật</span>
          </button>

          <button
            type="button"
            disabled={isControllingVoice}
            onClick={() => handleControlRealVoice('skip')}
            className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Bỏ Qua Server</span>
          </button>

          <button
            type="button"
            disabled={isControllingVoice}
            onClick={() => handleControlRealVoice('stop')}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Dừng Server</span>
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Tạm Dừng Nghe Thử' : 'Nghe Thử Trên Web'}</span>
          </button>
        </div>
      </div>

      {liveVoiceNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
          {liveVoiceNotice}
        </div>
      )}

      {/* Main Music Player View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player & Album Display (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Vinyl Blur */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Spinning Vinyl Album Card */}
              <div className="relative shrink-0">
                <div 
                  className={`w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-800 flex items-center justify-center ${
                    isPlaying ? 'ring-4 ring-indigo-500/30' : ''
                  }`}
                >
                  {currentTrack?.thumbnailUrl ? (
                    <img
                      src={currentTrack.thumbnailUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-violet-800 flex items-center justify-center text-white">
                      <Music className="w-12 h-12 text-indigo-300" />
                    </div>
                  )}
                </div>

                {/* Disc Groove Ring Icon */}
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-md ${
                  isPlaying ? 'animate-spin' : ''
                }`}>
                  <Music className="w-4 h-4" />
                </div>
              </div>

              {/* Track Details */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">
                  {currentTrack?.genre || 'Hi-Fi Audio Stream'}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white truncate tracking-tight">
                  {currentTrack?.title || 'Chưa chọn bài hát'}
                </h3>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {currentTrack?.artist || 'Unknown Artist'}
                </p>
                <div className="text-[11px] text-slate-400 mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span>Yêu cầu bởi: <strong className="text-slate-200">{currentTrack?.requestedBy || 'Bot'}</strong></span>
                  <span>·</span>
                  <span>EQ: <strong className="text-indigo-300">{equalizerPreset}</strong></span>
                </div>
              </div>
            </div>

            {/* Audio Wave Visualizer */}
            <div className="mt-6 flex items-end justify-center sm:justify-start gap-1 h-8 px-2">
              {[40, 65, 85, 30, 95, 50, 70, 90, 45, 60, 80, 55, 75, 90, 40, 70, 85, 60, 95, 50].map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlaying ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (height * (Math.sin(i + currentTime) + 1.2)) / 2)}%` : '20%'
                  }}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <input
                type="range"
                min="0"
                max={currentTrack?.durationSeconds || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                aria-label="Thanh trượt thời gian bài hát"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(currentTrack?.durationSeconds || 0)}</span>
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Buttons: Shuffle, Prev, Play/Pause, Next, Loop */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onShuffle}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Xáo trộn danh sách"
                  aria-label="Xáo trộn danh sách"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onPrevTrack}
                  className="p-2 text-slate-300 hover:text-white transition-colors"
                  title="Bài trước"
                  aria-label="Bài trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onPlayPause}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                  aria-label={isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={onNextTrack}
                  className="p-2 text-slate-300 hover:text-white transition-colors"
                  title="Bài tiếp theo"
                  aria-label="Bài tiếp theo"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onToggleLoop}
                  className={`p-2 transition-colors relative ${
                    loopMode !== 'OFF' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Lặp lại: ${loopMode}`}
                  aria-label={`Lặp lại: ${loopMode}`}
                >
                  <Repeat className="w-4 h-4" />
                  {loopMode === 'TRACK' && (
                    <span className="absolute text-[9px] -top-0.5 right-0.5 bg-indigo-600 text-white rounded-full px-1">1</span>
                  )}
                  {loopMode === 'QUEUE' && (
                    <span className="absolute text-[9px] -top-0.5 right-0.5 bg-indigo-600 text-white rounded-full px-1">∞</span>
                  )}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 w-full sm:w-44">
                <button
                  type="button"
                  onClick={() => onSetVolume(volume === 0 ? 80 : 0)}
                  className="text-slate-400 hover:text-white"
                  aria-label={volume === 0 ? 'Bật tiếng' : 'Tắt tiếng'}
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => {
                    onSetVolume(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  aria-label="Thanh chỉnh âm lượng"
                />
                <span className="text-[11px] font-mono text-slate-400 w-8 text-right tabular-nums">
                  {volume}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick YouTube / Direct Audio Search Bar */}
          <form onSubmit={handleSearchSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài hát YouTube hoặc dán link audio trực tiếp..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Bài Hát</span>
            </button>
          </form>

          {showAddSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đã thêm bài hát vào hàng đợi thành công!</span>
            </div>
          )}
        </div>

        {/* Right Column: Tabbed View (Queue / Lyrics / Equalizer) (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[520px]">
          {/* Tabs Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg mb-4 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'queue' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Hàng Đợi ({tracks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lyrics')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'lyrics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lời Bài Hát</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('equalizer')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'equalizer' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Equalizer</span>
            </button>
          </div>

          {/* Tab 1: Queue List */}
          {activeTab === 'queue' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {tracks.map((track, idx) => {
                const isCurrent = idx === currentTrackIndex;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-5 text-center font-mono text-[11px] text-slate-500 shrink-0 tabular-nums">
                        {isCurrent ? '▶' : idx + 1}
                      </span>
                      <div className="w-9 h-9 rounded bg-slate-800 overflow-hidden shrink-0">
                        {track.thumbnailUrl ? (
                          <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="truncate">
                        <div className={`truncate font-semibold ${isCurrent ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {track.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {track.artist} · {formatDuration(track.durationSeconds)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {tracks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveTrack(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Xóa khỏi hàng đợi"
                          aria-label={`Xóa bài hát ${track.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Synchronized Lyrics */}
          {activeTab === 'lyrics' && (
            <div className="flex-1 overflow-y-auto space-y-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
                {currentTrack?.title}
              </div>
              {currentTrack?.lyrics && currentTrack.lyrics.length > 0 ? (
                currentTrack.lyrics.map((line, idx) => (
                  <p
                    key={idx}
                    className={`text-xs transition-colors leading-relaxed ${
                      idx === 1 ? 'text-indigo-300 font-bold scale-105' : 'text-slate-400'
                    }`}
                  >
                    {line}
                  </p>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-12">
                  Chưa có lời bài hát cho ca khúc này.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Equalizer Presets */}
          {activeTab === 'equalizer' && (
            <div className="flex-1 space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Chọn cấu hình âm thanh tối ưu cho tai nghe và phong cách nghe nhạc:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {eqPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSetEqualizer(preset.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      equalizerPreset === preset.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>{preset.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {preset.id === 'BASS_BOOST' && '+8dB dải trầm 60Hz'}
                      {preset.id === 'LOFI' && 'Cắt dải cao, thêm âm ấm vinyl'}
                      {preset.id === 'VOCAL' && 'Tôn rõ lời bài hát 1kHz - 4kHz'}
                      {preset.id === 'NIGHTCORE' && 'Tăng tốc độ & tần số cao'}
                      {preset.id === 'FLAT' && 'Âm thanh tự nhiên gốc'}
                      {preset.id === 'ACOUSTIC' && 'Tái hiện không gian mộc'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
