/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TabType, 
  GuildInfo, 
  Member, 
  YouTubeFeed, 
  TikTokFeed, 
  ReactionRoleGroup, 
  AuditLogEntry, 
  ServerAnalyticsData 
} from './bot/types';
import { 
  INITIAL_GUILDS, 
  INITIAL_MEMBERS, 
  INITIAL_AUTO_RESPONSES, 
  INITIAL_TRACKS, 
  INITIAL_AUTOMOD, 
  INITIAL_YOUTUBE_FEEDS, 
  INITIAL_TIKTOK_FEEDS, 
  INITIAL_REACTION_ROLES, 
  INITIAL_LEVEL_ROLES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_ANALYTICS 
} from './bot/initialData';
import { AutoResponseRule } from './bot/logic/autoResponder';
import { AutoModConfig } from './bot/logic/moderationRules';
import { Track, LoopMode, getNextTrackIndex, getPreviousTrackIndex } from './bot/logic/musicQueue';
import { LevelRoleRule } from './bot/logic/roleEngine';
import {
  INITIAL_DISCORD_COMMANDS,
  DiscordCommandDef,
  executeBotCommand,
  CommandExecutionOutput
} from './bot/logic/commandRegistry';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { CommandsCenterView } from './components/CommandsCenterView';
import { AutoResponderView } from './components/AutoResponderView';
import { MusicPlayerView } from './components/MusicPlayerView';
import { MemberModView } from './components/MemberModView';
import { SocialFeedsView } from './components/SocialFeedsView';
import { AutoRoleView } from './components/AutoRoleView';
import { LogsView } from './components/LogsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ConnectServerView } from './components/ConnectServerView';
import { BotCodeExportModal } from './components/BotCodeExportModal';
import { LoginView } from './components/LoginView';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

function parseDurationToSeconds(value?: string) {
  if (!value) return 180;
  const parts = value.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 180;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 180;
}

