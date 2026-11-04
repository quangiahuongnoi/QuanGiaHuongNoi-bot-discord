import { GuildInfo, Member, YouTubeFeed, TikTokFeed, ReactionRoleGroup, AuditLogEntry, ServerAnalyticsData } from './types';
import { AutoResponseRule } from './logic/autoResponder';
import { AutoModConfig } from './logic/moderationRules';
import { Track } from './logic/musicQueue';
import { LevelRoleRule } from './logic/roleEngine';

export const INITIAL_GUILDS: GuildInfo[] = [
  {
    id: 'guild-1',
    name: 'CyberRealm Gaming #VN',
    icon: '🎮',
    memberCount: 1842,
    onlineCount: 468,
    ownerName: 'Kyomi#0001',
    region: 'Singapore (SEA)',
    createdDate: '15/03/2023',
    channels: [
      { id: 'c-general', name: 'trò-chuyện-chung', type: 'text' },
      { id: 'c-bot-cmds', name: 'lệnh-bot', type: 'text' },
      { id: 'c-music', name: 'phát-nhạc', type: 'text' },
      { id: 'c-social', name: 'thông-báo-live-video', type: 'text' },
      { id: 'c-logs', name: 'audit-logs', type: 'text' },
      { id: 'c-voice-1', name: 'Phòng Voice 01', type: 'voice' },
      { id: 'c-voice-music', name: 'Music 24/7 [Hi-Fi]', type: 'voice' }
    ],
    roles: [
      { id: 'r-admin', name: 'Server Admin', color: '#EF4444', memberCount: 3, hoist: true },
      { id: 'r-mod', name: 'Moderator', color: '#F59E0B', memberCount: 8, hoist: true },
      { id: 'r-vip', name: 'VIP Supporter', color: '#8B5CF6', memberCount: 35, hoist: true },
      { id: 'r-member', name: 'Thành Viên', color: '#3B82F6', memberCount: 1420, hoist: false },
      { id: 'r-bot', name: 'Bot Hệ Thống', color: '#10B981', memberCount: 6, hoist: true },
      { id: 'r-yt-notif', name: '🔔 Nhận Tin YouTube', color: '#EC4899', memberCount: 312, hoist: false },
      { id: 'r-tt-notif', name: '📱 Nhận Tin TikTok', color: '#06B6D4', memberCount: 245, hoist: false }
    ]
  },
  {
    id: 'guild-2',
    name: 'Lofi Lounge & Music',
    icon: '☕',
    memberCount: 890,
    onlineCount: 230,
    ownerName: 'MellowVibes',
    region: 'Singapore (SEA)',
    createdDate: '01/08/2023',
    channels: [
      { id: 'c-lounge', name: 'lounge-chat', type: 'text' },
      { id: 'c-music-queue', name: 'music-station', type: 'text' },
      { id: 'c-voice-relax', name: 'Lofi Room 1', type: 'voice' }
    ],
    roles: [
      { id: 'r-dj', name: 'Resident DJ', color: '#EC4899', memberCount: 5, hoist: true },
      { id: 'r-listener', name: 'Listener', color: '#38BDF8', memberCount: 840, hoist: false }
    ]
  },
  {
    id: 'guild-3',
    name: 'Developer Hub Vietnam',
    icon: '💻',
    memberCount: 3210,
    onlineCount: 812,
    ownerName: 'CodeMaster_VN',
    region: 'Singapore (SEA)',
    createdDate: '10/01/2022',
    channels: [
      { id: 'c-dev-chat', name: 'lap-trinh-chung', type: 'text' },
      { id: 'c-dev-bot', name: 'test-bot', type: 'text' }
    ],
    roles: [
      { id: 'r-lead', name: 'Tech Lead', color: '#6366F1', memberCount: 12, hoist: true },
      { id: 'r-dev', name: 'Developer', color: '#10B981', memberCount: 2900, hoist: false }
    ]
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm-1',
    username: 'kyomi_admin',
    displayName: 'Kyomi (Founder)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    isBot: false,
    status: 'online',
    joinedAt: '15/03/2023',
    roles: ['r-admin'],
    warnings: 0,
    xp: 8450,
    level: 9
  },
  {
    id: 'm-2',
    username: 'aegis_bot',
    displayName: 'AegisBot [Core]',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    isBot: true,
    status: 'online',
    joinedAt: '15/03/2023',
    roles: ['r-bot'],
    warnings: 0,
    xp: 0,
    level: 0
  },
  {
    id: 'm-3',
    username: 'hoang_gamer99',
    displayName: 'Hoàng Long',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    isBot: false,
    status: 'online',
    joinedAt: '10/06/2023',
    roles: ['r-mod', 'r-vip'],
    warnings: 0,
    xp: 5200,
    level: 7
  },
  {
    id: 'm-4',
    username: 'minh_troll',
    displayName: 'Minh T.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    isBot: false,
    status: 'idle',
    joinedAt: '02/11/2023',
    roles: ['r-member'],
    warnings: 2,
    xp: 1200,
    level: 3,
    isTimedOut: false
  },
  {
    id: 'm-5',
    username: 'linh_cute',
    displayName: 'Linh Đan',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    isBot: false,
    status: 'dnd',
    joinedAt: '18/01/2024',
    roles: ['r-vip', 'r-member'],
    warnings: 0,
    xp: 14200,
    level: 11
  },
  {
    id: 'm-6',
    username: 'spammer_bot_sus',
    displayName: 'Discord Nitro Free Gift',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    isBot: false,
    status: 'offline',
    joinedAt: '03/11/2026',
    roles: ['r-member'],
    warnings: 3,
    xp: 50,
    level: 0,
    isTimedOut: true,
    timeoutUntil: '04/11/2026 20:00'
  }
];

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
      description: '• YouTube: https://youtube.com/@CyberRealm\n• TikTok: https://tiktok.com/@cyberrealm.vn\n• Group Facebook: https://fb.com/groups/cyberrealm',
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

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Chìm Sâu (Lo-Fi Chill Hop Remix)',
    artist: 'RPT MCK x Trung Trần',
    durationSeconds: 178,
    url: 'https://youtube.com/watch?v=mck_chim_sau',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    requestedBy: 'Kyomi',
    genre: 'Lo-Fi Hip Hop',
    lyrics: [
      'Tại vì sao lại chìm sâu trong ánh mắt em...',
      'Như là rơi vào khoảng không vô tận màu xanh ngát...',
      'Em có biết anh đã thương em từ lần đầu tiên ta gặp gỡ?',
      'Cứ ngỡ như một giấc mơ không muốn tỉnh dậy...',
      'Giai điệu dịu êm lướt qua màn đêm tĩnh lặng...'
    ]
  },
  {
    id: 'track-2',
    title: 'Waiting For You (Synthwave Night Drive)',
    artist: 'MONO x Onionn',
    durationSeconds: 215,
    url: 'https://youtube.com/watch?v=mono_waiting_for_you',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
    requestedBy: 'Hoàng Long',
    genre: 'Synthwave',
    lyrics: [
      'Từng dòng tin nhắn anh gửi trao em...',
      'Sao em còn chưa trả lời anh đây?',
      'Biết bao đêm dài ngóng chờ bóng hình ai...',
      'Ánh đèn neon chớp nháy khắp phố phường...'
    ]
  },
  {
    id: 'track-3',
    title: 'Bật Tình Yêu Lên (Acoustic Sunset)',
    artist: 'Tăng Duy Tân & Hòa Minzy',
    durationSeconds: 194,
    url: 'https://youtube.com/watch?v=bat_tinh_yeu_len',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
    requestedBy: 'Linh Đan',
    genre: 'Acoustic Pop',
    lyrics: [
      'Rót mật ngọt vào tai làm chi để rồi say...',
      'Bật tình yêu lên cho màn đêm sáng bừng...',
      'Tay nắm chặt bàn tay cùng nhau qua giông bão...'
    ]
  },
  {
    id: 'track-4',
    title: 'Lofi Chill Beats - Midnight Study Session',
    artist: 'ChilledCow / Lofi Girl',
    durationSeconds: 240,
    url: 'https://youtube.com/watch?v=jfKfPfyJRdk',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    requestedBy: 'MellowVibes',
    genre: 'Ambient Beats',
    lyrics: [
      '[Giai điệu piano dịu dàng kết hợp tiếng mưa rơi nhẹ ngoài ô cửa sổ]',
      '[Tiếng đĩa than lách tách cổ điển đưa bạn vào trạng thái thư giãn tuyệt đối]'
    ]
  }
];

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
    id: 'yt-1',
    channelName: 'Độ Mixi',
    channelUrl: 'https://youtube.com/@MixiGamingOfficial',
    channelId: 'UCgBVkp_p_z_YwB_89l2b1qA',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80',
    discordChannelId: 'c-social',
    pingRoleId: 'r-yt-notif',
    customMessage: '🚨 **LIVESTREAM / VIDEO MỚI TỪ TỘC TRƯỞNG!**\n{channel_name} vừa đăng tải: **{video_title}**\nAnh em bấm vào xem ngay nhé: {url}',
    lastVideoTitle: 'MixiGaming - CS2 cùng Refund Gaming và những pha gáy khét lẹt!',
    lastVideoUrl: 'https://youtube.com/watch?v=mixi_cs2_highlight',
    lastChecked: 'Vừa xong',
    notifyOnLive: true,
    notifyOnUpload: true,
    lastLiveStatus: 'offline',
    status: 'active'
  },
  {
    id: 'yt-2',
    channelName: 'F8 Official (Lập Trình Web)',
    channelUrl: 'https://youtube.com/@f8vnofficial',
    channelId: 'UCz2iUx-Imr6HgDC3zAF5dwA',
    avatar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&auto=format&fit=crop&q=80',
    discordChannelId: 'c-social',
    pingRoleId: 'r-yt-notif',
    customMessage: '💻 **VIDEO BÀI GIẢNG LẬP TRÌNH MỚI!**\n{channel_name} vừa chia sẻ: **{video_title}**\nCùng vào học code ngay: {url}',
    lastVideoTitle: 'Xây dựng Fullstack Web App với Next.js & TypeScript từ A - Z',
    lastVideoUrl: 'https://youtube.com/watch?v=f8_nextjs_master',
    lastChecked: '12 phút trước',
    notifyOnLive: false,
    notifyOnUpload: true,
    lastLiveStatus: 'offline',
    status: 'active'
  }
];

