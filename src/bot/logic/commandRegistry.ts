export type CommandCategory = 'MUSIC' | 'MODERATION' | 'UTILITY' | 'ROLE_LEVEL' | 'SOCIAL' | 'CUSTOM';

export interface DiscordCommandDef {
  id: string;
  name: string;
  prefixUsage: string;
  slashUsage: string;
  category: CommandCategory;
  description: string;
  permissions: string;
  enabled: boolean;
  isCustom?: boolean;
  customResponse?: string;
}

export const INITIAL_DISCORD_COMMANDS: DiscordCommandDef[] = [
  // MUSIC COMMANDS
  {
    id: 'cmd-play',
    name: 'play',
    prefixUsage: '!play <tên bài hát / URL>',
    slashUsage: '/play query:<bài hát>',
    category: 'MUSIC',
    description: 'Phát nhạc chất lượng cao Hi-Fi 384kbps trong kênh Voice từ YouTube, Spotify hoặc SoundCloud.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-pause',
    name: 'pause',
    prefixUsage: '!pause',
    slashUsage: '/pause',
    category: 'MUSIC',
    description: 'Tạm dừng hoặc tiếp tục phát bài hát hiện tại trong phòng Voice.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-skip',
    name: 'skip',
    prefixUsage: '!skip',
    slashUsage: '/skip',
    category: 'MUSIC',
    description: 'Bỏ qua bài hát hiện tại để chuyển sang bài tiếp theo trong hàng đợi.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-stop',
    name: 'stop',
    prefixUsage: '!stop',
    slashUsage: '/stop',
    category: 'MUSIC',
    description: 'Dừng phát nhạc, xóa hàng đợi và giữ bot ở trạng thái chờ 24/7.',
    permissions: 'DJ / Moderator',
    enabled: true
  },
  {
    id: 'cmd-queue',
    name: 'queue',
    prefixUsage: '!queue',
    slashUsage: '/queue',
    category: 'MUSIC',
    description: 'Hiển thị danh sách các bài hát đang chờ phát cùng tổng thời lượng.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-volume',
    name: 'volume',
    prefixUsage: '!volume <0-100>',
    slashUsage: '/volume level:<0-100>',
    category: 'MUSIC',
    description: 'Điều chỉnh âm lượng phát nhạc trực tiếp của bot trong kênh thoại.',
    permissions: 'DJ / Moderator',
    enabled: true
  },
  {
    id: 'cmd-loop',
    name: 'loop',
    prefixUsage: '!loop <off|track|queue>',
    slashUsage: '/loop mode:<off|track|queue>',
    category: 'MUSIC',
    description: 'Chuyển chế độ lặp lại bài hát hiện tại hoặc toàn bộ danh sách phát.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-filter',
    name: 'filter',
    prefixUsage: '!filter <lofi|bassboost|nightcore|vocal>',
    slashUsage: '/filter preset:<tên bộ lọc>',
    category: 'MUSIC',
    description: 'Áp dụng bộ lọc âm thanh Equalizer DSP thời gian thực.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-join',
    name: 'join',
    prefixUsage: '!join',
    slashUsage: '/join',
    category: 'MUSIC',
    description: 'Gọi bot tự động nhảy vào đúng kênh Voice mà bạn đang ngồi.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-leave',
    name: 'leave',
    prefixUsage: '!leave',
    slashUsage: '/leave',
    category: 'MUSIC',
    description: 'Cho bot ngừng phát nhạc và rời khỏi kênh Voice hiện tại.',
    permissions: 'DJ / Moderator',
    enabled: true
  },
  {
    id: 'cmd-247',
    name: '247',
    prefixUsage: '!247 <on|off>',
    slashUsage: '/247',
    category: 'MUSIC',
    description: 'Ghim bot treo trong phòng Voice 24/24 không tự thoát khi hết nhạc.',
    permissions: 'Manage Server',
    enabled: true
  },

  // MODERATION COMMANDS
  {
    id: 'cmd-warn',
    name: 'warn',
    prefixUsage: '!warn @user <lý do>',
    slashUsage: '/warn user:@user reason:<lý do>',
    category: 'MODERATION',
    description: 'Gửi cảnh cáo chính thức tới thành viên vi phạm và lưu vào Audit Logs.',
    permissions: 'Moderate Members',
    enabled: true
  },
  {
    id: 'cmd-mute',
    name: 'mute',
    prefixUsage: '!mute @user <số phút> <lý do>',
    slashUsage: '/timeout user:@user duration:<phút> reason:<lý do>',
    category: 'MODERATION',
    description: 'Cách ly (Timeout) tạm thời không cho phép thành viên nhắn tin hoặc vào Voice.',
    permissions: 'Moderate Members',
    enabled: true
  },
  {
    id: 'cmd-unmute',
    name: 'unmute',
    prefixUsage: '!unmute @user',
    slashUsage: '/unmute user:@user',
    category: 'MODERATION',
    description: 'Gỡ bỏ trạng thái cách ly (Timeout) cho thành viên ngay lập tức.',
    permissions: 'Moderate Members',
    enabled: true
  },
  {
    id: 'cmd-kick',
    name: 'kick',
    prefixUsage: '!kick @user <lý do>',
    slashUsage: '/kick user:@user reason:<lý do>',
    category: 'MODERATION',
    description: 'Trục xuất thành viên vi phạm ra khỏi máy chủ Discord.',
    permissions: 'Kick Members',
    enabled: true
  },
  {
    id: 'cmd-ban',
    name: 'ban',
    prefixUsage: '!ban @user <lý do>',
    slashUsage: '/ban user:@user reason:<lý do>',
    category: 'MODERATION',
    description: 'Cấm vĩnh viễn tài khoản vi phạm khỏi máy chủ và xóa lịch sử spam.',
    permissions: 'Ban Members',
    enabled: true
  },
  {
    id: 'cmd-clear',
    name: 'clear',
    prefixUsage: '!clear <số lượng 1-100>',
    slashUsage: '/clear amount:<1-100>',
    category: 'MODERATION',
    description: 'Dọn dẹp nhanh hàng loạt tin nhắn rác trong kênh văn bản hiện tại.',
    permissions: 'Manage Messages',
    enabled: true
  },
  {
    id: 'cmd-slowmode',
    name: 'slowmode',
    prefixUsage: '!slowmode <số giây>',
    slashUsage: '/slowmode seconds:<giây>',
    category: 'MODERATION',
    description: 'Đặt thời gian chờ giữa mỗi lần gửi tin nhắn để chống spam kênh chat.',
    permissions: 'Manage Channels',
    enabled: true
  },
  {
    id: 'cmd-lock',
    name: 'lock',
    prefixUsage: '!lock / !unlock',
    slashUsage: '/lock',
    category: 'MODERATION',
    description: 'Khóa khẩn cấp kênh chat khi có raid hoặc mở khóa trở lại.',
    permissions: 'Manage Channels',
    enabled: true
  },

  // ROLE & LEVELING COMMANDS
  {
    id: 'cmd-rank',
    name: 'rank',
    prefixUsage: '!rank [@user]',
    slashUsage: '/rank [user:@user]',
    category: 'ROLE_LEVEL',
    description: 'Xem thẻ cấp độ (Level), tổng điểm kinh nghiệm XP và tiến trình thăng hạng.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-leaderboard',
    name: 'leaderboard',
    prefixUsage: '!leaderboard (hoặc !top)',
    slashUsage: '/leaderboard',
    category: 'ROLE_LEVEL',
    description: 'Hiển thị bảng xếp hạng Top 10 thành viên tương tác sôi nổi nhất máy chủ.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-autorole',
    name: 'autorole',
    prefixUsage: '!autorole',
    slashUsage: '/autorole',
    category: 'ROLE_LEVEL',
    description: 'Gửi bảng nút bấm tương tác để thành viên tự nhận role thông báo hoặc role game.',
    permissions: 'Manage Roles',
    enabled: true
  },
  {
    id: 'cmd-role',
    name: 'role',
    prefixUsage: '!role @user <@role>',
    slashUsage: '/role user:@user role:@role',
    category: 'ROLE_LEVEL',
    description: 'Cấp hoặc thu hồi nhanh một vai trò cho thành viên được chỉ định.',
    permissions: 'Manage Roles',
    enabled: true
  },

  // SOCIAL & ALERTS COMMANDS
  {
    id: 'cmd-social',
    name: 'social',
    prefixUsage: '!social',
    slashUsage: '/social',
    category: 'SOCIAL',
    description: 'Xem danh sách các kênh YouTube và TikTok đang được bot theo dõi tự động.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-tiktok',
    name: 'tiktok',
    prefixUsage: '!tiktok <@handle>',
    slashUsage: '/tiktok handle:<@handle>',
    category: 'SOCIAL',
    description: 'Kiểm tra trạng thái Livestream và video mới nhất của kênh TikTok đã đăng ký.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-youtube',
    name: 'youtube',
    prefixUsage: '!youtube <tên kênh>',
    slashUsage: '/youtube channel:<tên kênh>',
    category: 'SOCIAL',
    description: 'Kiểm tra video hoặc buổi phát trực tiếp mới nhất từ kênh YouTube.',
    permissions: 'Mọi thành viên',
    enabled: true
  },

  // UTILITY & SERVER INFO COMMANDS
  {
    id: 'cmd-help',
    name: 'help',
    prefixUsage: '!help [tên lệnh]',
    slashUsage: '/help [command]',
    category: 'UTILITY',
    description: 'Hiển thị cẩm nang toàn bộ lệnh Prefix (!) và Slash Command (/) của AegisBot.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-ping',
    name: 'ping',
    prefixUsage: '!ping',
    slashUsage: '/ping',
    category: 'UTILITY',
    description: 'Kiểm tra độ trễ kết nối Discord WebSocket Gateway và thời gian hoạt động (Uptime) 24/7.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-serverinfo',
    name: 'serverinfo',
    prefixUsage: '!serverinfo',
    slashUsage: '/serverinfo',
    category: 'UTILITY',
    description: 'Hiển thị thống kê chi tiết về máy chủ: số thành viên, kênh, vai trò, ngày tạo.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-userinfo',
    name: 'userinfo',
    prefixUsage: '!userinfo [@user]',
    slashUsage: '/userinfo [user:@user]',
    category: 'UTILITY',
    description: 'Xem hồ sơ tài khoản, ngày tham gia máy chủ và danh sách vai trò của thành viên.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-avatar',
    name: 'avatar',
    prefixUsage: '!avatar [@user]',
    slashUsage: '/avatar [user:@user]',
    category: 'UTILITY',
    description: 'Lấy ảnh đại diện độ phân giải gốc (HD) của bạn hoặc thành viên bất kỳ.',
    permissions: 'Mọi thành viên',
    enabled: true
  },
  {
    id: 'cmd-poll',
    name: 'poll',
    prefixUsage: '!poll <câu hỏi bình chọn>',
    slashUsage: '/poll question:<câu hỏi>',
    category: 'UTILITY',
    description: 'Tạo bảng khảo sát ý kiến nhanh kèm biểu tượng cảm xúc 👍 / 👎 tự động.',
    permissions: 'Mọi thành viên',
    enabled: true
  }
];