export default function App() {
  const APP_START_TIME = React.useMemo(() => Date.now(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [guilds, setGuilds] = useState<GuildInfo[]>(INITIAL_GUILDS);
  const [activeGuild, setActiveGuild] = useState<GuildInfo>(INITIAL_GUILDS[0]);
  const [botStatus, setBotStatus] = useState<'online' | 'idle' | 'dnd'>('idle');
  const [botInfo, setBotInfo] = useState<{ tag: string; ping: number; avatar: string } | null>(null);
  const [discordClientId, setDiscordClientId] = useState('');

  const [modulesEnabled, setModulesEnabled] = useState({
    autoResponder: true,
    music: true,
    moderation: true,
    social: true,
    autoRole: true,
    logs: true
  });

  // Discord Commands (!Prefix & /Slash + Custom Commands)
  const [commands, setCommands] = useState<DiscordCommandDef[]>(INITIAL_DISCORD_COMMANDS);

  // Auto Responder State
  const [autoResponses, setAutoResponses] = useState<AutoResponseRule[]>(INITIAL_AUTO_RESPONSES);

  // Music State
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>('OFF');
  const [volume, setVolume] = useState(80);
  const [equalizerPreset, setEqualizerPreset] = useState('LOFI');

  // Members & Moderation State
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [autoModConfig, setAutoModConfig] = useState<AutoModConfig>(INITIAL_AUTOMOD);

  // Social Feeds State
  const [youtubeFeeds, setYoutubeFeeds] = useState<YouTubeFeed[]>(INITIAL_YOUTUBE_FEEDS);
  const [tiktokFeeds, setTiktokFeeds] = useState<TikTokFeed[]>(INITIAL_TIKTOK_FEEDS);

  // Auto-Role State
  const [reactionRoleGroups, setReactionRoleGroups] = useState<ReactionRoleGroup[]>(INITIAL_REACTION_ROLES);
  const [levelRoles, setLevelRoles] = useState<LevelRoleRule[]>(INITIAL_LEVEL_ROLES);
  const [joinRoleEnabled, setJoinRoleEnabled] = useState(true);

  // Logs & Analytics State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [analytics, setAnalytics] = useState<ServerAnalyticsData>(INITIAL_ANALYTICS);

  // Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/me')
      .then(async res => {
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          if (data.username) setAdminUsername(data.username);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setAuthChecking(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleLogin = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'ADMIN_PASSWORD_NOT_CONFIGURED') {
          return 'Server chưa cấu hình ADMIN_PASSWORD trong file .env.';
        }
        return data.message || 'Đăng nhập thất bại.';
      }
      setIsAuthenticated(true);
      setAdminUsername(data.username || username);
      return null;
    } catch {
      return 'Không thể kết nối tới server.';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
      setBotInfo(null);
    }
  };

  const getNowTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const addAuditLog = (entry: AuditLogEntry) => {
    setAuditLogs(prev => [entry, ...prev]);
  };

  // Sync only the fields that changed. Sending the whole local state here can
  // race with React state updates and overwrite newer server values.
  const syncConfigToBackend = async (
    customCommands?: DiscordCommandDef[],
    customResponses?: AutoResponseRule[],
    customAutoMod?: AutoModConfig,
    customModules?: typeof modulesEnabled,
    customLevelRoles?: LevelRoleRule[],
    customYT?: YouTubeFeed[],
    customTT?: TikTokFeed[],
    customJoinRoleEnabled?: boolean,
    customReactionRoles?: ReactionRoleGroup[]
  ) => {
    const payload: Record<string, unknown> = {};
    if (customCommands !== undefined) payload.commands = customCommands;
    if (customResponses !== undefined) payload.autoResponses = customResponses;
    if (customAutoMod !== undefined) payload.autoModConfig = customAutoMod;
    if (customModules !== undefined) payload.modulesEnabled = customModules;
    if (customLevelRoles !== undefined) payload.levelRoles = customLevelRoles;
    if (customYT !== undefined) payload.youtubeFeeds = customYT;
    if (customTT !== undefined) payload.tiktokFeeds = customTT;
    if (customJoinRoleEnabled !== undefined) payload.joinRoleEnabled = customJoinRoleEnabled;
    if (customReactionRoles !== undefined) payload.reactionRoles = customReactionRoles;
    if (Object.keys(payload).length === 0) return;

    try {
      const res = await fetch('/api/bot/sync-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) setIsAuthenticated(false);
    } catch {
      // Backend temporarily unavailable.
    }
  };

  // Poll live bot status from backend
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/bot/status');
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setDiscordClientId(data.clientIdConfigured || '');
          if (data.status === 'connected') {
            setBotStatus('online');
            if (data.botUser) {
              setBotInfo({
                tag: data.botUser.tag,
                ping: data.botUser.ping,
                avatar: data.botUser.avatar
              });
            }
            let currentGuild: any = null;
            if (Array.isArray(data.guilds) && data.guilds.length > 0) {
              setGuilds(data.guilds);
              currentGuild = data.guilds.find((g: any) => g.id === activeGuild.id) || data.guilds[0];
              setActiveGuild(prev => {
                const found = data.guilds.find((g: any) => g.id === prev.id);
                return found || data.guilds[0];
              });
              if (Array.isArray(currentGuild.members) && currentGuild.members.length > 0) {
                setMembers(currentGuild.members);
              }
            }
            if (currentGuild?.activeVoice) {
              const activeVoice = currentGuild.activeVoice;
              setIsPlaying(Boolean(activeVoice.currentTrack && !activeVoice.isPaused));
              if (typeof activeVoice.volume === 'number') setVolume(activeVoice.volume);
              if (activeVoice.loopMode) setLoopMode(activeVoice.loopMode);
              if (activeVoice.filterPreset) setEqualizerPreset(activeVoice.filterPreset);
              const resolvedTracks = [
                ...(activeVoice.currentTrack ? [activeVoice.currentTrack] : []),
                ...(Array.isArray(activeVoice.queue) ? activeVoice.queue : [])
              ].map((track: any, index: number) => ({
                id: `discord-${track.videoUrl || index}-${index}`,
                title: track.title || 'Bài hát',
                artist: track.author || 'Discord Voice',
                durationSeconds: parseDurationToSeconds(track.durationText),
                url: track.videoUrl || '',
                thumbnailUrl: track.thumbnail || '',
                requestedBy: track.requestedBy || 'Discord',
                genre: 'Discord Voice',
                lyrics: []
              }));
              if (resolvedTracks.length > 0) {
                setTracks(resolvedTracks);
                setCurrentTrackIndex(0);
              }
            }
            if (Array.isArray(data.recentLogs) && data.recentLogs.length > 0) {
              setAuditLogs(data.recentLogs);
            }
            if (data.socialFeeds) {
              if (Array.isArray(data.socialFeeds.youtube)) setYoutubeFeeds(data.socialFeeds.youtube);
              if (Array.isArray(data.socialFeeds.tiktok)) setTiktokFeeds(data.socialFeeds.tiktok);
            }
            if (data.config) {
              if (Array.isArray(data.config.commands)) setCommands(data.config.commands);
              if (Array.isArray(data.config.autoResponses)) setAutoResponses(data.config.autoResponses);
              if (data.config.autoModConfig) setAutoModConfig(data.config.autoModConfig);
              if (typeof data.config.joinRoleEnabled === 'boolean') setJoinRoleEnabled(data.config.joinRoleEnabled);
              if (data.config.modulesEnabled) setModulesEnabled(prev => ({ ...prev, ...data.config.modulesEnabled }));
              if (Array.isArray(data.config.levelRoles)) setLevelRoles(data.config.levelRoles);
              if (Array.isArray(data.config.reactionRoles)) setReactionRoleGroups(data.config.reactionRoles);
            }
          } else if (data.status === 'connecting') {
            setBotStatus('idle');
          } else {
            setBotStatus('dnd');
          }
        }
      } catch {
        // Backend offline
      }
    };

    fetchStatus();
    const analyticsTimer = setInterval(async () => {
      try {
        const analyticsRes = await fetch(`/api/bot/analytics?guildId=${activeGuild.id}`);
        const analyticsData = await analyticsRes.json().catch(() => ({}));
        if (analyticsRes.ok && analyticsData.ok && analyticsData.analytics) setAnalytics(analyticsData.analytics);
      } catch {}
    }, 5000);
    const interval = setInterval(fetchStatus, 4000);
    return () => {
      clearInterval(interval);
      clearInterval(analyticsTimer);
    };
  }, [activeGuild.id, isAuthenticated]);

  const handleToggleModule = (key: keyof typeof modulesEnabled) => {
    setModulesEnabled(prev => {
      const nextVal = !prev[key];
      const updated = { ...prev, [key]: nextVal };
      addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: getNowTime(),
        actionType: 'ROLE_UPDATE',
        executor: { name: 'Admin Dashboard', isBot: false },
        details: `${nextVal ? 'Kích hoạt' : 'Tạm dừng'} phân hệ "${key}".`,
        severity: 'info'
      });
      syncConfigToBackend(undefined, undefined, undefined, updated);
      return updated;
    });
  };

  // Music handlers: control the real Discord voice engine, then mirror UI state.
  const controlVoiceFromDashboard = async (
    action: 'pause' | 'skip' | 'previous' | 'volume' | 'loop' | 'shuffle' | 'filter',
    payload: Record<string, unknown> = {}
  ) => {
    const res = await fetch('/api/bot/voice-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId: activeGuild.id, action, ...payload })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Không thể điều khiển Voice.');
    return data;
  };

  const handlePlayPause = async () => {
    try {
      const data = await controlVoiceFromDashboard('pause');
      setIsPlaying(Boolean(data.message && data.message.includes('tiếp tục')));
    } catch {}
  };

  const handleNextTrack = async () => {
    try {
      const data = await controlVoiceFromDashboard('skip');
      if (!data.track) {
        setIsPlaying(false);
        return;
      }
      const idx = tracks.findIndex(track => track.url === data.track.videoUrl || track.title === data.track.title);
      if (idx >= 0) {
        setCurrentTrackIndex(idx);
      } else {
        const resolved: Track = {
          id: `discord-${Date.now()}`,
          title: data.track.title || 'Bài hát đang phát',
          artist: data.track.author || 'Discord',
          durationSeconds: parseDurationToSeconds(data.track.durationText),
          url: data.track.videoUrl || '',
          thumbnailUrl: data.track.thumbnail || '',
          requestedBy: data.track.requestedBy || 'Discord',
          genre: 'Discord Voice',
          lyrics: []
        };
        setTracks(prev => [resolved, ...prev]);
        setCurrentTrackIndex(0);
      }
      setIsPlaying(!Boolean(data.message && data.message.includes('bỏ qua bài hát hiện tại')));
    } catch {
      setIsPlaying(false);
    }
  };

  const handlePrevTrack = async () => {
    try {
      const data = await controlVoiceFromDashboard('previous');
      if (data.track) {
        const idx = tracks.findIndex(track => track.url === data.track.videoUrl || track.title === data.track.title);
        if (idx >= 0) setCurrentTrackIndex(idx);
      }
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleToggleLoop = async () => {
    const next = loopMode === 'OFF' ? 'TRACK' : loopMode === 'TRACK' ? 'QUEUE' : 'OFF';
    try {
      const data = await controlVoiceFromDashboard('loop', { mode: next });
      setLoopMode(data.loopMode || next);
    } catch {}
  };

  const handleShuffle = async () => {
    try {
      const data = await controlVoiceFromDashboard('shuffle');
      if (Array.isArray(data.queue)) {
        const shuffled = data.queue.map((track: any, index: number) => ({
          id: `discord-${track.videoUrl || index}-${Date.now()}-${index}`,
          title: track.title || 'Bài hát',
          artist: track.author || 'Discord Voice',
          durationSeconds: parseDurationToSeconds(track.durationText),
          url: track.videoUrl || '',
          thumbnailUrl: track.thumbnail || '',
          requestedBy: track.requestedBy || 'Discord',
          genre: 'Discord Voice',
          lyrics: []
        }));
        setTracks(prev => {
          const current = prev[currentTrackIndex];
          return current ? [current, ...shuffled] : shuffled;
        });
      }
    } catch {}
  };

  const handleAddTrack = async (track: Track) => {
    try {
      const data = await controlVoiceFromDashboard('play', { query: track.url || track.title });
      const resolved = data.track;
      if (resolved) {
        const mapped: Track = {
          id: `discord-${resolved.videoUrl || Date.now()}`,
          title: resolved.title || track.title,
          artist: resolved.author || track.artist || 'Discord Voice',
          durationSeconds: parseDurationToSeconds(resolved.durationText),
          url: resolved.videoUrl || track.url || '',
          thumbnailUrl: resolved.thumbnail || track.thumbnailUrl || '',
          requestedBy: resolved.requestedBy || 'Web/App Admin',
          genre: 'Discord Voice',
          lyrics: []
        };
        setTracks(prev => prev.some(item => item.url === mapped.url) ? prev : [...prev, mapped]);
      }
      setIsPlaying(true);
    } catch {}
  };

  const handleRemoveTrack = async (index: number) => {
    try {
      if (index === currentTrackIndex) {
        await controlVoiceFromDashboard('skip');
        setIsPlaying(false);
        return;
      }
      const queueIndex = index > currentTrackIndex ? index - 1 : index;
      const data = await controlVoiceFromDashboard('remove', { queueIndex });
      if (Array.isArray(data.queue)) {
        const mapped = data.queue.map((item: any, i: number) => ({
          id: `discord-${item.videoUrl || i}-${Date.now()}`,
          title: item.title || 'Bài hát',
          artist: item.author || 'Discord Voice',
          durationSeconds: parseDurationToSeconds(item.durationText),
          url: item.videoUrl || '',
          thumbnailUrl: item.thumbnail || '',
          requestedBy: item.requestedBy || 'Discord',
          genre: 'Discord Voice',
          lyrics: []
        }));
        setTracks(prev => {
          const current = prev[currentTrackIndex];
          return current ? [current, ...mapped] : mapped;
        });
      }
    } catch {}
  };

  // Member moderation handlers (real Discord actions)
  const handleWarnMember = async (memberId: string, reason: string): Promise<boolean> => {
    const member = members.find(m => m.id === memberId);
    if (!member) return false;
    try {
      const res = await fetch('/api/bot/warn-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: activeGuild.id, memberId, reason })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return false;
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, warnings: Number(data.warnings || m.warnings + 1) } : m));
      addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: getNowTime(),
        actionType: 'MEMBER_WARN',
        executor: { name: 'Admin Dashboard', isBot: false },
        target: { name: member.displayName, id: member.id },
        details: `Cảnh cáo thành viên: ${reason}`,
        severity: 'warning'
      });
      return true;
    } catch {
      return false;
    }
  };

  const executeModeration = async (
    memberId: string,
    action: 'TIMEOUT' | 'KICK' | 'BAN',
    reason: string,
    durationMinutes?: number
  ): Promise<boolean> => {
    const member = members.find(m => m.id === memberId);
    if (!member) return false;
    try {
      const res = await fetch('/api/bot/moderate-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: activeGuild.id, memberId, action, durationMinutes, reason })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return false;

      if (action === 'TIMEOUT') {
        setMembers(prev => prev.map(m => m.id === memberId ? {
          ...m,
          isTimedOut: true,
          timeoutUntil: `Hết hạn sau ${durationMinutes || 60} phút`
        } : m));
      } else {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      }

      addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: getNowTime(),
        actionType: action === 'KICK' ? 'MEMBER_KICK' : action === 'BAN' ? 'MEMBER_BAN' : 'MEMBER_TIMEOUT',
        executor: { name: 'Admin Dashboard', isBot: false },
        target: { name: member.displayName, id: member.id },
        details: `${action === 'TIMEOUT' ? 'Timeout' : action === 'KICK' ? 'Kick' : 'Ban'}: ${reason}`,
        severity: 'danger'
      });
    } catch {
      return false;
    }
    return true;
  };

  const handleTimeoutMember = (memberId: string, durationMinutes: number, reason: string): Promise<boolean> => {
    return executeModeration(memberId, 'TIMEOUT', reason, durationMinutes);
  };

  const handleKickMember = (memberId: string, reason: string): Promise<boolean> => {
    return executeModeration(memberId, 'KICK', reason);
  };

  const handleBanMember = (memberId: string, reason: string): Promise<boolean> => {
    return executeModeration(memberId, 'BAN', reason);
  };

  const handleExecuteCommandInApp = (input: string): CommandExecutionOutput => {
    const result = executeBotCommand(input, commands, {
      authorName: 'Bạn (Web/App Controller)',
      serverName: activeGuild.name,
      memberCount: activeGuild.memberCount,
      onlineCount: activeGuild.onlineCount,
      uptimeSeconds: Math.floor((Date.now() - APP_START_TIME) / 1000),
      currentTrackTitle: tracks[currentTrackIndex]?.title,
      queueCount: tracks.length,
      youtubeCount: youtubeFeeds.length,
      tiktokCount: tiktokFeeds.length
    });

    if (result.sideEffect?.type === 'PLAY_MUSIC' && result.sideEffect.payload) {
      const songName = result.sideEffect.payload;
      fetch('/api/bot/voice-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: activeGuild.id,
          action: 'play',
          query: songName
        })
      }).catch(() => {});
    } else if (result.sideEffect?.type === 'PAUSE_MUSIC') {
      fetch('/api/bot/voice-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: activeGuild.id, action: 'pause' })
      }).catch(() => {});
    } else if (result.sideEffect?.type === 'SKIP_MUSIC') {
      fetch('/api/bot/voice-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: activeGuild.id, action: 'skip' })
      }).catch(() => {});
    }

    addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: getNowTime(),
      actionType: 'ROLE_UPDATE',
      executor: { name: 'Web/App Controller', isBot: false },
      details: `Thực thi lệnh từ xa: "${input}"`,
      severity: 'info',
      channelName: '#lệnh-bot'
    });

    return result;
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        Đang kiểm tra phiên Admin...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        guilds={guilds}
        activeGuild={activeGuild}
        onSelectGuild={(g) => {
          setActiveGuild(g);
          addAuditLog({
            id: `log-${Date.now()}`,
            timestamp: getNowTime(),
            actionType: 'ROLE_UPDATE',
            executor: { name: 'Quản Trị Viên', isBot: false },
            details: `Chuyển vùng điều khiển sang máy chủ "${g.name}".`,
            severity: 'info'
          });
        }}
        botStatus={botStatus}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          activeGuild={activeGuild}
          onInviteBot={() => setCurrentTab('bot-deploy')}
          adminUsername={adminUsername}
          onLogout={handleLogout}
        />

        {/* Offline / Connect Banner if Bot is not connected */}
        {botStatus !== 'online' && (
          <div className="bg-amber-950/60 border-b border-amber-800/60 px-6 py-2.5 flex items-center justify-between gap-4 text-xs shrink-0">
            <div className="flex items-center gap-2.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Bot Discord hiện đang <strong>Chưa Kết Nối (Offline)</strong>. Hãy cấu hình Token để kích hoạt bot 24/7 và điều khiển trực tiếp trên Discord của bạn.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('bot-deploy')}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <span>Cấu Hình Token Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <DashboardOverview
                guild={activeGuild}
                modulesEnabled={modulesEnabled}
                onToggleModule={handleToggleModule}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenExport={() => setCurrentTab('bot-deploy')}
                discordClientId={discordClientId}
              />
            )}

            {currentTab === 'commands' && (
              <CommandsCenterView
                commands={commands}
                onToggleCommand={(id) => {
                  setCommands(prev => {
                    const updated = prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c));
                    syncConfigToBackend(updated);
                    return updated;
                  });
                }}
                onAddCustomCommand={(newCmd) => {
                  setCommands(prev => {
                    const updated = [newCmd, ...prev];
                    syncConfigToBackend(updated);
                    return updated;
                  });
                  addAuditLog({
                    id: `log-${Date.now()}`,
                    timestamp: getNowTime(),
                    actionType: 'ROLE_UPDATE',
                    executor: { name: 'Admin Dashboard', isBot: false },
                    details: `Tạo lệnh Discord tùy chỉnh mới: !${newCmd.name}`,
                    severity: 'info'
                  });
                }}
                onDeleteCustomCommand={(id) => {
                  setCommands(prev => {
                    const updated = prev.filter(c => c.id !== id);
                    syncConfigToBackend(updated);
                    return updated;
                  });
                }}
                onExecuteCommandInApp={handleExecuteCommandInApp}
                guild={activeGuild}
              />
            )}

            {currentTab === 'auto-responder' && (
              <AutoResponderView
                rules={autoResponses}
                onSaveRule={(newRule) => {
                  setAutoResponses(prev => {
                    const idx = prev.findIndex(r => r.id === newRule.id);
                    let updated: AutoResponseRule[];
                    if (idx !== -1) {
                      updated = [...prev];
                      updated[idx] = newRule;
                    } else {
                      updated = [newRule, ...prev];
                    }
                    syncConfigToBackend(undefined, updated);
                    return updated;
                  });
                  addAuditLog({
                    id: `log-${Date.now()}`,
                    timestamp: getNowTime(),
                    actionType: 'ROLE_UPDATE',
                    executor: { name: 'Admin Dashboard', isBot: false },
                    details: `Cập nhật quy tắc phản hồi: "${newRule.trigger}"`,
                    severity: 'info'
                  });
                }}
                onDeleteRule={(id) => {
                  setAutoResponses(prev => {
                    const updated = prev.filter(r => r.id !== id);
                    syncConfigToBackend(undefined, updated);
                    return updated;
                  });
                }}
                onToggleRule={(id) => {
                  setAutoResponses(prev => {
                    const updated = prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r));
                    syncConfigToBackend(undefined, updated);
                    return updated;
                  });
                }}
                guild={activeGuild}
              />
            )}

            {currentTab === 'music' && (
              <MusicPlayerView
                tracks={tracks}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                loopMode={loopMode}
                volume={volume}
                equalizerPreset={equalizerPreset}
                onPlayPause={handlePlayPause}
                onNextTrack={handleNextTrack}
                onPrevTrack={handlePrevTrack}
                onToggleLoop={handleToggleLoop}
                onShuffle={handleShuffle}
                onSetVolume={async (vol) => {
                  setVolume(vol);
                  try { await controlVoiceFromDashboard('volume', { volume: vol }); } catch {}
                }}
                onSetEqualizer={async (eq) => {
                  try {
                    const data = await controlVoiceFromDashboard('filter', { preset: eq });
                    setEqualizerPreset(data.filterPreset || eq);
                  } catch {}
                }}
                onAddTrack={handleAddTrack}
                onRemoveTrack={handleRemoveTrack}
                guild={activeGuild}
              />
            )}

            {currentTab === 'moderation' && (
              <MemberModView
                members={members}
                autoModConfig={autoModConfig}
                onUpdateAutoMod={(newConfig) => {
                  setAutoModConfig(newConfig);
                  syncConfigToBackend(undefined, undefined, newConfig);
                  addAuditLog({
                    id: `log-${Date.now()}`,
                    timestamp: getNowTime(),
                    actionType: 'ROLE_UPDATE',
                    executor: { name: 'Admin Dashboard', isBot: false },
                    details: 'Đã cập nhật bộ quy tắc Auto-Mod bảo vệ máy chủ.',
                    severity: 'warning'
                  });
                }}
                onWarnMember={handleWarnMember}
                onTimeoutMember={handleTimeoutMember}
                onKickMember={handleKickMember}
                onBanMember={handleBanMember}
                guild={activeGuild}
              />
            )}

            {currentTab === 'social' && (
              <SocialFeedsView
                youtubeFeeds={youtubeFeeds}
                tiktokFeeds={tiktokFeeds}
                onAddYouTubeFeed={(feed) => {
                  setYoutubeFeeds(prev => {
                    const updated = [...prev, feed];
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, updated, undefined);
                    return updated;
                  });
                  addAuditLog({
                    id: `log-${Date.now()}`,
                    timestamp: getNowTime(),
                    actionType: 'SOCIAL_ALERT',
                    executor: { name: 'Admin Dashboard', isBot: false },
                    details: `Đăng ký theo dõi kênh YouTube: "${feed.channelName}"`,
                    severity: 'info',
                    channelName: '#thông-báo-live-video'
                  });
                }}
                onRemoveYouTubeFeed={(id) => {
                  setYoutubeFeeds(prev => {
                    const updated = prev.filter(f => f.id !== id);
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, updated, undefined);
                    return updated;
                  });
                }}
                onToggleYouTubeFeed={(id) => {
                  setYoutubeFeeds(prev => {
                    const updated = prev.map(f => (f.id === id ? { ...f, status: f.status === 'active' ? 'paused' : 'active' } : f));
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, updated, undefined);
                    return updated;
                  });
                }}
                onUpdateYouTubeFeed={(feed) => {
                  setYoutubeFeeds(prev => {
                    const updated = prev.map(f => (f.id === feed.id ? feed : f));
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, updated, undefined);
                    return updated;
                  });
                }}
                onAddTikTokFeed={(feed) => {
                  setTiktokFeeds(prev => {
                    const updated = [...prev, feed];
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, undefined, updated);
                    return updated;
                  });
                  addAuditLog({
                    id: `log-${Date.now()}`,
                    timestamp: getNowTime(),
                    actionType: 'SOCIAL_ALERT',
                    executor: { name: 'Admin Dashboard', isBot: false },
                    details: `Đăng ký theo dõi tài khoản TikTok: ${feed.creatorHandle}`,
                    severity: 'info',
                    channelName: '#thông-báo-live-video'
                  });
                }}
                onRemoveTikTokFeed={(id) => {
                  setTiktokFeeds(prev => {
                    const updated = prev.filter(f => f.id !== id);
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, undefined, updated);
                    return updated;
                  });
                }}
                onToggleTikTokFeed={(id) => {
                  setTiktokFeeds(prev => {
                    const updated = prev.map(f => (f.id === id ? { ...f, status: f.status === 'active' ? 'paused' : 'active' } : f));
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, undefined, updated);
                    return updated;
                  });
                }}
                onUpdateTikTokFeed={(feed) => {
                  setTiktokFeeds(prev => {
                    const updated = prev.map(f => (f.id === feed.id ? feed : f));
                    syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, undefined, updated);
                    return updated;
                  });
                }}
                guild={activeGuild}
              />
            )}

            {currentTab === 'auto-role' && (
              <AutoRoleView
                reactionRoleGroups={reactionRoleGroups}
                levelRoles={levelRoles}
                joinRoleEnabled={joinRoleEnabled}
                onToggleJoinRole={() => {
                  setJoinRoleEnabled(prev => {
                    const next = !prev;
                    void syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, undefined, undefined, next, reactionRoleGroups);
                    return next;
                  });
                }}
                onAddReactionRoleGroup={(group) => {
                  setReactionRoleGroups(prev => {
                    const updated = [...prev, group];
                    void syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, undefined, undefined, joinRoleEnabled, updated);
                    return updated;
                  });
                }}
                onRemoveReactionRoleGroup={(id) => {
                  setReactionRoleGroups(prev => {
                    const updated = prev.filter(g => g.id !== id);
                    void syncConfigToBackend(undefined, undefined, undefined, undefined, undefined, undefined, undefined, joinRoleEnabled, updated);
                    return updated;
                  });
                }}
                onAddLevelRole={(rule) => {
                  setLevelRoles(prev => {
                    const updated = [...prev, rule].sort((a, b) => a.levelRequired - b.levelRequired);
                    syncConfigToBackend(undefined, undefined, undefined, undefined, updated, undefined, undefined);
                    return updated;
                  });
                  addAuditLog({
                    id: `log-${Date.now()}`,
                    timestamp: getNowTime(),
                    actionType: 'ROLE_UPDATE',
                    executor: { name: 'Admin Dashboard', isBot: false },
                    details: `Thêm mốc thưởng vai trò Level ${rule.levelRequired}: "${rule.roleName}"`,
                    severity: 'info'
                  });
                }}
                onRemoveLevelRole={(roleId) => {
                  setLevelRoles(prev => {
                    const updated = prev.filter(r => r.roleId !== roleId);
                    syncConfigToBackend(undefined, undefined, undefined, undefined, updated, undefined, undefined);
                    return updated;
                  });
                }}
                guild={activeGuild}
              />
            )}

            {currentTab === 'logs' && (
              <LogsView
                logs={auditLogs}
                onClearLogs={async () => {
                  try { await fetch('/api/bot/logs', { method: 'DELETE' }); } finally { setAuditLogs([]); }
                }}
                guild={activeGuild}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView
                analytics={analytics}
                guild={activeGuild}
              />
            )}

            {currentTab === 'bot-deploy' && (
              <ConnectServerView
                autoResponses={autoResponses}
                autoModConfig={autoModConfig}
                joinRoleEnabled={joinRoleEnabled}
                modulesEnabled={modulesEnabled}
                onOpenExportModal={() => setIsExportModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Bot Code & Deployment Exporter Modal */}
      <BotCodeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