export const INITIAL_TIKTOK_FEEDS: TikTokFeed[] = [
  {
    id: 'tt-1',
    creatorHandle: '@schannelvn',
    creatorName: 'Schannel - Kênh Công Nghệ & Giới Trẻ',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    discordChannelId: 'c-social',
    pingRoleId: 'r-tt-notif',
    customMessage: '📱 **VIDEO TIKTOK MỚI TỪ {creator_name}!**\nTiêu đề: **{video_title}**\nXem video và thả tim tại: {url}',
    lastLiveStatus: 'offline',
    lastVideoTitle: 'Review nhanh iPhone thế hệ mới - Có đáng để nâng cấp ngay lúc này?',
    lastVideoUrl: 'https://tiktok.com/@schannelvn/video/7321940192',
    lastChecked: '5 phút trước',
    status: 'active'
  },
  {
    id: 'tt-2',
    creatorHandle: '@vtv24news',
    creatorName: 'Trung Tâm Tin Tức VTV24',
    avatar: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=100&auto=format&fit=crop&q=80',
    discordChannelId: 'c-social',
    pingRoleId: 'r-tt-notif',
    customMessage: '🔴 **TIN TỨC NÓNG HỔI TỪ VTV24!**\n**{video_title}**\nCập nhật tin thời sự tại: {url}',
    lastLiveStatus: 'live',
    lastVideoTitle: 'Bản tin Chuyển Động 24h trưa nay - Những xu hướng công nghệ nổi bật',
    lastVideoUrl: 'https://tiktok.com/@vtv24news/live',
    lastChecked: 'Vừa xong',
    status: 'active'
  }
];

