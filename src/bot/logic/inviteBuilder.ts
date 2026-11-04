export interface InviteOptions {
  clientId: string;
  permissionsBitfield?: string;
}

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  bit: bigint;
  recommended: boolean;
}

export const DISCORD_PERMISSIONS: PermissionItem[] = [
  {
    id: 'ADMINISTRATOR',
    name: 'Administrator (Toàn quyền quản trị)',
    description: 'Cấp mọi quyền hạn và bỏ qua thiết lập giới hạn kênh. Khuyên dùng để đầy đủ tính năng.',
    bit: 1n << 3n, // 8
    recommended: true
  },
  {
    id: 'MANAGE_GUILD',
    name: 'Quản Lý Máy Chủ (Manage Server)',
    description: 'Cho phép đọc thông tin cấu hình server và thống kê chuyên sâu.',
    bit: 1n << 5n,
    recommended: true
  },
  {
    id: 'MANAGE_ROLES',
    name: 'Quản Lý Vai Trò (Manage Roles)',
    description: 'Cần thiết cho Auto-Role khi thành viên vào server và thưởng role theo Level.',
    bit: 1n << 28n,
    recommended: true
  },
  {
    id: 'MANAGE_CHANNELS',
    name: 'Quản Lý Kênh (Manage Channels)',
    description: 'Hỗ trợ đồng bộ kênh thông báo và kênh log tự động.',
    bit: 1n << 4n,
    recommended: false
  },
  {
    id: 'KICK_MEMBERS',
    name: 'Trục Xuất Thành Viên (Kick Members)',
    description: 'Cho phép thực thi lệnh !kick hoặc xử lý vi phạm nặng.',
    bit: 1n << 1n,
    recommended: true
  },
  {
    id: 'BAN_MEMBERS',
    name: 'Cấm Thành Viên (Ban Members)',
    description: 'Cho phép thực thi lệnh !ban hoặc chặn tài khoản spam.',
    bit: 1n << 2n,
    recommended: true
  },
  {
    id: 'MODERATE_MEMBERS',
    name: 'Cách Ly Thành Viên (Timeout / Mute)',
    description: 'Cần thiết cho Auto-Mod tự động khóa mõm khi phát hiện mass mention hoặc spam.',
    bit: 1n << 40n,
    recommended: true
  },
  {
    id: 'MANAGE_MESSAGES',
    name: 'Quản Lý Tin Nhắn (Manage Messages)',
    description: 'Cho phép xóa tin nhắn chứa link mời server khác hoặc từ ngữ cấm.',
    bit: 1n << 13n,
    recommended: true
  },
  {
    id: 'SEND_MESSAGES',
    name: 'Gửi Tin Nhắn & Phản Hồi (Send Messages)',
    description: 'Cho phép bot tự động phản hồi, gửi thông báo YouTube/TikTok và bảng Auto-Role.',
    bit: 1n << 11n,
    recommended: true
  },
  {
    id: 'EMBED_LINKS',
    name: 'Nhúng Liên Kết Phong Phú (Embed Links)',
    description: 'Hiển thị khung Rich Embed đẹp mắt cho thông báo và phản hồi.',
    bit: 1n << 14n,
    recommended: true
  },
  {
    id: 'CONNECT',
    name: 'Kết Nối Kênh Thoại (Connect Voice)',
    description: 'Cho phép bot tham gia phòng Voice để phát nhạc 24/7.',
    bit: 1n << 20n,
    recommended: true
  },
  {
    id: 'SPEAK',
    name: 'Phát Âm Thanh (Speak in Voice)',
    description: 'Truyền tải luồng nhạc chất lượng cao trong kênh Voice.',
    bit: 1n << 21n,
    recommended: true
  }
];

export function calculatePermissionsBitfield(selectedIds: string[]): string {
  if (selectedIds.includes('ADMINISTRATOR')) {
    return '8';
  }
  let total = 0n;
  for (const item of DISCORD_PERMISSIONS) {
    if (selectedIds.includes(item.id)) {
      total |= item.bit;
    }
  }
  return total.toString();
}

export function isValidSnowflake(id: string): boolean {
  const clean = id.trim();
  return /^\d{17,20}$/.test(clean);
}

export function buildDiscordInviteUrl(clientId: string, selectedPermissionIds: string[]): string {
  const cleanId = clientId.trim() || '123456789012345678';
  const permissions = calculatePermissionsBitfield(selectedPermissionIds);
  return `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(cleanId)}&permissions=${permissions}&scope=bot%20applications.commands`;
}

export function isValidDiscordWebhookUrl(url: string): boolean {
  const clean = url.trim();
  return /^https:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(clean);
}
