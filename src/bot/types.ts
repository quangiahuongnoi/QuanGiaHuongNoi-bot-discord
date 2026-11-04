import { AutoResponseRule } from './logic/autoResponder';
import { AutoModConfig } from './logic/moderationRules';
import { Track, LoopMode } from './logic/musicQueue';
import { LevelRoleRule } from './logic/roleEngine';

export type TabType = 
  | 'overview' 
  | 'commands'
  | 'auto-responder' 
  | 'music' 
  | 'moderation' 
  | 'social' 
  | 'auto-role' 
  | 'logs' 
  | 'analytics' 
  | 'bot-deploy';

export interface GuildInfo {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  onlineCount: number;
  ownerName: string;
  region: string;
  createdDate: string;
  channels: { id: string; name: string; type: 'text' | 'voice' }[];
  roles: { id: string; name: string; color: string; memberCount: number; hoist: boolean }[];
}

export interface Member {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isBot: boolean;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  joinedAt: string;
  roles: string[]; // Role IDs
  warnings: number;
  xp: number;
  level: number;
  isTimedOut?: boolean;
  timeoutUntil?: string;
}

export interface YouTubeFeed {
  id: string;
  channelName: string;
  channelUrl: string;
  channelId: string;
  avatar: string;
  discordChannelId: string;
  pingRoleId?: string;
  customMessage: string;
  lastVideoTitle: string;
  lastVideoUrl: string;
  lastChecked: string;
  notifyOnLive: boolean;
  notifyOnUpload: boolean;
  lastLiveStatus?: 'offline' | 'live';
  status: 'active' | 'paused' | 'error';
}

export interface TikTokFeed {
  id: string;
  creatorHandle: string;
  creatorName: string;
  avatar: string;
  discordChannelId: string;
  pingRoleId?: string;
  customMessage: string;
  notifyOnLive: boolean;
  notifyOnUpload: boolean;
  lastLiveStatus: 'offline' | 'live';
  lastVideoTitle: string;
  lastVideoUrl: string;
  lastChecked: string;
  status: 'active' | 'paused';
}

export interface ReactionRoleGroup {
  id: string;
  title: string;
  description: string;
  channelId: string;
  type: 'BUTTON' | 'REACTION' | 'SELECT_MENU';
  items: {
    emoji: string;
    roleId: string;
    roleName: string;
    description?: string;
    color: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: 
    | 'MEMBER_JOIN'
    | 'MEMBER_LEAVE'
    | 'MEMBER_WARN'
    | 'MEMBER_TIMEOUT'
    | 'MEMBER_KICK'
    | 'MEMBER_BAN'
    | 'MESSAGE_DELETE'
    | 'MESSAGE_EDIT'
    | 'VOICE_JOIN'
    | 'VOICE_LEAVE'
    | 'ROLE_UPDATE'
    | 'MUSIC_PLAY'
    | 'SOCIAL_ALERT';
  executor: {
    name: string;
    avatar?: string;
    isBot: boolean;
  };
  target?: {
    name: string;
    id: string;
  };
  details: string;
  severity: 'info' | 'warning' | 'danger';
  channelName?: string;
}

export interface ServerAnalyticsData {
  memberGrowth: { date: string; total: number; joins: number; leaves: number }[];
  hourlyActivity: { hour: number; messages: number; voiceMinutes: number }[];
  topMembers: { id: string; name: string; avatar: string; messages: number; xp: number }[];
  topChannels: { name: string; messageCount: number; percentage: number }[];
  modSummary: { warns: number; timeouts: number; kicks: number; bans: number };
}