export interface ParsedCommandInput {
  isCommand: boolean;
  prefix: '!' | '/' | null;
  commandName: string;
  args: string[];
  rawArgs: string;
}

export function parseCommandInput(input: string): ParsedCommandInput {
  const trimmed = input.trim();
  if (!trimmed.startsWith('!') && !trimmed.startsWith('/')) {
    return {
      isCommand: false,
      prefix: null,
      commandName: '',
      args: [],
      rawArgs: ''
    };
  }

  const prefix = trimmed[0] as '!' | '/';
  const withoutPrefix = trimmed.slice(1).trim();
  if (!withoutPrefix) {
    return {
      isCommand: false,
      prefix: null,
      commandName: '',
      args: [],
      rawArgs: ''
    };
  }

  const parts = withoutPrefix.split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);
  const rawArgs = withoutPrefix.slice(parts[0].length).trim();

  return {
    isCommand: true,
    prefix,
    commandName,
    args,
    rawArgs
  };
}

export interface CommandExecutionContext {
  authorName: string;
  serverName: string;
  memberCount: number;
  onlineCount: number;
  uptimeSeconds: number;
  voiceChannelName?: string;
  currentTrackTitle?: string;
  queueCount: number;
  youtubeCount: number;
  tiktokCount: number;
}

export interface CommandExecutionOutput {
  handled: boolean;
  replyContent: string;
  embed?: {
    title: string;
    description: string;
    color: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: string;
  };
  sideEffect?: {
    type:
      | 'PLAY_MUSIC'
      | 'JOIN_VOICE'
      | 'LEAVE_VOICE'
      | 'PAUSE_MUSIC'
      | 'SKIP_MUSIC'
      | 'STOP_MUSIC'
      | 'MOD_ACTION';
    payload?: string;
  };
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (mins > 0) parts.push(`${mins} phút`);
  parts.push(`${secs} giây`);
  return parts.join(' ');
}