export const INITIAL_REACTION_ROLES: ReactionRoleGroup[] = [
  {
    id: 'rr-notifs',
    title: '🔔 Đăng Ký Nhận Thông Báo Máy Chủ',
    description: 'Bấm vào các nút bên dưới để tự động cấp quyền nhận ping thông báo khi có video hoặc livestream mới:',
    channelId: 'c-general',
    type: 'BUTTON',
    items: [
      {
        emoji: '📺',
        roleId: 'r-yt-notif',
        roleName: '🔔 Nhận Tin YouTube',
        description: 'Nhận ping khi kênh YouTube đăng tải video mới',
        color: '#EC4899'
      },
      {
        emoji: '📱',
        roleId: 'r-tt-notif',
        roleName: '📱 Nhận Tin TikTok',
        description: 'Nhận ping khi kênh TikTok lên sóng Live hoặc ra clip',
        color: '#06B6D4'
      }
    ]
  },
  {
    id: 'rr-games',
    title: '🎮 Chọn Nhóm Game Bạn Chơi',
    description: 'Chọn game bạn thường chơi để tìm đồng đội leo rank trong máy chủ:',
    channelId: 'c-general',
    type: 'SELECT_MENU',
    items: [
      { emoji: '🎯', roleId: 'r-val', roleName: 'Valorant Team', description: 'Tìm party leo rank Immortal', color: '#EF4444' },
      { emoji: '⚔️', roleId: 'r-lol', roleName: 'Liên Minh Huyền Thoại', description: 'Đấu rank Summoner Rift & ARAM', color: '#3B82F6' },
      { emoji: '⛏️', roleId: 'r-mc', roleName: 'Minecraft Builder', description: 'Server SMP sinh tồn cộng đồng', color: '#10B981' }
    ]
  }
];

