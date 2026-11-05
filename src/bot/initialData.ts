import { GuildInfo, Member, YouTubeFeed, TikTokFeed, ReactionRoleGroup, AuditLogEntry, ServerAnalyticsData } from './types';
import { AutoResponseRule } from './logic/autoResponder';
import { AutoModConfig } from './logic/moderationRules';
import { Track } from './logic/musicQueue';
import { LevelRoleRule } from './logic/roleEngine';

export const INITIAL_GUILDS: GuildInfo[] = [
  {
    id: '__not_connected__',
    name: 'Chưa kết nối Discord',
    icon: '🔌',
    memberCount: 0,
    onlineCount: 0,
    ownerName: '—',
    region: '—',
    createdDate: '—',
    channels: [],
    roles: []
  }
];

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_AUTO_RESPONSES: AutoResponseRule[] = [
  {
    id: 'ar-1',
    trigger: 'xin chào',
    matchType: 'CONTAINS',
    response: 'Chào {user}! Rất vui được gặp bạn tại máy chủ {server}. Nếu cần trợ giúp, hãy gõ `!help` nhé!',
    replyType: 'REPLY',
    enabled: true,
    cooldownSeconds: 10,
    embed: {
      title: '👋 Lời Chào Từ AegisBot',
      description: 'Chào mừng bạn đến với cộng đồng. Nhớ ghé qua kênh luật và chọn vai trò nhận thông báo nhé!',
      color: '#5865F2',
      footer: 'AegisBot • Trợ lý tự động'
    }
  },
  {
    id: 'ar-2',
    trigger: '!rules',
    matchType: 'EXACT',
    response: 'Dưới đây là tóm tắt quy định chính của máy chủ {server}:',
    replyType: 'REPLY',
    enabled: true,
    cooldownSeconds: 5,
    embed: {
      title: '📜 Nội Quy Máy Chủ',
      description: '1. Tôn trọng mọi thành viên, không quấy rối.\n2. Cấm quảng cáo, share link Discord server khác.\n3. Không spam emoji, ký tự vô nghĩa hoặc mass mention.\n4. Giữ văn hóa lịch sự, không toxic.',
      color: '#F59E0B',
      footer: 'Vi phạm sẽ bị hệ thống AutoMod cảnh cáo hoặc mute tự động.'
    }
  },
  {
    id: 'ar-3',
    trigger: '!social',
    matchType: 'EXACT',
    response: 'Kênh truyền thông chính thức của chúng tôi:',
    replyType: 'REPLY',
    enabled: true,
    cooldownSeconds: 5,
    embed: {
      title: '🌐 Kênh Truyền Thông Chính Thức',
      description: '• YouTube: https://www.youtube.com/@quangiahuongnoi\n• TikTok: https://www.tiktok.com/@quangiahuongnoi',
      color: '#EF4444',
      footer: 'Đừng quên đăng ký để nhận thông báo video và livestream mới nhất!'
    }
  },
  {
    id: 'ar-4',
    trigger: '!music',
    matchType: 'STARTS_WITH',
    response: 'Sử dụng các lệnh nhạc: `!play <tên bài>`, `!skip`, `!pause`, `!queue`, `!volume <0-100>`. Bạn cũng có thể mở bảng điều khiển Web để điều khiển trực tiếp!',
    replyType: 'REPLY',
    enabled: true,
    cooldownSeconds: 3
  }
];

export const INITIAL_TRACKS: Track[] = [];

export const INITIAL_AUTOMOD: AutoModConfig = {
  antiSpamEnabled: true,
  maxDuplicateChars: 5,
  antiInviteEnabled: true,
  antiMassMentionEnabled: true,
  maxMentionsAllowed: 3,
  wordBlacklistEnabled: true,
  blacklistedWords: ['scam', 'hack_token', 'dm_for_nitro', 'chửi_bậy_tục_tĩu', 'mua_ban_acc_lau']
};

export const INITIAL_YOUTUBE_FEEDS: YouTubeFeed[] = [
  {
    id: 'yt-quangiahuongnoi',
    channelName: 'Quản gia hướng nội',
    channelUrl: 'https://www.youtube.com/@quangiahuongnoi',
    channelId: '',
    avatar: '',
    discordChannelId: '',
    pingRoleId: undefined,
    customMessage: '🔴 **{channel_name} đang LIVE!**\n{video_title}\nXem ngay: {url}',
    lastVideoTitle: 'Chưa có dữ liệu mới',
    lastVideoUrl: 'https://www.youtube.com/@quangiahuongnoi',
    lastChecked: 'Chưa kiểm tra',
    notifyOnLive: true,
    notifyOnUpload: false,
    lastLiveStatus: 'offline',
    status: 'active'
  }
];

export const INITIAL_TIKTOK_FEEDS: TikTokFeed[] = [
  {
    id: 'tt-quangiahuongnoi',
    creatorHandle: '@quangiahuongnoi',
    creatorName: 'Quản gia hướng nội',
    avatar: '',
    discordChannelId: '',
    pingRoleId: undefined,
    customMessage: '📱 **{creator_name} đang LIVE / có clip mới!**\n{video_title}\nXem ngay: {url}',
    notifyOnLive: true,
    notifyOnUpload: true,
    lastLiveStatus: 'offline',
    lastVideoTitle: 'Chưa có dữ liệu mới',
    lastVideoUrl: 'https://www.tiktok.com/@quangiahuongnoi',
    lastChecked: 'Chưa kiểm tra',
    status: 'active'
  }
];

export const INITIAL_REACTION_ROLES: ReactionRoleGroup[] = [];

export const INITIAL_LEVEL_ROLES: LevelRoleRule[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export const INITIAL_ANALYTICS: ServerAnalyticsData = {
  memberGrowth: [],
  hourlyActivity: [],
  topMembers: [],
  topChannels: [],
  modSummary: { warns: 0, timeouts: 0, kicks: 0, bans: 0 }
};