export function executeBotCommand(
  input: string,
  commands: DiscordCommandDef[],
  ctx: CommandExecutionContext
): CommandExecutionOutput {
  const parsed = parseCommandInput(input);
  if (!parsed.isCommand) {
    return { handled: false, replyContent: '' };
  }

  // Handle alias !top -> leaderboard, !timeout -> mute, !disconnect -> leave
  const normalizedName =
    parsed.commandName === 'top'
      ? 'leaderboard'
      : parsed.commandName === 'timeout'
      ? 'mute'
      : parsed.commandName === 'disconnect' || parsed.commandName === 'dc'
      ? 'leave'
      : parsed.commandName;

  const cmdDef = commands.find((c) => c.name.toLowerCase() === normalizedName);
  if (cmdDef && !cmdDef.enabled) {
    return {
      handled: true,
      replyContent: `⚠️ Lệnh \`${parsed.prefix}${normalizedName}\` hiện đang được Quản trị viên tạm tắt trên Bảng Điều Khiển Web.`
    };
  }

  // Custom user-defined command
  if (cmdDef && cmdDef.isCustom && cmdDef.customResponse) {
    const processed = cmdDef.customResponse
      .replace(/{user}/g, ctx.authorName)
      .replace(/{server}/g, ctx.serverName)
      .replace(/{args}/g, parsed.rawArgs || 'không có tham số');
    return {
      handled: true,
      replyContent: processed,
      embed: {
        title: `⚡ Lệnh Tùy Chỉnh: ${parsed.prefix}${cmdDef.name}`,
        description: processed,
        color: '#6366F1',
        footer: 'AegisBot Custom Command Engine'
      }
    };
  }

  const targetRoom = ctx.voiceChannelName || 'Phòng Voice 01';

  switch (normalizedName) {
    case 'help':
      return {
        handled: true,
        replyContent: `Xin chào **${ctx.authorName}**! Dưới đây là danh sách các lệnh điều khiển AegisBot (hỗ trợ cả \`!\` và \`/\`):`,
        embed: {
          title: '📖 Trung Tâm Lệnh AegisBot (Prefix ! & Slash /)',
          description: 'Bạn có thể gõ trực tiếp trong kênh chat hoặc điều khiển từ xa trên ứng dụng Web/PWA.',
          color: '#5865F2',
          fields: [
            {
              name: '🎵 Phát Nhạc & Voice 24/7',
              value: '`!play`, `!join`, `!leave`, `!pause`, `!skip`, `!stop`, `!queue`, `!volume`, `!loop`, `!filter`, `!247`',
              inline: false
            },
            {
              name: '🛡️ Quản Trị & Kiểm Duyệt',
              value: '`!warn`, `!mute`, `!unmute`, `!kick`, `!ban`, `!clear`, `!slowmode`, `!lock`',
              inline: false
            },
            {
              name: '🏆 Cấp Độ & Vai Trò',
              value: '`!rank`, `!leaderboard` (`!top`), `!autorole`, `!role`',
              inline: true
            },
            {
              name: '🔔 Mạng Xã Hội & Tiện Ích',
              value: '`!social`, `!youtube`, `!tiktok`, `!ping`, `!serverinfo`, `!userinfo`, `!poll`',
              inline: true
            }
          ],
          footer: `Đang kích hoạt ${commands.filter((c) => c.enabled).length}/${commands.length} lệnh • Uptime: ${formatUptime(ctx.uptimeSeconds)}`
        }
      };

    case 'ping':
      return {
        handled: true,
        replyContent: '🏓 **Pong!** Kết nối máy chủ hoạt động ổn định 24/24.',
        embed: {
          title: '⚡ Trạng Thái Kết Nối & Uptime 24/7',
          description: `• Độ trễ Gateway: **18ms**\n• Thời gian hoạt động liên tục: **${formatUptime(ctx.uptimeSeconds)}**\n• Trạng thái Keep-Alive: **Đang bảo vệ 24/24**`,
          color: '#10B981',
          footer: 'AegisBot Heartbeat Monitor'
        }
      };

    case 'serverinfo':
      return {
        handled: true,
        replyContent: `Thông tin thống kê máy chủ **${ctx.serverName}**:`,
        embed: {
          title: `🏰 Thông Tin Máy Chủ: ${ctx.serverName}`,
          description: 'Dữ liệu thời gian thực từ hệ thống phân tích AegisBot.',
          color: '#5865F2',
          fields: [
            { name: '👥 Tổng Thành Viên', value: `${ctx.memberCount.toLocaleString()} người`, inline: true },
            { name: '🟢 Đang Trực Tuyến', value: `${ctx.onlineCount.toLocaleString()} người`, inline: true },
            { name: '🛡️ Chế Độ Bảo Vệ', value: 'Auto-Mod Shield Cấp 2', inline: true },
            { name: '📡 Kênh Đã Liên Kết', value: `${ctx.youtubeCount} YouTube · ${ctx.tiktokCount} TikTok`, inline: true }
          ],
          footer: 'AegisBot Server Telemetry'
        }
      };

    case 'userinfo': {
      const targetUser = parsed.rawArgs || ctx.authorName;
      return {
        handled: true,
        replyContent: `Hồ sơ thành viên **${targetUser}**:`,
        embed: {
          title: `👤 Hồ Sơ Thành Viên: ${targetUser}`,
          description: 'Trạng thái: **Đang hoạt động tích cực**\nVai trò: `@Thành Viên`, `@VIP Supporter`',
          color: '#8B5CF6',
          fields: [
            { name: '⭐ Cấp Độ Hiện Tại', value: 'Level 11 (14,200 XP)', inline: true },
            { name: '🛡️ Cảnh Cáo Vi Phạm', value: '0 lần (Tài khoản sạch)', inline: true }
          ],
          footer: 'AegisBot Member Registry'
        }
      };
    }

    case 'rank': {
      const target = parsed.rawArgs || ctx.authorName;
      return {
        handled: true,
        replyContent: `Thẻ cấp độ hoạt động của **${target}**:`,
        embed: {
          title: `🏆 Thẻ Cấp Độ & Kinh Nghiệm — ${target}`,
          description: 'Tích cực trò chuyện và tham gia Voice để mở khóa các vai trò đặc quyền!',
          color: '#F59E0B',
          fields: [
            { name: 'Cấp Bậc', value: 'Level 11', inline: true },
            { name: 'Điểm XP', value: '14,200 / 16,900 XP (84%)', inline: true },
            { name: 'Danh Hiệu Đạt Được', value: '⚔️ Chiến Binh Năng Nổ', inline: false }
          ],
          footer: 'AegisBot Leveling Engine'
        }
      };
    }

    case 'leaderboard':
      return {
        handled: true,
        replyContent: `Bảng xếp hạng thành viên hoạt động sôi nổi nhất tại **${ctx.serverName}**:`,
        embed: {
          title: `👑 Bảng Xếp Hạng Top Tương Tác (${ctx.serverName})`,
          description:
            '🥇 **#1. Linh Đan** — Level 11 · `14,200 XP` (1,840 tin nhắn)\n' +
            '🥈 **#2. Kyomi (Founder)** — Level 9 · `8,450 XP` (1,420 tin nhắn)\n' +
            '🥉 **#3. Hoàng Long** — Level 7 · `5,200 XP` (980 tin nhắn)\n' +
            '🏅 **#4. Minh T.** — Level 3 · `1,200 XP` (320 tin nhắn)',
          color: '#F59E0B',
          footer: 'Cập nhật tự động theo thời gian thực'
        }
      };

    case 'join':
      return {
        handled: true,
        replyContent: `🔊 Đã kết nối trực tiếp vào phòng thoại **${targetRoom}** cùng **${ctx.authorName}**!`,
        sideEffect: {
          type: 'JOIN_VOICE',
          payload: targetRoom
        }
      };

    case 'leave':
      return {
        handled: true,
        replyContent: `👋 Đã ngắt kết nối và rời khỏi kênh thoại **${targetRoom}**.`,
        sideEffect: {
          type: 'LEAVE_VOICE'
        }
      };

    case 'play': {
      const query = parsed.rawArgs || 'Chìm Sâu (Lo-Fi Chill Hop Remix)';
      return {
        handled: true,
        replyContent: `🎶 Đã vào phòng **${targetRoom}**, thêm **${query}** vào hàng đợi và bắt đầu phát trực tiếp!`,
        embed: {
          title: `🎵 Đang Phát Nhạc Tại #${targetRoom}: ${query}`,
          description: `Yêu cầu bởi: **${ctx.authorName}**\nKênh thoại: **🔊 ${targetRoom}**\nChất lượng: **Hi-Fi 384kbps** · Chế độ 24/7: **Đang bật**`,
          color: '#10B981',
          footer: 'Sử dụng !pause, !skip, !leave, !queue hoặc điều khiển trên Web App'
        },
        sideEffect: {
          type: 'PLAY_MUSIC',
          payload: query
        }
      };
    }

    case 'pause':
      return {
        handled: true,
        replyContent: `⏸️ Đã chuyển trạng thái phát/tạm dừng nhạc trong kênh **${targetRoom}**.`,
        sideEffect: { type: 'PAUSE_MUSIC' }
      };

    case 'skip':
      return {
        handled: true,
        replyContent: `⏭️ Đã bỏ qua bài hiện tại và chuyển sang bài hát kế tiếp tại **${targetRoom}**!`,
        sideEffect: { type: 'SKIP_MUSIC' }
      };

    case 'stop':
      return {
        handled: true,
        replyContent: `⏹️ Đã dừng phát nhạc. Bot vẫn giữ kết nối 24/7 trong phòng **${targetRoom}**.`,
        sideEffect: { type: 'STOP_MUSIC' }
      };

    case 'queue':
      return {
        handled: true,
        replyContent: `Danh sách bài hát đang phát tại **${targetRoom}** (${ctx.serverName}):`,
        embed: {
          title: `🎼 Hàng Đợi Phát Nhạc (${ctx.queueCount} bài hát)`,
          description: `▶ **Đang phát tại 🔊 ${targetRoom}:** ${ctx.currentTrackTitle || 'Chìm Sâu (Lo-Fi Chill Hop Remix)'}\nSử dụng \`!play <tên bài>\` để thêm bài mới hoặc mở tab **Phát Nhạc** trên Web App.`,
          color: '#10B981',
          footer: 'AegisBot 24/7 Audio Stream'
        }
      };

    case '247':
      return {
        handled: true,
        replyContent: `🟢 Đã kích hoạt chế độ **Treo Phòng Voice (${targetRoom}) & Hoạt Động 24/7**. Bot sẽ luôn giữ kết nối ổn định không bị ngắt quãng!`,
        sideEffect: {
          type: 'JOIN_VOICE',
          payload: targetRoom
        }
      };

    case 'clear': {
      const count = parseInt(parsed.args[0] || '10', 10) || 10;
      return {
        handled: true,
        replyContent: `🧹 Đã dọn dẹp **${Math.min(100, Math.max(1, count))} tin nhắn** trong kênh hiện tại theo yêu cầu của **${ctx.authorName}**.`,
        sideEffect: { type: 'MOD_ACTION', payload: `Dọn dẹp ${count} tin nhắn bằng lệnh !clear` }
      };
    }

    case 'warn':
    case 'mute':
    case 'kick':
    case 'ban': {
      const target = parsed.args[0] || '@user';
      const reason = parsed.args.slice(1).join(' ') || 'Vi phạm quy định máy chủ';
      return {
        handled: true,
        replyContent: `🛡️ Đã thực thi lệnh **${normalizedName.toUpperCase()}** đối với **${target}**.`,
        embed: {
          title: `🔨 Thực Thi Lệnh Quản Trị: ${normalizedName.toUpperCase()}`,
          description: `• **Đối tượng:** ${target}\n• **Người thực hiện:** ${ctx.authorName}\n• **Lý do:** ${reason}`,
          color: '#EF4444',
          footer: 'Đã lưu vào Nhật Ký Chi Tiết (Audit Logs)'
        },
        sideEffect: {
          type: 'MOD_ACTION',
          payload: `Thực thi !${normalizedName} đối với ${target}: ${reason}`
        }
      };
    }

    case 'poll': {
      const question = parsed.rawArgs || 'Tối nay anh em muốn tổ chức giải đấu Custom Game gì?';
      return {
        handled: true,
        replyContent: `📊 Khảo sát mới được tạo bởi **${ctx.authorName}**:`,
        embed: {
          title: '📊 Bình Chọn Cộng Đồng Máy Chủ',
          description: `**${question}**\n\n👍 — Đồng ý / Tham gia ngay\n👎 — Ý kiến khác`,
          color: '#3B82F6',
          footer: 'Thả biểu tượng cảm xúc bên dưới để bình chọn'
        }
      };
    }

    case 'social':
    case 'youtube':
    case 'tiktok':
      return {
        handled: true,
        replyContent: '📡 Danh sách kênh YouTube & TikTok đang được theo dõi tự động 24/7:',
        embed: {
          title: '🔔 Hệ Thống Thông Báo Live & Video Mới',
          description:
            '• **YouTube:** Độ Mixi, F8 Official (Tự động báo khi có Video/Live)\n' +
            '• **TikTok:** @schannelvn, @vtv24news (Đang theo dõi trạng thái Live 24/7)',
          color: '#EC4899',
          footer: 'Quản lý danh sách kênh tại tab Thông Báo TikTok/YT trên Web App'
        }
      };

    case 'autorole':
      return {
        handled: true,
        replyContent: '🎭 Bảng chọn vai trò tự động (Auto-Role):',
        embed: {
          title: '🔔 Đăng Ký Nhận Thông Báo & Vai Trò Máy Chủ',
          description:
            '• 📺 **Nhận Tin YouTube** — Ping khi có video mới\n' +
            '• 📱 **Nhận Tin TikTok** — Ping khi kênh lên sóng Live\n' +
            '• 🎮 **Valorant / Liên Minh / Minecraft** — Tìm đồng đội leo rank',
          color: '#8B5CF6',
          footer: 'Hệ thống Auto-Role cấp quyền tức thì'
        }
      };

    default:
      return { handled: false, replyContent: '' };
  }
}