export const INITIAL_LEVEL_ROLES: LevelRoleRule[] = [
  { levelRequired: 5, roleId: 'r-lvl5', roleName: '🌱 Tập Sự Máy Chủ' },
  { levelRequired: 15, roleId: 'r-lvl15', roleName: '⚔️ Chiến Binh Năng Nổ' },
  { levelRequired: 30, roleId: 'r-lvl30', roleName: '⭐ Huyền Thoại Trò Chuyện' },
  { levelRequired: 50, roleId: 'r-lvl50', roleName: '👑 Vương Giả Tối Cao' }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '20:04:12',
    actionType: 'MEMBER_TIMEOUT',
    executor: { name: 'AegisBot [Core]', isBot: true },
    target: { name: 'spammer_bot_sus', id: 'm-6' },
    details: 'Tự động cách ly 24h: Phát hiện spam liên kết scam và mention hàng loạt.',
    severity: 'danger',
    channelName: '#trò-chuyện-chung'
  },
  {
    id: 'log-2',
    timestamp: '19:58:30',
    actionType: 'MUSIC_PLAY',
    executor: { name: 'Kyomi (Founder)', isBot: false },
    details: 'Bắt đầu phát track: "Chìm Sâu (Lo-Fi Chill Hop Remix)" tại phòng Voice 01.',
    severity: 'info',
    channelName: '#phát-nhạc'
  },
  {
    id: 'log-3',
    timestamp: '19:42:15',
    actionType: 'SOCIAL_ALERT',
    executor: { name: 'AegisBot [Core]', isBot: true },
    details: 'Đã gửi thông báo video YouTube mới từ kênh: "F8 Official".',
    severity: 'info',
    channelName: '#thông-báo-live-video'
  },
  {
    id: 'log-4',
    timestamp: '19:30:00',
    actionType: 'MEMBER_WARN',
    executor: { name: 'Hoàng Long', isBot: false },
    target: { name: 'minh_troll', id: 'm-4' },
    details: 'Cảnh cáo lần 2: Đăng ngôn từ khiêu khích trong kênh chat.',
    severity: 'warning',
    channelName: '#trò-chuyện-chung'
  },
  {
    id: 'log-5',
    timestamp: '19:15:22',
    actionType: 'ROLE_UPDATE',
    executor: { name: 'AegisBot [Core]', isBot: true },
    target: { name: 'Linh Đan', id: 'm-5' },
    details: 'Cấp quyền tự động vai trò "⭐ Huyền Thoại Trò Chuyện" khi đạt Level 11.',
    severity: 'info'
  },
  {
    id: 'log-6',
    timestamp: '18:50:11',
    actionType: 'MEMBER_JOIN',
    executor: { name: 'Hệ Thống', isBot: true },
    target: { name: 'viet_anh_dev', id: 'm-7' },
    details: 'Thành viên mới tham gia máy chủ. Đã tự động gán vai trò: "Thành Viên".',
    severity: 'info'
  }
];

