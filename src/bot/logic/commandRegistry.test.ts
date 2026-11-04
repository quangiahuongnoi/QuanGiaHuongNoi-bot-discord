import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_DISCORD_COMMANDS,
  parseCommandInput,
  formatUptime,
  executeBotCommand,
  DiscordCommandDef,
  CommandExecutionContext
} from './commandRegistry';

const mockCtx: CommandExecutionContext = {
  authorName: 'Kyomi',
  serverName: 'Cộng Đồng Valorant Việt Nam',
  memberCount: 15420,
  onlineCount: 3890,
  uptimeSeconds: 90061,
  currentTrackTitle: 'Chìm Sâu - RPT MCK',
  queueCount: 4,
  youtubeCount: 2,
  tiktokCount: 2
};

describe('commandRegistry logic', () => {
  it('parses prefix (!) and slash (/) commands accurately', () => {
    const p1 = parseCommandInput('!play Chìm Sâu MCK');
    assert.equal(p1.isCommand, true);
    assert.equal(p1.prefix, '!');
    assert.equal(p1.commandName, 'play');
    assert.deepEqual(p1.args, ['Chìm', 'Sâu', 'MCK']);
    assert.equal(p1.rawArgs, 'Chìm Sâu MCK');

    const p2 = parseCommandInput('/warn @Member Spam link');
    assert.equal(p2.isCommand, true);
    assert.equal(p2.prefix, '/');
    assert.equal(p2.commandName, 'warn');
    assert.equal(p2.args[0], '@Member');

    const nonCmd = parseCommandInput('xin chào mọi người');
    assert.equal(nonCmd.isCommand, false);
    assert.equal(nonCmd.prefix, null);
  });

  it('formats 24/7 uptime strings properly', () => {
    assert.equal(formatUptime(45), '45 giây');
    assert.equal(formatUptime(3665), '1 giờ 1 phút 5 giây');
    assert.equal(formatUptime(90061), '1 ngày 1 giờ 1 phút 1 giây');
  });

  it('executes built-in commands (!help, /ping, !play, !top alias, !warn)', () => {
    const helpRes = executeBotCommand('!help', INITIAL_DISCORD_COMMANDS, mockCtx);
    assert.equal(helpRes.handled, true);
    assert.ok(helpRes.embed?.title.includes('Trung Tâm Lệnh AegisBot'));

    const pingRes = executeBotCommand('/ping', INITIAL_DISCORD_COMMANDS, mockCtx);
    assert.equal(pingRes.handled, true);
    assert.ok(pingRes.embed?.description.includes('1 ngày 1 giờ 1 phút 1 giây'));

    const playRes = executeBotCommand('!play Nơi Này Có Anh', INITIAL_DISCORD_COMMANDS, mockCtx);
    assert.equal(playRes.handled, true);
    assert.equal(playRes.sideEffect?.type, 'PLAY_MUSIC');
    assert.equal(playRes.sideEffect?.payload, 'Nơi Này Có Anh');

    const topRes = executeBotCommand('!top', INITIAL_DISCORD_COMMANDS, mockCtx);
    assert.equal(topRes.handled, true);
    assert.ok(topRes.embed?.title.includes('Bảng Xếp Hạng'));
  });

  it('blocks execution when a command is disabled on the dashboard', () => {
    const disabledList: DiscordCommandDef[] = INITIAL_DISCORD_COMMANDS.map((c) =>
      c.name === 'play' ? { ...c, enabled: false } : c
    );
    const res = executeBotCommand('!play Test Song', disabledList, mockCtx);
    assert.equal(res.handled, true);
    assert.ok(res.replyContent.includes('tạm tắt'));
    assert.equal(res.sideEffect, undefined);
  });

  it('executes custom user-defined commands with dynamic placeholders', () => {
    const customCommands: DiscordCommandDef[] = [
      ...INITIAL_DISCORD_COMMANDS,
      {
        id: 'cmd-custom-1',
        name: 'donate',
        prefixUsage: '!donate',
        slashUsage: '/donate',
        category: 'CUSTOM',
        description: 'Link ủng hộ server',
        permissions: 'Mọi thành viên',
        enabled: true,
        isCustom: true,
        customResponse: 'Cảm ơn {user} đã ủng hộ máy chủ {server}! Ghi chú: {args}'
      }
    ];

    const res = executeBotCommand('!donate gói VIP tháng', customCommands, mockCtx);
    assert.equal(res.handled, true);
    assert.equal(
      res.replyContent,
      'Cảm ơn Kyomi đã ủng hộ máy chủ Cộng Đồng Valorant Việt Nam! Ghi chú: gói VIP tháng'
    );
  });
});