export const INITIAL_ANALYTICS: ServerAnalyticsData = {
  memberGrowth: [
    { date: '28/10', total: 1780, joins: 24, leaves: 3 },
    { date: '29/10', total: 1795, joins: 19, leaves: 4 },
    { date: '30/10', total: 1812, joins: 22, leaves: 5 },
    { date: '31/10', total: 1820, joins: 15, leaves: 7 },
    { date: '01/11', total: 1831, joins: 18, leaves: 7 },
    { date: '02/11', total: 1838, joins: 14, leaves: 7 },
    { date: '03/11', total: 1842, joins: 12, leaves: 8 }
  ],
  hourlyActivity: [
    { hour: 0, messages: 120, voiceMinutes: 450 },
    { hour: 2, messages: 45, voiceMinutes: 180 },
    { hour: 4, messages: 12, voiceMinutes: 60 },
    { hour: 6, messages: 35, voiceMinutes: 90 },
    { hour: 8, messages: 210, voiceMinutes: 380 },
    { hour: 10, messages: 480, voiceMinutes: 720 },
    { hour: 12, messages: 620, voiceMinutes: 980 },
    { hour: 14, messages: 540, voiceMinutes: 890 },
    { hour: 16, messages: 690, voiceMinutes: 1100 },
    { hour: 18, messages: 840, voiceMinutes: 1450 },
    { hour: 20, messages: 1320, voiceMinutes: 2400 },
    { hour: 22, messages: 1150, voiceMinutes: 2100 }
  ],
  topMembers: [
    { id: 'm-5', name: 'Linh Đan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', messages: 1840, xp: 14200 },
    { id: 'm-1', name: 'Kyomi (Founder)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', messages: 1420, xp: 8450 },
    { id: 'm-3', name: 'Hoàng Long', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', messages: 980, xp: 5200 },
    { id: 'm-4', name: 'Minh T.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', messages: 320, xp: 1200 }
  ],
  topChannels: [
    { name: '#trò-chuyện-chung', messageCount: 4210, percentage: 52 },
    { name: '#phát-nhạc', messageCount: 1680, percentage: 21 },
    { name: '#lệnh-bot', messageCount: 1240, percentage: 15 },
    { name: '#thông-báo-live-video', messageCount: 960, percentage: 12 }
  ],
  modSummary: {
    warns: 18,
    timeouts: 6,
    kicks: 3,
    bans: 2
  }
};
