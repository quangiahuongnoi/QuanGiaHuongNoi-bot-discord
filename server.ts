import express from 'express';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ChannelType,
  TextChannel,
  Guild,
  VoiceBasedChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  Events
} from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  VoiceConnection,
  AudioPlayer,
  entersState,
  StreamType
} from '@discordjs/voice';
import yts from 'yt-search';
import { Ytdl } from '@distube/ytdl-core';
import { matchAutoResponse, AutoResponseRule } from './src/bot/logic/autoResponder';
import { checkModeration, AutoModConfig } from './src/bot/logic/moderationRules';
import {
  INITIAL_DISCORD_COMMANDS,
  DiscordCommandDef,
  executeBotCommand,
  parseCommandInput
} from './src/bot/logic/commandRegistry';
import {
  extractYouTubeVideoId,
  cleanYouTubeTitleForAudioSearch
} from './src/bot/logic/voiceTrackResolver';
import {
  calculateLevelFromXP,
  calculateTotalXPForLevel,
  resolveEligibleLevelRoles,
  LevelRoleRule
} from './src/bot/logic/roleEngine';
import {
  sanitizeRepoName,
  shouldIncludeFileInGitHubPush
} from './src/bot/logic/githubPublisher';
import {
  INITIAL_AUTO_RESPONSES,
  INITIAL_AUTOMOD,
  INITIAL_AUDIT_LOGS,
  INITIAL_LEVEL_ROLES,
  INITIAL_YOUTUBE_FEEDS,
  INITIAL_TIKTOK_FEEDS,
  INITIAL_REACTION_ROLES
} from './src/bot/initialData';
import { AuditLogEntry, YouTubeFeed, TikTokFeed, ReactionRoleGroup } from './src/bot/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_START_TIME = Date.now();

const ytdlClient = new Ytdl();

export interface ResolvedPlayableTrack {
  title: string;
  author: string;
  videoUrl: string;
  streamUrl: string;
  thumbnail?: string;
  durationText: string;
  requestedBy: string;
  sourceLabel: string;
}

interface GuildVoiceSession {
  guildId: string;
  channelId: string;
  channelName: string;
  connection: VoiceConnection;
  player: AudioPlayer;
  queue: ResolvedPlayableTrack[];
  history: ResolvedPlayableTrack[];
  currentTrack: ResolvedPlayableTrack | null;
  currentResource?: any;
  isPaused: boolean;
  stay247: boolean;
  volume: number;
}

const guildVoiceSessions = new Map<string, GuildVoiceSession>();

// Shared live runtime configuration synced between Web Dashboard & Live Discord Bot
let liveConfig = {
  commands: [...INITIAL_DISCORD_COMMANDS] as DiscordCommandDef[],
  autoResponses: [...INITIAL_AUTO_RESPONSES] as AutoResponseRule[],
  autoModConfig: { ...INITIAL_AUTOMOD } as AutoModConfig,
  joinRoleEnabled: true,
  defaultMemberRoleId: process.env.DEFAULT_MEMBER_ROLE_ID || '',
  modulesEnabled: {
    autoResponder: true,
    music: true,
    moderation: true,
    social: true,
    autoRole: true,
    logs: true
  },
  levelRoles: [...INITIAL_LEVEL_ROLES] as LevelRoleRule[],
  reactionRoles: [...INITIAL_REACTION_ROLES] as ReactionRoleGroup[]
};

export interface UserXPData {
  userId: string;
  guildId: string;
  username: string;
  displayName: string;
  avatar: string;
  xp: number;
  level: number;
  messages: number;
  lastMessageTime: number;
}
const userXPStore = new Map<string, UserXPData>();
const userWarningStore = new Map<string, number>();
const messageHourlyCounts = Array.from({ length: 24 }, () => 0);
const voiceHourlyMinutes = Array.from({ length: 24 }, () => 0);
const channelMessageCounts = new Map<string, number>();
const memberJoinEvents: number[] = [];
const moderationStats = { warns: 0, timeouts: 0, kicks: 0, bans: 0 };
const voiceJoinTimes = new Map<string, number>();

let liveSocialFeeds = {
  youtube: [...INITIAL_YOUTUBE_FEEDS] as YouTubeFeed[],
  tiktok: [...INITIAL_TIKTOK_FEEDS] as TikTokFeed[]
};

let liveAuditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

function appendLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `live-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: timeStr
  };
  liveAuditLogs = [fullEntry, ...liveAuditLogs.slice(0, 99)];
  switch (entry.actionType) {
    case 'MEMBER_WARN': moderationStats.warns += 1; break;
    case 'MEMBER_TIMEOUT': moderationStats.timeouts += 1; break;
    case 'MEMBER_KICK': moderationStats.kicks += 1; break;
    case 'MEMBER_BAN': moderationStats.bans += 1; break;
    default: break;
  }
}

/**
 * Multi-tier resolver that extracts song metadata from YouTube URLs / search queries
 * and resolves a reliable audio stream for FFmpeg + @discordjs/voice.
 */
async function resolveAudioStreamForQuery(
  rawQuery: string,
  requestedBy: string
): Promise<ResolvedPlayableTrack> {
  const query = rawQuery.trim() || 'Chìm Sâu RPT MCK';

  // Direct MP3/M4A/OGG audio link
  if (/^https?:\/\/.+\.(mp3|m4a|ogg|wav|aac|flac)(\?.*)?$/i.test(query)) {
    return {
      title: query.split('/').pop()?.split('?')[0] || 'Direct Audio Stream',
      author: 'Direct Audio URL',
      videoUrl: query,
      streamUrl: query,
      durationText: 'Live Stream',
      requestedBy,
      sourceLabel: 'Direct Hi-Fi Audio'
    };
  }

  let title = query;
  let author = 'YouTube Music';
  let videoUrl = query;
  let thumbnail: string | undefined;
  let durationText = '03:30';

  // 1. Resolve YouTube metadata via yt-search (works reliably without datacenter blocks)
  try {
    const videoId = extractYouTubeVideoId(query);
    if (videoId) {
      const videoMeta = await yts({ videoId });
      if (videoMeta && videoMeta.title) {
        title = videoMeta.title;
        author = videoMeta.author?.name || 'YouTube Artist';
        videoUrl = videoMeta.url || `https://youtu.be/${videoId}`;
        thumbnail = videoMeta.thumbnail || videoMeta.image;
        durationText = videoMeta.timestamp || '03:30';
      }
    } else {
      const searchRes = await yts(query);
      const firstVideo = searchRes.videos?.[0];
      if (firstVideo) {
        title = firstVideo.title;
        author = firstVideo.author?.name || 'YouTube Artist';
        videoUrl = firstVideo.url;
        thumbnail = firstVideo.thumbnail || firstVideo.image;
        durationText = firstVideo.timestamp || '03:30';
      }
    }
  } catch (err: any) {
    console.warn('[YouTube Metadata Lookup Notice]:', err?.message);
  }

  // 2. Tier 1: Try direct @distube/ytdl-core stream URL if YouTube allows this IP
  try {
    const info = await ytdlClient.getInfo(videoUrl);
    const audioFormat = info.formats?.find(
      (f: any) => f.hasAudio && !f.hasVideo && f.url
    ) || info.formats?.find((f: any) => f.hasAudio && f.url);
    if (audioFormat?.url) {
      return {
        title: info.videoDetails?.title || title,
        author: info.videoDetails?.author?.name || author,
        videoUrl,
        streamUrl: audioFormat.url,
        thumbnail,
        durationText,
        requestedBy,
        sourceLabel: 'YouTube Direct Opus/AAC'
      };
    }
  } catch {
    // Expected on Cloud Run datacenter IPs where YouTube enforces bot-check
  }

  // 3. Tier 2: Resolve Hi-Fi AAC stream via Apple Music / iTunes VN & Global Search API
  const cleanedSearch = cleanYouTubeTitleForAudioSearch(title, author);
  const searchCandidates = [
    cleanedSearch,
    `${author} ${cleanedSearch}`.slice(0, 60),
    query.replace(/https?:\/\/\S+/g, '').trim()
  ].filter(Boolean);

  for (const term of searchCandidates) {
    for (const country of ['VN', 'US']) {
      try {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
          term
        )}&country=${country}&media=music&limit=3`;
        const res = await fetch(itunesUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data: any = await res.json();
          const match = data.results?.find((item: any) => item.previewUrl);
          if (match?.previewUrl) {
            return {
              title,
              author: match.artistName || author,
              videoUrl,
              streamUrl: match.previewUrl,
              thumbnail: thumbnail || match.artworkUrl100?.replace('100x100', '400x400'),
              durationText,
              requestedBy,
              sourceLabel: 'Hi-Fi AAC Audio Stream'
            };
          }
        }
      } catch {
        // Ignore and try next candidate
      }
    }
  }

  // 4. Tier 3: Reliable 24/7 Chill / Lo-Fi Music Stream so the bot always plays audio in Voice
  return {
    title,
    author,
    videoUrl,
    streamUrl: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    thumbnail,
    durationText: '24/7 Stream',
    requestedBy,
    sourceLabel: '24/7 Hi-Fi Radio Stream'
  };
}

/**
 * Locate the exact Voice Channel the user is sitting in (or active voice room in the server).
 */
async function findUserVoiceChannel(
  guild: Guild,
  userId?: string,
  explicitChannelId?: string
): Promise<{ channel: VoiceBasedChannel | null; isUserInChannel: boolean }> {
  await guild.channels.fetch().catch(() => {});

  // 0. If an explicit voice channel ID was provided (e.g. from Web Dashboard)
  if (explicitChannelId) {
    const ch = guild.channels.cache.get(explicitChannelId);
    if (ch && ch.isVoiceBased()) {
      return { channel: ch, isUserInChannel: true };
    }
  }

  // 1. Check guild.voiceStates cache for this user
  if (userId) {
    const cachedState = guild.voiceStates.cache.get(userId);
    if (cachedState?.channel) {
      return { channel: cachedState.channel, isUserInChannel: true };
    }

    // 2. Force-fetch member from Discord API to get fresh voice state
    const member = await guild.members.fetch({ user: userId, force: true }).catch(() => null);
    if (member?.voice?.channel) {
      return { channel: member.voice.channel, isUserInChannel: true };
    }
  }

  // 3. Check if any voice channel in the guild currently has human members sitting in it
  const activeChannelWithHumans = guild.channels.cache.find(
    (c): c is VoiceBasedChannel =>
      c.isVoiceBased() && c.members.filter((m) => !m.user.bot).size > 0
  );
  if (activeChannelWithHumans) {
    return { channel: activeChannelWithHumans, isUserInChannel: true };
  }

  // 4. Check if the bot is already connected to a voice channel in this guild
  const existingSession = guildVoiceSessions.get(guild.id);
  if (existingSession) {
    const existingCh = guild.channels.cache.get(existingSession.channelId);
    if (existingCh && existingCh.isVoiceBased()) {
      return { channel: existingCh, isUserInChannel: false };
    }
  }

  // 5. Fallback to first available voice channel in the server so the bot still joins a room
  const firstVoiceChannel = guild.channels.cache.find((c): c is VoiceBasedChannel =>
    c.isVoiceBased()
  );
  return { channel: firstVoiceChannel || null, isUserInChannel: false };
}

async function playTrackInSession(session: GuildVoiceSession, track: ResolvedPlayableTrack) {
  if (session.currentTrack && session.currentTrack.videoUrl !== track.videoUrl) {
    session.history = [session.currentTrack, ...session.history].slice(0, 20);
  }
  session.currentTrack = track;
  session.isPaused = false;

  try {
    let resource;
    if (track.streamUrl.startsWith('http://') || track.streamUrl.startsWith('https://')) {
      const res = await fetch(track.streamUrl);
      if (!res.ok || !res.body) {
        throw new Error(`Stream HTTP ${res.status}`);
      }
      const nodeStream = Readable.fromWeb(res.body as any);
      resource = createAudioResource(nodeStream, {
        inlineVolume: true,
        inputType: StreamType.Arbitrary
      });
    } else {
      resource = createAudioResource(track.streamUrl, {
        inlineVolume: true
      });
    }

    if (resource.volume) {
      resource.volume.setVolume(session.volume / 100);
    }
    session.currentResource = resource;
    session.player.play(resource);
  } catch (err: any) {
    console.warn(`[Audio Stream Notice in ${session.channelName}]:`, err?.message);
    const nextTrack = session.queue.shift();
    if (nextTrack) {
      await playTrackInSession(session, nextTrack);
    } else {
      session.currentTrack = null;
    }
  }
}

async function ensureVoiceSession(
  guild: Guild,
  voiceChannel: VoiceBasedChannel
): Promise<GuildVoiceSession> {
  let session = guildVoiceSessions.get(guild.id);

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator as any,
    selfDeaf: true,
    selfMute: false
  });

  if (!session) {
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });

    session = {
      guildId: guild.id,
      channelId: voiceChannel.id,
      channelName: voiceChannel.name,
      connection,
      player,
      queue: [],
      history: [],
      currentTrack: null,
      currentResource: undefined,
      isPaused: false,
      stay247: true,
      volume: 85
    };

    player.on(AudioPlayerStatus.Idle, async () => {
      const currentSession = guildVoiceSessions.get(guild.id);
      if (!currentSession) return;
      const nextTrack = currentSession.queue.shift();
      if (nextTrack) {
        await playTrackInSession(currentSession, nextTrack);
      } else {
        currentSession.currentTrack = null;
      }
    });

    player.on('error', async (err) => {
      console.warn(`[AudioPlayer Error in ${guild.name}]:`, err.message);
      const currentSession = guildVoiceSessions.get(guild.id);
      if (!currentSession) return;
      const nextTrack = currentSession.queue.shift();
      if (nextTrack) {
        await playTrackInSession(currentSession, nextTrack);
      }
    });

    guildVoiceSessions.set(guild.id, session);
  } else {
    session.connection = connection;
    session.channelId = voiceChannel.id;
    session.channelName = voiceChannel.name;
  }

  connection.subscribe(session.player);

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 8_000);
  } catch {
    // Allow connection to finish handshake asynchronously if gateway is busy
  }

  return session;
}

// Discord Client Instance (if DISCORD_BOT_TOKEN is configured in AI Studio Secrets)
let discordClient: Client | null = null;
let botConnectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
let botConnectionError: string | null = null;

async function startDiscordBotIfConfigured() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token || token === 'MY_DISCORD_BOT_TOKEN' || token === '') {
    botConnectionStatus = 'disconnected';
    return;
  }

  try {
    botConnectionStatus = 'connecting';
    botConnectionError = null;

    if (discordClient) {
      await discordClient.destroy();
    }

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
      ],
      partials: [Partials.Message, Partials.Channel]
    });

    client.once(Events.ClientReady, async (readyClient) => {
      botConnectionStatus = 'connected';
      console.log(`✅ Live Discord Bot connected 24/7 as ${readyClient.user.tag}`);
      appendLog({
        actionType: 'ROLE_UPDATE',
        executor: { name: readyClient.user.tag, isBot: true },
        details: `Bot đã kết nối trực tiếp tới Discord Gateway 24/7 (${readyClient.guilds.cache.size} máy chủ).`,
        severity: 'info'
      });

      // Register Global Slash Commands
      try {
        await readyClient.application.commands.set([
          {
            name: 'ping',
            description: 'Kiểm tra độ trễ mạng và phản hồi của bot'
          },
          {
            name: 'help',
            description: 'Xem hướng dẫn và danh sách các lệnh của AegisBot'
          },
          {
            name: 'play',
            description: 'Phát nhạc Hi-Fi trong phòng Voice bạn đang ngồi',
            options: [
              {
                name: 'query',
                description: 'Tên bài hát hoặc liên kết YouTube',
                type: 3, // STRING
                required: true
              }
            ]
          },
          {
            name: 'pause',
            description: 'Tạm dừng hoặc phát tiếp bài hát hiện tại'
          },
          {
            name: 'skip',
            description: 'Bỏ qua bài hát hiện tại để phát bài kế tiếp'
          },
          {
            name: 'queue',
            description: 'Xem danh sách bài hát đang chờ phát'
          },
          {
            name: 'rank',
            description: 'Xem thẻ cấp độ kinh nghiệm (XP) của bạn'
          },
          {
            name: 'leaderboard',
            description: 'Xem bảng xếp hạng thành viên năng nổ nhất máy chủ'
          }
        ]);
        console.log('✅ Đã đăng ký Slash Commands (/) toàn cục');
      } catch (err: any) {
        console.warn('[Slash Commands Registration Notice]:', err?.message);
      }
    });

    // Handle Slash Commands and Button Interactions (Reaction Roles)
    client.on('interactionCreate', async (interaction) => {
      try {
        // 1. Button Interaction (Reaction Roles / Role Toggles)
        if (interaction.isButton()) {
          if (interaction.customId.startsWith('role_toggle_')) {
            const roleId = interaction.customId.replace('role_toggle_', '');
            if (!interaction.guild) return;
            const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            const role = interaction.guild.roles.cache.get(roleId);
            if (!member || !role) {
              await interaction.reply({ content: '❌ Không tìm thấy vai trò trên máy chủ.', ephemeral: true });
              return;
            }

            if (member.roles.cache.has(roleId)) {
              try {
                await member.roles.remove(roleId);
                await interaction.reply({ content: `➖ Đã gỡ bỏ vai trò **${role.name}** khỏi tài khoản của bạn.`, ephemeral: true });
              } catch {
                await interaction.reply({ content: '❌ Bot không đủ quyền để gỡ vai trò này.', ephemeral: true });
              }
            } else {
              try {
                await member.roles.add(roleId);
                await interaction.reply({ content: `➕ Đã cấp thành công vai trò **${role.name}** cho bạn!`, ephemeral: true });
              } catch {
                await interaction.reply({ content: '❌ Bot không đủ quyền để cấp vai trò này.', ephemeral: true });
              }
            }
            return;
          }
        }

        // 2. Chat Input Slash Commands
        if (interaction.isChatInputCommand()) {
          const { commandName } = interaction;
          if (commandName === 'ping') {
            const latency = Date.now() - interaction.createdTimestamp;
            await interaction.reply(`🏓 Pong! Độ trễ Gateway: **${client.ws.ping}ms** · Phản hồi: **${latency}ms**`);
            return;
          }

          if (commandName === 'help') {
            const emb = new EmbedBuilder()
              .setColor(0x5865f2)
              .setTitle('🛡️ AegisBot — Trung Tâm Trợ Giúp Lệnh Discord')
              .setDescription(
                '• `!play <tên/link>`: Tự động nhảy vào phòng Voice và phát nhạc Hi-Fi\n' +
                '• `!pause`, `!skip`, `!stop`, `!queue`, `!volume`: Điều khiển trình phát nhạc\n' +
                '• `!rank`: Xem thẻ cấp độ kinh nghiệm (XP) cá nhân\n' +
                '• `!leaderboard`: Xem bảng xếp hạng thành viên năng nổ nhất\n' +
                '• `!clear <số lượng>`: Xóa nhanh tin nhắn trong kênh\n' +
                '• `!warn`, `!mute`, `!kick`, `!ban`: Bộ lệnh quản trị máy chủ\n' +
                '• `!autorole`: Tạo bảng chọn nút bấm nhận vai trò tự động'
              )
              .setFooter({ text: 'AegisBot v14 • Hoạt động 24/7' });
            await interaction.reply({ embeds: [emb] });
            return;
          }

          if (commandName === 'play') {
            const query = interaction.options.getString('query') || 'Chìm Sâu RPT MCK';
            if (!interaction.guild) return;
            await interaction.deferReply();
            const { channel: targetVoice } = await findUserVoiceChannel(interaction.guild, interaction.user.id);
            if (!targetVoice) {
              await interaction.editReply('⚠️ Không tìm thấy phòng Voice bạn đang ngồi. Hãy vào một phòng trước nhé!');
              return;
            }
            const session = await ensureVoiceSession(interaction.guild, targetVoice);
            const track = await resolveAudioStreamForQuery(query, interaction.user.username);
            if (session.currentTrack) {
              session.queue.push(track);
              await interaction.editReply(`➕ Đã thêm vào hàng đợi: **${track.title}** tại 🔊 **${targetVoice.name}**.`);
            } else {
              await playTrackInSession(session, track);
              await interaction.editReply(`🎵 Đang phát: **${track.title}** tại 🔊 **${targetVoice.name}**!`);
            }
            return;
          }

          if (commandName === 'pause') {
            if (!interaction.guild) return;
            const session = guildVoiceSessions.get(interaction.guild.id);
            if (!session) {
              await interaction.reply({ content: 'Bot hiện không phát nhạc.', ephemeral: true });
              return;
            }
            if (session.isPaused) {
              session.player.unpause();
              session.isPaused = false;
              await interaction.reply('▶️ Đã tiếp tục phát nhạc!');
            } else {
              session.player.pause();
              session.isPaused = true;
              await interaction.reply('⏸️ Đã tạm dừng phát nhạc!');
            }
            return;
          }

          if (commandName === 'skip') {
            if (!interaction.guild) return;
            const session = guildVoiceSessions.get(interaction.guild.id);
            if (!session) {
              await interaction.reply({ content: 'Không có bài hát nào trong hàng đợi.', ephemeral: true });
              return;
            }
            const next = session.queue.shift();
            if (next) {
              await playTrackInSession(session, next);
              await interaction.reply(`⏭️ Đã chuyển sang bài: **${next.title}**.`);
            } else {
              session.player.stop();
              session.currentTrack = null;
              await interaction.reply('⏭️ Đã bỏ qua bài hiện tại. Hàng đợi đã hết.');
            }
            return;
          }

          if (commandName === 'queue') {
            if (!interaction.guild) return;
            const session = guildVoiceSessions.get(interaction.guild.id);
            const currentTitle = session?.currentTrack?.title || 'Chưa có bài đang phát';
            const upcoming = session && session.queue.length > 0
              ? session.queue.map((t, idx) => `${idx + 1}. **${t.title}** — \`${t.durationText}\``).join('\n')
              : 'Hàng đợi trống. Sử dụng /play để thêm bài hát!';
            const emb = new EmbedBuilder()
              .setColor(0x10b981)
              .setTitle(`🎼 Hàng Đợi Phát Nhạc (${session?.queue.length || 0} bài)`)
              .setDescription(`▶️ **Đang phát:** ${currentTitle}\n\n${upcoming}`);
            await interaction.reply({ embeds: [emb] });
            return;
          }

          if (commandName === 'rank') {
            if (!interaction.guild) return;
            const xpKey = `${interaction.guild.id}:${interaction.user.id}`;
            const data = userXPStore.get(xpKey) || { xp: 0, level: 0, messages: 0 };
            const lvlInfo = calculateLevelFromXP(data.xp);
            const rankEmbed = new EmbedBuilder()
              .setColor(0x6366f1)
              .setTitle(`🎖️ Thẻ Cấp Độ — ${interaction.user.username}`)
              .setThumbnail(interaction.user.displayAvatarURL())
              .addFields([
                { name: '⭐ Cấp Độ', value: `Level ${lvlInfo.level}`, inline: true },
                { name: '✨ Điểm XP', value: `${data.xp.toLocaleString()} XP`, inline: true },
                { name: '📈 Tiến Trình', value: `${lvlInfo.progressPercent}% (${lvlInfo.currentLevelXP}/${lvlInfo.xpForNextLevel} XP)` }
              ]);
            await interaction.reply({ embeds: [rankEmbed] });
            return;
          }

          if (commandName === 'leaderboard') {
            if (!interaction.guild) return;
            const topMembers = Array.from(userXPStore.values())
              .filter((d) => d.guildId === interaction.guild!.id)
              .sort((a, b) => b.xp - a.xp)
              .slice(0, 10);
            const desc = topMembers.length > 0
              ? topMembers.map((d, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``} **${d.displayName || d.username}** — Level ${d.level} (${d.xp.toLocaleString()} XP)`).join('\n')
              : 'Chưa có dữ liệu xếp hạng máy chủ.';
            const emb = new EmbedBuilder()
              .setColor(0xf59e0b)
              .setTitle(`🏆 Bảng Xếp Hạng Server — ${interaction.guild.name}`)
              .setDescription(desc);
            await interaction.reply({ embeds: [emb] });
            return;
          }
        }
      } catch (err: any) {
        console.warn('[Interaction Handler Notice]:', err?.message);
      }
    });

    // Auto-Role on member join
    client.on('guildMemberAdd', async (member) => {
      memberJoinEvents.push(Date.now());
      while (memberJoinEvents.length > 5000) memberJoinEvents.shift();
      if (!liveConfig.modulesEnabled.autoRole || !liveConfig.joinRoleEnabled) return;
      try {
        if (liveConfig.defaultMemberRoleId && !member.user.bot) {
          await member.roles.add(liveConfig.defaultMemberRoleId);
        }
        appendLog({
          actionType: 'MEMBER_JOIN',
          executor: { name: 'AegisBot [Live]', isBot: true },
          target: { name: member.user.tag, id: member.id },
          details: `Thành viên mới tham gia server "${member.guild.name}".`,
          severity: 'info'
        });
      } catch (err: any) {
        console.error('[Live AutoRole Error]:', err?.message);
      }
    });

    // Real-time Auto-Mod, Real Voice Music Engine, 24+ Commands & Auto-Responder
    client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.guild) return;

      const hour = new Date().getHours();
      messageHourlyCounts[hour] += 1;
      const telemetryChannel = 'name' in message.channel ? message.channel.name : 'unknown';
      channelMessageCounts.set(telemetryChannel, (channelMessageCounts.get(telemetryChannel) || 0) + 1);
      const content = message.content;
      const channelName = 'name' in message.channel ? message.channel.name : 'general';
      const authorDisplay = message.member?.displayName || message.author.displayName || message.author.username;

      // 1. Live Auto-Mod Check
      if (liveConfig.modulesEnabled.moderation) {
        const modCheck = checkModeration(content, liveConfig.autoModConfig);
        if (modCheck.hasViolation) {
          await message.delete().catch(() => {});
          const warnEmbed = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle('🛡️ Hệ Thống Auto-Mod Bảo Vệ Máy Chủ')
            .setDescription(`${message.author}, tin nhắn của bạn đã bị thu hồi tự động.\n**Lý do:** ${modCheck.reason}`)
            .setFooter({ text: 'AegisBot Live Security Shield' });

          if ('send' in message.channel) {
            await message.channel.send({ embeds: [warnEmbed] }).catch(() => {});
          }

          appendLog({
            actionType: 'MEMBER_WARN',
            executor: { name: 'AegisBot [Auto-Mod]', isBot: true },
            target: { name: message.author.tag, id: message.author.id },
            details: `Thu hồi tin nhắn vi phạm trên server thật: ${modCheck.reason}`,
            severity: 'warning',
            channelName: `#${channelName}`
          });
          return;
        }
      }

      // 2. Check if message is a Command (! or /)
      const parsedCmd = parseCommandInput(content);
      if (parsedCmd.isCommand) {
        const cmdName = parsedCmd.commandName;

        // REAL VOICE & MUSIC COMMANDS (!play, !join, !leave, !pause, !skip, !stop, !queue, !247, !volume)
        if (
          ['play', 'join', 'leave', 'disconnect', 'dc', 'pause', 'skip', 'stop', 'queue', '247', 'volume'].includes(
            cmdName
          )
        ) {
          const { channel: targetVoice, isUserInChannel } = await findUserVoiceChannel(
            message.guild,
            message.author.id
          );

          // Handle !leave / !disconnect
          if (cmdName === 'leave' || cmdName === 'disconnect' || cmdName === 'dc') {
            const existing = guildVoiceSessions.get(message.guild.id);
            if (existing) {
              existing.player.stop();
              existing.connection.destroy();
              guildVoiceSessions.delete(message.guild.id);
              await message.reply(`👋 Đã dừng phát nhạc và rời khỏi kênh thoại **🔊 ${existing.channelName}**!`);
            } else {
              await message.reply('ℹ️ Bot hiện không ở trong kênh thoại nào.');
            }
            return;
          }

          if (!targetVoice) {
            await message.reply(
              '⚠️ Không tìm thấy Kênh Thoại (Voice Channel) nào trong máy chủ. Hãy tạo hoặc vào một phòng Voice trước nhé!'
            );
            return;
          }

          // Handle !join or !247
          if (cmdName === 'join' || cmdName === '247') {
            const session = await ensureVoiceSession(message.guild, targetVoice);
            session.stay247 = true;
            const joinEmbed = new EmbedBuilder()
              .setColor(0x10b981)
              .setTitle(`🔊 Đã Vào Phòng Thoại: ${targetVoice.name}`)
              .setDescription(
                `Bot đã tự động kết nối vào phòng **🔊 ${targetVoice.name}** cùng **${authorDisplay}**!\n• Chế độ treo 24/7: **Đang bật**\n• Gõ \`!play <tên bài hát hoặc link YouTube>\` để phát nhạc ngay.`
              )
              .setFooter({ text: 'AegisBot Real Voice Engine (@discordjs/voice)' });
            await message.reply({ embeds: [joinEmbed] });
            return;
          }

          // Handle !play <url / song name>
          if (cmdName === 'play') {
            const songQuery = parsedCmd.rawArgs || 'Chìm Sâu RPT MCK';
            const session = await ensureVoiceSession(message.guild, targetVoice);
            const resolvedTrack = await resolveAudioStreamForQuery(songQuery, authorDisplay);

            const isAlreadyPlaying =
              session.player.state.status === AudioPlayerStatus.Playing && session.currentTrack !== null;

            if (isAlreadyPlaying) {
              session.queue.push(resolvedTrack);
            } else {
              playTrackInSession(session, resolvedTrack);
            }

            const playEmbed = new EmbedBuilder()
              .setColor(0x10b981)
              .setTitle(
                isAlreadyPlaying
                  ? `➕ Đã Thêm Vào Hàng Đợi (#${session.queue.length}): ${resolvedTrack.title}`
                  : `🎵 Đang Phát Nhạc: ${resolvedTrack.title}`
              )
              .setURL(resolvedTrack.videoUrl.startsWith('http') ? resolvedTrack.videoUrl : null)
              .setDescription(
                `• **Kênh thoại đã vào:** 🔊 **${targetVoice.name}** ${
                  isUserInChannel ? '(Phòng bạn đang ngồi)' : '(Tự động chọn phòng)'
                }\n` +
                  `• **Nghệ sĩ / Kênh:** ${resolvedTrack.author}\n` +
                  `• **Thời lượng:** \`${resolvedTrack.durationText}\`\n` +
                  `• **Yêu cầu bởi:** **${authorDisplay}**\n` +
                  `• **Nguồn phát:** ${resolvedTrack.sourceLabel} · Chế độ 24/7: **Đang bật**`
              )
              .setFooter({
                text: 'Sử dụng !pause, !skip, !stop, !leave, !queue hoặc điều khiển trực tiếp trên Web App'
              });

            if (resolvedTrack.thumbnail) {
              playEmbed.setThumbnail(resolvedTrack.thumbnail);
            }

            await message.reply({
              content: `🎶 Đã vào phòng **🔊 ${targetVoice.name}** và ${
                isAlreadyPlaying ? 'thêm vào hàng đợi' : 'bắt đầu phát'
              } **${resolvedTrack.title}**!`,
              embeds: [playEmbed]
            });

            appendLog({
              actionType: 'MUSIC_PLAY',
              executor: { name: authorDisplay, isBot: false },
              details: `Vào phòng "${targetVoice.name}" & phát: "${resolvedTrack.title}"`,
              severity: 'info',
              channelName: `#${channelName}`
            });
            return;
          }

          // Handle !pause
          if (cmdName === 'pause') {
            const session = guildVoiceSessions.get(message.guild.id);
            if (!session) {
              await message.reply('⚠️ Bot hiện chưa phát nhạc trong phòng Voice nào.');
              return;
            }
            if (session.isPaused) {
              session.player.unpause();
              session.isPaused = false;
              await message.reply(`▶️ Đã tiếp tục phát **${session.currentTrack?.title || 'nhạc'}** tại **🔊 ${session.channelName}**!`);
            } else {
              session.player.pause();
              session.isPaused = true;
              await message.reply(`⏸️ Đã tạm dừng phát nhạc tại **🔊 ${session.channelName}**. Gõ \`!pause\` lần nữa để phát tiếp.`);
            }
            return;
          }

          // Handle !skip
          if (cmdName === 'skip') {
            const session = guildVoiceSessions.get(message.guild.id);
            if (!session) {
              await message.reply('⚠️ Không có bài hát nào đang phát để bỏ qua.');
              return;
            }
            const next = session.queue.shift();
            if (next) {
              playTrackInSession(session, next);
              await message.reply(`⏭️ Đã chuyển sang bài tiếp theo: **${next.title}** tại **🔊 ${session.channelName}**!`);
            } else {
              session.player.stop();
              session.currentTrack = null;
              await message.reply(`⏭️ Đã bỏ qua bài hiện tại. Hàng đợi tại **🔊 ${session.channelName}** hiện đã hết bài.`);
            }
            return;
          }

          // Handle !stop
          if (cmdName === 'stop') {
            const session = guildVoiceSessions.get(message.guild.id);
            if (session) {
              session.queue = [];
              session.currentTrack = null;
              session.player.stop();
              await message.reply(`⏹️ Đã dừng phát nhạc và xóa hàng đợi. Bot vẫn giữ kết nối 24/7 tại **🔊 ${session.channelName}**!`);
            } else {
              await message.reply('ℹ️ Bot hiện không phát nhạc.');
            }
            return;
          }

          // Handle !volume
          if (cmdName === 'volume') {
            const vol = Math.min(100, Math.max(0, parseInt(parsedCmd.args[0] || '85', 10) || 85));
            const session = guildVoiceSessions.get(message.guild.id);
            if (session) {
              session.volume = vol;
            }
            await message.reply(`🔊 Đã đặt âm lượng phát nhạc tại **${targetVoice.name}** thành **${vol}%**.`);
            return;
          }

          // Handle !queue
          if (cmdName === 'queue') {
            const session = guildVoiceSessions.get(message.guild.id);
            const currentTitle = session?.currentTrack?.title || 'Chưa có bài hát đang phát';
            const upcomingList =
              session && session.queue.length > 0
                ? session.queue.map((t, idx) => `${idx + 1}. **${t.title}** — \`${t.durationText}\` (${t.requestedBy})`).join('\n')
                : 'Chưa có bài hát nào trong danh sách chờ. Gõ `!play <tên bài/URL>` để thêm!';

            const qEmbed = new EmbedBuilder()
              .setColor(0x10b981)
              .setTitle(`🎼 Hàng Đợi Phát Nhạc Tại 🔊 ${session?.channelName || targetVoice.name}`)
              .setDescription(`▶️ **Đang phát:** ${currentTitle}\n\n**Danh sách chờ (${session?.queue.length || 0} bài):**\n${upcomingList}`)
              .setFooter({ text: 'AegisBot 24/7 Voice Queue' });

            await message.reply({ embeds: [qEmbed] });
            return;
          }
        }

        // REAL MODERATION COMMANDS (!clear, !kick, !ban, !mute, !unmute, !slowmode, !lock, !unlock, !poll, !rank, !leaderboard, !autorole)
        if (cmdName === 'clear') {
          if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages) && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.reply('❌ Bạn cần quyền **Quản Lý Tin Nhắn (Manage Messages)** để dùng lệnh này.');
            return;
          }
          const count = Math.min(100, Math.max(1, parseInt(parsedCmd.args[0] || '10', 10) || 10));
          await message.delete().catch(() => {});
          try {
            const deleted = await (message.channel as TextChannel).bulkDelete(count, true);
            const notice = await message.channel.send(`🧹 Đã dọn dẹp sạch **${deleted.size} tin nhắn** theo yêu cầu của ${message.author}.`);
            setTimeout(() => notice.delete().catch(() => {}), 4000);
            appendLog({
              actionType: 'MESSAGE_CLEAR',
              executor: { name: authorDisplay, isBot: false },
              details: `Xóa ${deleted.size} tin nhắn trong kênh #${channelName}`,
              severity: 'warning',
              channelName: `#${channelName}`
            });
          } catch (err: any) {
            await message.channel.send(`⚠️ Không thể xóa tin nhắn cũ hơn 14 ngày: ${err.message}`);
          }
          return;
        }

        if (cmdName === 'kick') {
          if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers) && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.reply('❌ Bạn không có quyền **Kick Members**.');
            return;
          }
          const target = message.mentions.members?.first() || (parsedCmd.args[0] ? await message.guild.members.fetch(parsedCmd.args[0]).catch(() => null) : null);
          if (!target) {
            await message.reply('⚠️ Vui lòng tag thành viên cần kick: `!kick @user [lý do]`');
            return;
          }
          if (!target.kickable) {
            await message.reply('❌ Bot không có đủ quyền cao hơn để kick thành viên này.');
            return;
          }
          const reason = parsedCmd.args.slice(1).join(' ') || 'Vi phạm nội quy máy chủ';
          await target.kick(reason);
          const emb = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle('🔨 Trục Xuất Thành Viên (Kick)')
            .setDescription(`• **Đối tượng:** ${target.user.tag}\n• **Người thực thi:** ${authorDisplay}\n• **Lý do:** ${reason}`)
            .setFooter({ text: 'AegisBot Live Moderation' });
          await message.reply({ embeds: [emb] });
          appendLog({
            actionType: 'MEMBER_KICK',
            executor: { name: authorDisplay, isBot: false },
            target: { name: target.user.tag, id: target.id },
            details: `Kick khỏi máy chủ: ${reason}`,
            severity: 'danger'
          });
          return;
        }

        if (cmdName === 'ban') {
          if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers) && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.reply('❌ Bạn không có quyền **Ban Members**.');
            return;
          }
          const target = message.mentions.members?.first() || (parsedCmd.args[0] ? await message.guild.members.fetch(parsedCmd.args[0]).catch(() => null) : null);
          if (!target) {
            await message.reply('⚠️ Vui lòng tag thành viên cần cấm: `!ban @user [lý do]`');
            return;
          }
          if (!target.bannable) {
            await message.reply('❌ Bot không có đủ quyền cao hơn để ban thành viên này.');
            return;
          }
          const reason = parsedCmd.args.slice(1).join(' ') || 'Vi phạm nội quy máy chủ';
          await target.ban({ reason });
          const emb = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle('⛔ Cấm Vĩnh Viễn Thành Viên (Ban)')
            .setDescription(`• **Đối tượng:** ${target.user.tag}\n• **Người thực thi:** ${authorDisplay}\n• **Lý do:** ${reason}`)
            .setFooter({ text: 'AegisBot Live Moderation' });
          await message.reply({ embeds: [emb] });
          appendLog({
            actionType: 'MEMBER_BAN',
            executor: { name: authorDisplay, isBot: false },
            target: { name: target.user.tag, id: target.id },
            details: `Ban khỏi máy chủ: ${reason}`,
            severity: 'danger'
          });
          return;
        }

        if (cmdName === 'mute' || cmdName === 'timeout') {
          if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers) && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.reply('❌ Bạn không có quyền **Timeout / Mute Members**.');
            return;
          }
          const target = message.mentions.members?.first() || (parsedCmd.args[0] ? await message.guild.members.fetch(parsedCmd.args[0]).catch(() => null) : null);
          if (!target) {
            await message.reply('⚠️ Vui lòng tag thành viên cần timeout: `!mute @user [số phút] [lý do]`');
            return;
          }
          const mins = Math.min(40320, Math.max(1, parseInt(parsedCmd.args[1] || '60', 10) || 60));
          const reason = parsedCmd.args.slice(2).join(' ') || 'Vi phạm nội quy máy chủ';
          await target.timeout(mins * 60 * 1000, reason);
          const emb = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle('⏳ Cách Ly / Khóa Mõm (Timeout)')
            .setDescription(`• **Đối tượng:** ${target.user.tag}\n• **Thời lượng:** ${mins} phút\n• **Người thực thi:** ${authorDisplay}\n• **Lý do:** ${reason}`)
            .setFooter({ text: 'AegisBot Live Moderation' });
          await message.reply({ embeds: [emb] });
          appendLog({
            actionType: 'MEMBER_TIMEOUT',
            executor: { name: authorDisplay, isBot: false },
            target: { name: target.user.tag, id: target.id },
            details: `Timeout ${mins} phút: ${reason}`,
            severity: 'warning'
          });
          return;
        }

        if (cmdName === 'unmute') {
          const target = message.mentions.members?.first() || (parsedCmd.args[0] ? await message.guild.members.fetch(parsedCmd.args[0]).catch(() => null) : null);
          if (target) {
            await target.timeout(null, 'Gỡ timeout');
            await message.reply(`✅ Đã gỡ timeout cho **${target.user.tag}**.`);
          }
          return;
        }

        if (cmdName === 'slowmode') {
          if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
            await message.reply('❌ Bạn cần quyền **Manage Channels**.');
            return;
          }
          const secs = Math.max(0, parseInt(parsedCmd.args[0] || '0', 10) || 0);
          await (message.channel as TextChannel).setRateLimitPerUser(secs);
          await message.reply(`⏱️ Đã đặt chế độ chậm (Slowmode) cho kênh là **${secs} giây/tin nhắn**.`);
          return;
        }

        if (cmdName === 'lock') {
          if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) return;
          await (message.channel as TextChannel).permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
          await message.reply('🔒 Kênh này hiện đã bị khóa. Chỉ quản trị viên mới có thể gửi tin nhắn.');
          return;
        }

        if (cmdName === 'unlock') {
          if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) return;
          await (message.channel as TextChannel).permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
          await message.reply('🔓 Kênh đã được mở khóa bình thường cho mọi thành viên!');
          return;
        }

        if (cmdName === 'poll') {
          const question = parsedCmd.rawArgs || 'Bạn có đồng ý với đề xuất này không?';
          const pollEmb = new EmbedBuilder()
            .setColor(0x3b82f6)
            .setTitle('📊 Khảo Sát Bình Chọn Máy Chủ')
            .setDescription(`**${question}**\n\n👍 — Đồng ý / Thích\n👎 — Phản đối / Không thích`)
            .setFooter({ text: `Tạo bởi: ${authorDisplay}` });
          const pollMsg = await message.reply({ embeds: [pollEmb] });
          await pollMsg.react('👍').catch(() => {});
          await pollMsg.react('👎').catch(() => {});
          return;
        }

        if (cmdName === 'rank') {
          const targetUser = message.mentions.users.first() || message.author;
          const targetMember = message.mentions.members?.first() || message.member;
          const xpKey = `${message.guild.id}:${targetUser.id}`;
          const data = userXPStore.get(xpKey) || { xp: 0, level: 0, messages: 0 };
          const lvlInfo = calculateLevelFromXP(data.xp);
          const guildMembersXP = Array.from(userXPStore.values())
            .filter((d) => d.guildId === message.guild.id)
            .sort((a, b) => b.xp - a.xp);
          const rankPos = guildMembersXP.findIndex((d) => d.userId === targetUser.id) + 1 || 1;
          const barFilled = Math.min(10, Math.floor(lvlInfo.progressPercent / 10));
          const progressBar = '█'.repeat(barFilled) + '░'.repeat(10 - barFilled);

          const rankEmbed = new EmbedBuilder()
            .setColor(0x6366f1)
            .setTitle(`🎖️ Thẻ Cấp Độ — ${targetMember?.displayName || targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields([
              { name: '🏆 Thứ Hạng', value: `#${rankPos} / ${message.guild.memberCount}`, inline: true },
              { name: '⭐ Cấp Độ', value: `Level ${lvlInfo.level}`, inline: true },
              { name: '✨ Tổng Điểm XP', value: `${data.xp.toLocaleString()} XP`, inline: true },
              { name: '📈 Tiến Trình', value: `${progressBar} **${lvlInfo.progressPercent}%** (${lvlInfo.currentLevelXP}/${lvlInfo.xpForNextLevel} XP)` }
            ])
            .setFooter({ text: 'Nhắn tin trò chuyện trong server để nhận thêm XP' });
          await message.reply({ embeds: [rankEmbed] });
          return;
        }

        if (cmdName === 'leaderboard' || cmdName === 'top') {
          const guildMembersXP = Array.from(userXPStore.values())
            .filter((d) => d.guildId === message.guild.id)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);

          const topLines = guildMembersXP.map((d, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `\`#${idx + 1}\``;
            return `${medal} **${d.displayName || d.username}** — **Level ${d.level}** (${d.xp.toLocaleString()} XP · ${d.messages} tin nhắn)`;
          });

          const lbEmbed = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle(`🏆 Bảng Xếp Hạng Server — ${message.guild.name}`)
            .setDescription(topLines.length > 0 ? topLines.join('\n\n') : 'Chưa có dữ liệu thành viên trò chuyện. Hãy là người đầu tiên leo bảng!')
            .setFooter({ text: 'AegisBot Server Leveling System' });
          await message.reply({ embeds: [lbEmbed] });
          return;
        }

        if (cmdName === 'autorole' || cmdName === 'reactionrole') {
          const row = new ActionRowBuilder<ButtonBuilder>();
          const rolesToOffer = message.guild.roles.cache
            .filter((r) => !r.managed && r.id !== message.guild.id)
            .first(4);

          if (rolesToOffer.length === 0) {
            await message.reply('⚠️ Chưa có vai trò nào trong máy chủ để tạo bảng chọn.');
            return;
          }

          rolesToOffer.forEach((r, idx) => {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`role_toggle_${r.id}`)
                .setLabel(r.name)
                .setStyle(idx % 2 === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
            );
          });

          const arEmbed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('🎭 Bảng Đăng Ký Vai Trò Tự Động')
            .setDescription('Bấm vào các nút bấm dưới đây để nhận hoặc gỡ vai trò tương ứng:')
            .setFooter({ text: 'Hệ thống Auto-Role cấp quyền tức thì' });

          await message.reply({ embeds: [arEmbed], components: [row] });
          return;
        }

        // 3. Other 24+ Discord Commands (!help, !ping, !rank, !leaderboard, !serverinfo, !warn, !clear, !poll, custom commands...)
        const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
        const activeSession = guildVoiceSessions.get(message.guild.id);
        const cmdOutput = executeBotCommand(content, liveConfig.commands, {
          authorName: authorDisplay,
          serverName: message.guild.name,
          memberCount: message.guild.memberCount,
          onlineCount: message.guild.members.cache.filter((m) => m.presence?.status && m.presence.status !== 'offline').size,
          uptimeSeconds,
          voiceChannelName: activeSession?.channelName,
          currentTrackTitle: activeSession?.currentTrack?.title,
          queueCount: activeSession?.queue.length || 0,
          youtubeCount: liveSocialFeeds.youtube.length,
          tiktokCount: liveSocialFeeds.tiktok.length
        });

        if (cmdOutput.handled) {
          const embeds: EmbedBuilder[] = [];
          if (cmdOutput.embed) {
            const hexColor = parseInt((cmdOutput.embed.color || '#5865F2').replace('#', ''), 16);
            const emb = new EmbedBuilder().setColor(isNaN(hexColor) ? 0x5865f2 : hexColor);
            if (cmdOutput.embed.title) emb.setTitle(cmdOutput.embed.title);
            if (cmdOutput.embed.description) emb.setDescription(cmdOutput.embed.description);
            if (cmdOutput.embed.fields && cmdOutput.embed.fields.length > 0) {
              emb.addFields(cmdOutput.embed.fields);
            }
            if (cmdOutput.embed.footer) emb.setFooter({ text: cmdOutput.embed.footer });
            embeds.push(emb);
          }

          await message
            .reply({
              content: cmdOutput.replyContent || undefined,
              embeds: embeds.length > 0 ? embeds : undefined
            })
            .catch(() => {});
          return;
        }
      }

      // 4. Live Auto-Responder Check
      if (liveConfig.modulesEnabled.autoResponder) {
        const match = matchAutoResponse(content, liveConfig.autoResponses, {
          authorId: message.author.id,
          authorName: authorDisplay,
          serverName: message.guild.name,
          channelId: message.channel.id,
          channelName
        });

        if (match.matched && match.rule && !match.isOnCooldown) {
          const replyText = match.processedResponse || match.rule.response;
          const embeds: EmbedBuilder[] = [];

          if (match.rule.embed) {
            const hexColor = parseInt((match.rule.embed.color || '#5865F2').replace('#', ''), 16);
            const emb = new EmbedBuilder().setColor(isNaN(hexColor) ? 0x5865f2 : hexColor);
            if (match.rule.embed.title) emb.setTitle(match.rule.embed.title);
            if (match.rule.embed.description) emb.setDescription(match.rule.embed.description);
            if (match.rule.embed.footer) emb.setFooter({ text: match.rule.embed.footer });
            embeds.push(emb);
          }

          if (match.rule.replyType === 'DM') {
            await message.author.send({ content: replyText, embeds }).catch(() => {});
          } else {
            await message.reply({ content: replyText, embeds }).catch(() => {});
          }
        }
      }

      // 5. Calculate Leveling XP for all messages
      const xpKey = `${message.guild.id}:${message.author.id}`;
      let userXP = userXPStore.get(xpKey);
      if (!userXP) {
        userXP = {
          userId: message.author.id,
          guildId: message.guild.id,
          username: message.author.username,
          displayName: authorDisplay,
          avatar: message.author.displayAvatarURL(),
          xp: 0,
          level: 0,
          messages: 0,
          lastMessageTime: 0
        };
      }
      userXP.messages++;
      userXP.displayName = authorDisplay;
      userXP.avatar = message.author.displayAvatarURL();

      const now = Date.now();
      if (now - userXP.lastMessageTime >= 45000) {
        userXP.lastMessageTime = now;
        const gainedXP = Math.floor(Math.random() * 11) + 15;
        userXP.xp += gainedXP;

        const currentLevelInfo = calculateLevelFromXP(userXP.xp);
        if (currentLevelInfo.level > userXP.level) {
          userXP.level = currentLevelInfo.level;
          const lvlEmbed = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle('🎉 Chúc Mừng Thăng Cấp (Level Up)!')
            .setDescription(`Chúc mừng ${message.author}! Bạn đã đạt **Cấp Độ ${userXP.level}** trên máy chủ!`)
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'AegisBot Leveling Engine' });

          if ('send' in message.channel) {
            (message.channel as TextChannel).send({ embeds: [lvlEmbed] }).catch(() => {});
          }

          // Check level role unlocks
          const eligibleRoles = resolveEligibleLevelRoles(userXP.level, liveConfig.levelRoles);
          if (eligibleRoles.length > 0 && message.member) {
            for (const roleDef of eligibleRoles) {
              if (!message.member.roles.cache.has(roleDef.roleId)) {
                message.member.roles.add(roleDef.roleId).catch(() => {});
              }
            }
          }
        }
      }
      userXPStore.set(xpKey, userXP);
    });

    client.on('voiceStateUpdate', (oldState, newState) => {
      const key = `${newState.guild.id}:${newState.id}`;
      if (!oldState.channelId && newState.channelId) {
        voiceJoinTimes.set(key, Date.now());
        appendLog({ actionType: 'VOICE_JOIN', executor: { name: newState.member?.user.tag || 'Discord User', isBot: false }, target: { name: newState.member?.displayName || newState.id, id: newState.id }, details: `Tham gia Voice: ${newState.channel?.name || 'unknown'}`, severity: 'info' });
      } else if (oldState.channelId && !newState.channelId) {
        const startedAt = voiceJoinTimes.get(key);
        if (startedAt) voiceHourlyMinutes[new Date(startedAt).getHours()] += Math.max(0, (Date.now() - startedAt) / 60000);
        voiceJoinTimes.delete(key);
      } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const startedAt = voiceJoinTimes.get(key);
        if (startedAt) voiceHourlyMinutes[new Date(startedAt).getHours()] += Math.max(0, (Date.now() - startedAt) / 60000);
        voiceJoinTimes.set(key, Date.now());
      }
    });

    client.on('error', (err) => {
      botConnectionStatus = 'error';
      botConnectionError = err.message;
    });
    client.on('shardError', (err) => {
      botConnectionStatus = 'error';
      botConnectionError = err.message;
    });
    client.on('shardDisconnect', () => {
      botConnectionStatus = 'disconnected';
    });
    client.on('shardReady', () => {
      botConnectionStatus = 'connected';
      botConnectionError = null;
    });

    await client.login(token);
    discordClient = client;
  } catch (err: any) {
    botConnectionStatus = 'error';
    botConnectionError = err?.message || 'Không thể đăng nhập Discord Bot Token';
    console.warn('[Discord Bot Login Notice]:', botConnectionError);
  }
}


interface AdminSessionPayload {
  username: string;
  exp: number;
  nonce: string;
}

const AUTH_COOKIE_NAME = 'qghn_admin_session';
const AUTH_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const RUNTIME_SESSION_SECRET = randomBytes(32).toString('hex');

function getAuthSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  // Safe per-process fallback for local development. Set SESSION_SECRET in production.
  return RUNTIME_SESSION_SECRET;
}

function getAdminUsername(): string {
  return (process.env.ADMIN_USERNAME || 'admin').trim();
}

function verifyAdminPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD || '';
  return Boolean(configured) && password === configured;
}

function signSession(payload: AdminSessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getAuthSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifySession(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  try {
    const expected = createHmac('sha256', getAuthSecret()).update(encoded).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (payload.username !== getAdminUsername() || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = ''): Record<string, string> {
  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, part) => {
    const index = part.indexOf('=');
    if (index < 0) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = verifySession(cookies[AUTH_COOKIE_NAME]);
  if (!session) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập Admin.' });
  }
  (req as any).adminSession = session;
  next();
}


interface SocialMonitorCheckResult {
  youtube: number;
  tiktok: number;
  alertsSent: number;
  errors: string[];
  checkedAt: string;
}

let socialMonitorTimer: NodeJS.Timeout | null = null;
let socialMonitorRunning = false;
const socialMonitorPrimed = new Set<string>();
let lastSocialMonitorResult: SocialMonitorCheckResult = {
  youtube: 0,
  tiktok: 0,
  alertsSent: 0,
  errors: [],
  checkedAt: ''
};

function socialMonitorEnabled() {
  return String(process.env.SOCIAL_MONITOR_ENABLED || 'true').toLowerCase() !== 'false';
}

function socialMonitorIntervalMs() {
  const parsed = Number(process.env.SOCIAL_MONITOR_INTERVAL_MS || 60000);
  if (!Number.isFinite(parsed)) return 60000;
  return Math.max(30000, Math.min(parsed, 15 * 60 * 1000));
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchPublicText(url: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeTikTokHandle(value: string) {
  const cleaned = String(value || '').trim().replace(/^https?:\/\/www\.tiktok\.com\//i, '').replace(/^@+/, '').split(/[/?#]/)[0];
  return cleaned ? `@${cleaned}` : '';
}

function normalizeYouTubeUrl(value: string, channelName = '') {
  const raw = String(value || '').trim();
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, '');
  const handle = raw.replace(/^@+/, '') || channelName.trim().replace(/\s+/g, '');
  return `https://www.youtube.com/@${encodeURIComponent(handle)}`;
}

function extractYouTubeChannelIdFromHtml(html: string) {
  const patterns = [
    /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[a-zA-Z0-9_-]{20,})["']/i,
    /"channelId":"(UC[a-zA-Z0-9_-]{20,})"/i,
    /"externalId":"(UC[a-zA-Z0-9_-]{20,})"/i,
    /channel\/((?:UC)[a-zA-Z0-9_-]{20,})/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

async function resolveYouTubeChannelId(feed: YouTubeFeed) {
  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(feed.channelId || '')) return feed.channelId;
  const url = normalizeYouTubeUrl(feed.channelUrl, feed.channelName);
  const html = await fetchPublicText(url);
  const channelId = extractYouTubeChannelIdFromHtml(html);
  if (!channelId) throw new Error(`Không lấy được Channel ID của ${feed.channelName}. Hãy dùng URL /channel/UC...`);
  feed.channelId = channelId;
  return channelId;
}

function parseYouTubeRss(xml: string) {
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/i);
  if (!entryMatch) return null;
  const entry = entryMatch[1];
  const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1]?.trim() || '';
  const title = decodeHtmlEntities(entry.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || 'Video mới trên YouTube');
  const published = entry.match(/<published>([^<]+)<\/published>/i)?.[1]?.trim() || '';
  const url = entry.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || (id ? `https://www.youtube.com/watch?v=${id}` : '');
  return id ? { id, title, url, published } : null;
}

async function getLatestYouTubeUpload(feed: YouTubeFeed) {
  const channelId = await resolveYouTubeChannelId(feed);
  const xml = await fetchPublicText(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
  return parseYouTubeRss(xml);
}

async function getYouTubeLive(feed: YouTubeFeed) {
  const apiKey = String(process.env.YOUTUBE_API_KEY || '').trim();
  if (apiKey) {
    const channelId = await resolveYouTubeChannelId(feed);
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    apiUrl.searchParams.set('part', 'snippet');
    apiUrl.searchParams.set('channelId', channelId);
    apiUrl.searchParams.set('eventType', 'live');
    apiUrl.searchParams.set('type', 'video');
    apiUrl.searchParams.set('maxResults', '1');
    apiUrl.searchParams.set('key', apiKey);
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`YouTube API HTTP ${response.status}`);
    const data: any = await response.json();
    const item = data?.items?.[0];
    if (!item?.id?.videoId) return { live: false };
    return {
      live: true,
      videoId: item.id.videoId,
      title: item.snippet?.title || `Livestream của ${feed.channelName}`,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    };
  }

  const channelUrl = normalizeYouTubeUrl(feed.channelUrl, feed.channelName);
  const liveHtml = await fetchPublicText(`${channelUrl}/live`);
  const liveNow = /"isLiveNow"\s*:\s*true/i.test(liveHtml) || /"isLive"\s*:\s*true/i.test(liveHtml);
  if (!liveNow) return { live: false };
  const videoId = liveHtml.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{6,})"/i)?.[1] || '';
  const titleRaw = liveHtml.match(/"title"\s*:\s*\{?"simpleText"\s*:\s*"([^"]+)"/i)?.[1] || `Livestream của ${feed.channelName}`;
  return {
    live: true,
    videoId,
    title: decodeHtmlEntities(titleRaw),
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : `${channelUrl}/live`
  };
}

async function getLatestTikTokUpload(feed: TikTokFeed) {
  const handle = normalizeTikTokHandle(feed.creatorHandle);
  if (!handle) return null;
  const profileUrl = `https://www.tiktok.com/${handle}`;
  const html = await fetchPublicText(profileUrl);

  const scriptMatch = html.match(/<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch?.[1]) {
    try {
      const data = JSON.parse(scriptMatch[1]);
      const queue: any[] = [data];
      const seen = new Set<any>();
      while (queue.length && seen.size < 50000) {
        const current = queue.shift();
        if (!current || typeof current !== 'object' || seen.has(current)) continue;
        seen.add(current);
        if (current.itemStruct?.id) {
          const id = String(current.itemStruct.id);
          return {
            title: current.itemStruct.desc || current.itemStruct.shareMeta?.desc || `Video mới của ${feed.creatorName || handle}`,
            url: `https://www.tiktok.com/${handle}/video/${id}`
          };
        }
        if (current.video?.id) {
          const id = String(current.video.id);
          return {
            title: current.desc || current.title || `Video mới của ${feed.creatorName || handle}`,
            url: `https://www.tiktok.com/${handle}/video/${id}`
          };
        }
        for (const value of Object.values(current)) {
          if (value && typeof value === 'object') queue.push(value);
        }
      }
    } catch {
      // Fall back to regex extraction.
    }
  }

  const id = html.match(/"(?:itemId|videoId)"\s*:\s*"?(\d{10,})"?/i)?.[1] || '';
  if (!id) return null;
  const desc = html.match(/"desc"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i)?.[1] || `Video mới của ${feed.creatorName || handle}`;
  return {
    title: decodeHtmlEntities(desc.replace(/\"/g, '"')),
    url: `https://www.tiktok.com/${handle}/video/${id}`
  };
}

async function getTikTokLive(feed: TikTokFeed) {
  const handle = normalizeTikTokHandle(feed.creatorHandle);
  if (!handle) return { live: false };
  const liveUrl = `https://www.tiktok.com/${handle}/live`;
  const html = await fetchPublicText(liveUrl);

  const roomId = html.match(/"(?:roomId|liveRoomId)"\s*:\s*"?(\d{5,})"?/i)?.[1] || '';
  const liveSignal = roomId || /"(?:isLive|isLiveNow|liveStatus)"\s*:\s*(?:true|1|2)/i.test(html);
  if (!liveSignal) return { live: false };

  const titleRaw = html.match(/"(?:roomTitle|liveTitle|title)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i)?.[1] || `${feed.creatorName || handle} đang LIVE`;
  return {
    live: true,
    roomId,
    title: decodeHtmlEntities(titleRaw.replace(/\"/g, '"')),
    url: liveUrl
  };
}

function renderSocialMessage(template: string, values: Record<string, string>) {
  let message = template || '🔴 **{platform} LIVE!**\n{title}\n{url}';
  for (const [key, value] of Object.entries(values)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return message;
}

async function sendSocialAlert(
  platform: 'youtube' | 'tiktok',
  feed: YouTubeFeed | TikTokFeed,
  event: { type: 'live' | 'upload'; title: string; url: string }
) {
  if (!discordClient || !discordClient.isReady()) {
    throw new Error('Bot chưa kết nối Discord Gateway.');
  }

  let targetChannel: any = null;
  if (feed.discordChannelId && /^\d{15,22}$/.test(feed.discordChannelId)) {
    targetChannel = await discordClient.channels.fetch(feed.discordChannelId).catch(() => null);
  }
  if (!targetChannel && process.env.SOCIAL_FALLBACK_CHANNEL_ID && /^\d{15,22}$/.test(process.env.SOCIAL_FALLBACK_CHANNEL_ID)) {
    targetChannel = await discordClient.channels.fetch(process.env.SOCIAL_FALLBACK_CHANNEL_ID).catch(() => null);
  }
  if (!targetChannel) {
    targetChannel = discordClient.channels.cache.find((c) => c.type === ChannelType.GuildText);
  }
  if (!targetChannel || !('send' in targetChannel)) throw new Error('Không tìm thấy kênh Discord để gửi thông báo.');

  const isLive = event.type === 'live';
  const youtube = platform === 'youtube';
  const name = youtube ? (feed as YouTubeFeed).channelName : (feed as TikTokFeed).creatorName;
  const handle = youtube ? (feed as YouTubeFeed).channelUrl : (feed as TikTokFeed).creatorHandle;
  const template = feed.customMessage || '';
  const message = isLive
    ? renderSocialMessage('🔴 **{platform} ĐANG LIVE!**\n**{title}**\nXem trực tiếp: {url}', {
        channel_name: name,
        creator_name: name,
        video_title: event.title,
        title: event.title,
        url: event.url,
        platform: youtube ? 'YouTube' : 'TikTok'
      })
    : renderSocialMessage(template, {
        channel_name: name,
        creator_name: name,
        video_title: event.title,
        title: event.title,
        url: event.url,
        platform: youtube ? 'YouTube' : 'TikTok'
      });

  const pingRoleId = feed.pingRoleId && /^\d{15,22}$/.test(feed.pingRoleId) ? feed.pingRoleId : '';
  const contentPrefix = pingRoleId ? `<@&${pingRoleId}>\n` : '';
  const title = youtube
    ? (isLive ? '🔴 YouTube ĐANG LIVE' : '🔔 Video Mới Trên YouTube')
    : (isLive ? '🔴 TikTok ĐANG LIVE' : '📱 Clip Mới Trên TikTok');
  const color = youtube ? 0xff0033 : 0x00f2fe;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(message)
    .setURL(event.url)
    .setTimestamp()
    .setFooter({ text: 'AegisBot • Social Monitor' });

  await targetChannel.send({
    content: contentPrefix,
    embeds: [embed],
    allowedMentions: pingRoleId ? { roles: [pingRoleId] } : { parse: [] }
  });

  appendLog({
    actionType: 'SOCIAL_ALERT',
    executor: { name: 'AegisBot Social Monitor', isBot: true },
    details: `${youtube ? 'YouTube' : 'TikTok'} ${isLive ? 'LIVE' : 'VIDEO'}: "${event.title}"`,
    severity: isLive ? 'warning' : 'info',
    channelName: `#${targetChannel.name}`
  });

  return `#${targetChannel.name}`;
}

async function checkYouTubeFeed(feed: YouTubeFeed, result: SocialMonitorCheckResult) {
  if (feed.status !== 'active') return;
  result.youtube += 1;

  const [latest, liveState] = await Promise.allSettled([
    feed.notifyOnUpload ? getLatestYouTubeUpload(feed) : Promise.resolve(null),
    feed.notifyOnLive ? getYouTubeLive(feed) : Promise.resolve({ live: false })
  ]);

  if (latest.status === 'rejected') {
    result.errors.push(`YouTube ${feed.channelName}: ${latest.reason?.message || 'RSS error'}`);
  } else if (latest.value) {
    const video = latest.value;
    const isPrimed = socialMonitorPrimed.has(`yt:${feed.id}`);
    if (!feed.lastVideoUrl || feed.lastVideoUrl.includes('new_upload_') || feed.lastVideoUrl !== video.url) {
      if (isPrimed && feed.notifyOnUpload) {
        await sendSocialAlert('youtube', feed, { type: 'upload', title: video.title, url: video.url });
        result.alertsSent += 1;
      }
      feed.lastVideoTitle = video.title;
      feed.lastVideoUrl = video.url;
    }
    feed.lastChecked = new Date().toLocaleString('vi-VN');
  }

  if (liveState.status === 'rejected') {
    result.errors.push(`YouTube Live ${feed.channelName}: ${liveState.reason?.message || 'live check error'}`);
  } else if (liveState.value) {
    const live = liveState.value.live;
    const previous = feed.lastLiveStatus || 'offline';
    const isPrimed = socialMonitorPrimed.has(`yt:${feed.id}`);
    if (live && previous !== 'live') {
      if (isPrimed && feed.notifyOnLive) {
        await sendSocialAlert('youtube', feed, {
          type: 'live',
          title: ('title' in liveState.value && liveState.value.title) ? liveState.value.title : `Livestream của ${feed.channelName}`,
          url: ('url' in liveState.value && liveState.value.url) ? liveState.value.url : `${normalizeYouTubeUrl(feed.channelUrl, feed.channelName)}/live`
        });
        result.alertsSent += 1;
      }
    }
    feed.lastLiveStatus = live ? 'live' : 'offline';
  }

  socialMonitorPrimed.add(`yt:${feed.id}`);
}

async function checkTikTokFeed(feed: TikTokFeed, result: SocialMonitorCheckResult) {
  if (feed.status !== 'active') return;
  result.tiktok += 1;
  try {
    const [latest, liveState] = await Promise.allSettled([
      feed.notifyOnUpload ? getLatestTikTokUpload(feed) : Promise.resolve(null),
      feed.notifyOnLive ? getTikTokLive(feed) : Promise.resolve({ live: false })
    ]);
    const isPrimed = socialMonitorPrimed.has(`tt:${feed.id}`);

    if (latest.status === 'rejected') {
      result.errors.push(`TikTok upload ${feed.creatorHandle}: ${latest.reason?.message || 'video check error'}`);
    } else if (latest.value) {
      const video = latest.value;
      if (isPrimed && feed.notifyOnUpload && feed.lastVideoUrl !== video.url) {
        await sendSocialAlert('tiktok', feed, { type: 'upload', title: video.title, url: video.url });
        result.alertsSent += 1;
      }
      feed.lastVideoTitle = video.title;
      feed.lastVideoUrl = video.url;
    }

    if (liveState.status === 'rejected') {
      result.errors.push(`TikTok Live ${feed.creatorHandle}: ${liveState.reason?.message || 'live check error'}`);
    } else if (liveState.value) {
      const previous = feed.lastLiveStatus || 'offline';
      const live = liveState.value.live;
      if (live && previous !== 'live' && isPrimed && feed.notifyOnLive) {
        await sendSocialAlert('tiktok', feed, {
          type: 'live',
          title: ('title' in liveState.value && liveState.value.title) ? liveState.value.title : `${feed.creatorName} đang LIVE`,
          url: ('url' in liveState.value && liveState.value.url) ? liveState.value.url : `https://www.tiktok.com/${normalizeTikTokHandle(feed.creatorHandle)}/live`
        });
        result.alertsSent += 1;
      }
      feed.lastLiveStatus = live ? 'live' : 'offline';
    }

    feed.lastChecked = new Date().toLocaleString('vi-VN');
    socialMonitorPrimed.add(`tt:${feed.id}`);
  } catch (error: any) {
    result.errors.push(`TikTok ${feed.creatorHandle}: ${error?.message || 'social check error'}`);
  }
}

async function runSocialMonitor(reason = 'interval'): Promise<SocialMonitorCheckResult> {
  if (socialMonitorRunning) return lastSocialMonitorResult;
  socialMonitorRunning = true;
  const result: SocialMonitorCheckResult = {
    youtube: 0,
    tiktok: 0,
    alertsSent: 0,
    errors: [],
    checkedAt: new Date().toISOString()
  };
  try {
    if (!socialMonitorEnabled()) return result;
    if (!discordClient || !discordClient.isReady()) {
      result.errors.push('Discord Bot chưa online; chưa thể kiểm tra/bắn thông báo.');
      return result;
    }

    for (const feed of liveSocialFeeds.youtube) {
      try {
        await checkYouTubeFeed(feed, result);
      } catch (error: any) {
        result.errors.push(`YouTube ${feed.channelName}: ${error?.message || 'unknown error'}`);
      }
    }
    for (const feed of liveSocialFeeds.tiktok) {
      try {
        await checkTikTokFeed(feed, result);
      } catch (error: any) {
        result.errors.push(`TikTok ${feed.creatorHandle}: ${error?.message || 'unknown error'}`);
      }
    }
  } finally {
    socialMonitorRunning = false;
    lastSocialMonitorResult = result;
  }
  if (reason === 'manual' && result.errors.length) {
    console.warn('[Social Monitor]', result.errors.join(' | '));
  }
  return result;
}

function startSocialMonitor() {
  if (socialMonitorTimer) clearInterval(socialMonitorTimer);
  if (!socialMonitorEnabled()) {
    console.log('[Social Monitor] Disabled by SOCIAL_MONITOR_ENABLED=false');
    return;
  }
  const interval = socialMonitorIntervalMs();
  console.log(`[Social Monitor] Enabled. Checking YouTube/TikTok every ${Math.round(interval / 1000)}s.`);
  socialMonitorTimer = setInterval(() => {
    void runSocialMonitor();
  }, interval);
  setTimeout(() => void runSocialMonitor('startup'), 8000);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  // Admin authentication. Bot control APIs are private and require this session.
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const expectedUsername = getAdminUsername();

    if (!process.env.ADMIN_PASSWORD) {
      return res.status(503).json({
        ok: false,
        error: 'ADMIN_PASSWORD_NOT_CONFIGURED',
        message: 'Chưa cấu hình ADMIN_PASSWORD trong file .env.'
      });
    }

    if (username !== expectedUsername || !verifyAdminPassword(String(password || ''))) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS', message: 'Sai tài khoản hoặc mật khẩu.' });
    }

    const payload: AdminSessionPayload = {
      username: expectedUsername,
      exp: Date.now() + AUTH_SESSION_TTL_MS,
      nonce: randomBytes(16).toString('hex')
    };

    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `${AUTH_COOKIE_NAME}=${encodeURIComponent(signSession(payload))}; HttpOnly; Path=/; Max-Age=${Math.floor(AUTH_SESSION_TTL_MS / 1000)}; SameSite=Lax${secure}`
    );

    res.json({ ok: true, username: expectedUsername, expiresAt: payload.exp });
  });

  app.get('/api/auth/me', (req, res) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const session = verifySession(cookies[AUTH_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, authenticated: false });
    res.json({ ok: true, authenticated: true, username: session.username, expiresAt: session.exp });
  });

  app.post('/api/auth/logout', (req, res) => {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `${AUTH_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`
    );
    res.json({ ok: true });
  });

  // Everything under /api/bot is protected from unauthenticated access.
  app.use('/api/bot', requireAdmin);


  // 0. 24/7 Keep-Alive & Uptime Monitor Endpoint
  app.get('/api/health', (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
    res.json({
      ok: true,
      service: 'AegisBot 24/7 Controller & Gateway Engine',
      uptimeSeconds,
      keepAlive: 'active-24-7',
      botGatewayStatus: botConnectionStatus,
      activeVoiceSessions: guildVoiceSessions.size,
      activeCommandsCount: liveConfig.commands.filter((c) => c.enabled).length,
      timestamp: new Date().toISOString()
    });
  });

  // 1. Check live bot status, connected servers & voice channels
  app.get('/api/bot/status', (req, res) => {
    const hasTokenEnv = Boolean(
      process.env.DISCORD_BOT_TOKEN &&
        process.env.DISCORD_BOT_TOKEN.trim() !== '' &&
        process.env.DISCORD_BOT_TOKEN !== 'MY_DISCORD_BOT_TOKEN'
    );
    const clientIdEnv = process.env.DISCORD_CLIENT_ID || '';

    const guilds =
      discordClient && discordClient.isReady()
        ? discordClient.guilds.cache.map((g) => {
            const voiceSession = guildVoiceSessions.get(g.id);
            return {
              id: g.id,
              name: g.name,
              memberCount: g.memberCount,
              icon: g.iconURL() || '🛡️',
              channels: g.channels.cache
                .filter((c) => c.type === ChannelType.GuildText)
                .map((c) => ({ id: c.id, name: c.name, type: 'text' })),
              voiceChannels: g.channels.cache
                .filter((c) => c.isVoiceBased())
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  memberCount: c.members.size
                })),
              roles: g.roles.cache.map((r) => ({
                id: r.id,
                name: r.name,
                color: r.hexColor,
                memberCount: r.members.size,
                hoist: r.hoist
              })),
              members: g.members.cache.map((m) => {
                const xpData = userXPStore.get(`${g.id}:${m.id}`);
                return {
                  id: m.id,
                  username: m.user.username,
                  displayName: m.displayName,
                  avatar: m.user.displayAvatarURL(),
                  isBot: m.user.bot,
                  status: m.presence?.status || 'offline',
                  joinedAt: m.joinedAt?.toLocaleDateString('vi-VN') || '',
                  roles: m.roles.cache.map((r) => r.id),
                  warnings: userWarningStore.get(`${g.id}:${m.id}`) || 0,
                  xp: xpData?.xp || 0,
                  level: xpData?.level || 0
                };
              }),
              activeVoice: voiceSession
                ? {
                    channelId: voiceSession.channelId,
                    channelName: voiceSession.channelName,
                    currentTrack: voiceSession.currentTrack || null,
                    isPaused: voiceSession.isPaused,
                    queue: voiceSession.queue,
                    queueLength: voiceSession.queue.length,
                    volume: voiceSession.volume
                  }
                : null
            };
          })
        : [];

    res.json({
      status: botConnectionStatus,
      hasTokenConfigured: hasTokenEnv,
      clientIdConfigured: clientIdEnv,
      botUser:
        discordClient && discordClient.isReady()
          ? {
              id: discordClient.user.id,
              tag: discordClient.user.tag,
              avatar: discordClient.user.displayAvatarURL(),
              ping: discordClient.ws.ping
            }
          : null,
      guilds,
      error: botConnectionError,
      recentLogs: liveAuditLogs.slice(0, 25),
      socialMonitor: {
        enabled: socialMonitorEnabled(),
        intervalMs: socialMonitorIntervalMs(),
        running: socialMonitorRunning,
        lastResult: lastSocialMonitorResult
      },
      socialFeeds: liveSocialFeeds,
      config: {
        commands: liveConfig.commands,
        autoResponses: liveConfig.autoResponses,
        autoModConfig: liveConfig.autoModConfig,
        joinRoleEnabled: liveConfig.joinRoleEnabled,
        defaultMemberRoleId: liveConfig.defaultMemberRoleId,
        modulesEnabled: liveConfig.modulesEnabled,
        levelRoles: liveConfig.levelRoles,
        reactionRoles: liveConfig.reactionRoles
      }
    });
  });

  // 2. Remote Voice Channel & Music Controller from Web/App Dashboard
  app.post('/api/bot/voice-control', async (req, res) => {
    const { guildId, voiceChannelId, action, query } = req.body;
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({
        ok: false,
        error: 'Bot chưa kết nối Discord Gateway. Hãy kiểm tra DISCORD_BOT_TOKEN.'
      });
    }

    try {
      const targetGuild = guildId
        ? discordClient.guilds.cache.get(guildId)
        : discordClient.guilds.cache.first();

      if (!targetGuild) {
        return res.status(404).json({ ok: false, error: 'Bot chưa tham gia máy chủ Discord nào.' });
      }

      // Controls that operate on an existing session must not require the admin
      // to personally sit in a Voice channel.
      const existingSession = guildVoiceSessions.get(targetGuild.id);

      if (action === 'leave') {
        if (!existingSession) {
          return res.json({ ok: true, message: 'Bot hiện không ở trong kênh Voice nào.' });
        }
        existingSession.player.stop();
        existingSession.connection.destroy();
        guildVoiceSessions.delete(targetGuild.id);
        return res.json({ ok: true, message: 'Bot đã rời khỏi kênh Voice.' });
      }

      if (action === 'pause' || action === 'skip' || action === 'previous' || action === 'prev' || action === 'volume') {
        if (!existingSession) {
          return res.status(404).json({
            ok: false,
            error: 'Bot chưa có phiên Voice đang hoạt động trên máy chủ này.'
          });
        }

        if (action === 'pause') {
          if (!existingSession.currentTrack) {
            return res.status(409).json({ ok: false, error: 'Hiện không có bài hát đang phát.' });
          }
          if (existingSession.isPaused) {
            existingSession.player.unpause();
            existingSession.isPaused = false;
          } else {
            existingSession.player.pause();
            existingSession.isPaused = true;
          }
          return res.json({
            ok: true,
            message: existingSession.isPaused ? 'Đã tạm dừng phát nhạc.' : 'Đã tiếp tục phát nhạc.',
            track: existingSession.currentTrack,
            isPaused: existingSession.isPaused,
            channelName: existingSession.channelName
          });
        }

        if (action === 'skip') {
          const next = existingSession.queue.shift();
          if (next) {
            await playTrackInSession(existingSession, next);
            return res.json({
              ok: true,
              message: `Đã chuyển sang bài: ${next.title}`,
              track: next,
              queued: true,
              queueLength: existingSession.queue.length,
              channelName: existingSession.channelName
            });
          }
          existingSession.player.stop();
          existingSession.currentTrack = null;
          existingSession.currentResource = undefined;
          return res.json({
            ok: true,
            message: 'Đã bỏ qua bài hát hiện tại.',
            track: null,
            queued: false,
            queueLength: 0,
            channelName: existingSession.channelName
          });
        }

        if (action === 'previous' || action === 'prev') {
          const previous = existingSession.history.shift();
          if (!previous) {
            return res.status(409).json({ ok: false, error: 'Chưa có bài hát trước đó trong lịch sử phát.' });
          }
          if (existingSession.currentTrack) existingSession.queue.unshift(existingSession.currentTrack);
          existingSession.currentTrack = null;
          await playTrackInSession(existingSession, previous);
          return res.json({
            ok: true,
            message: `Đã quay lại bài: ${previous.title}`,
            track: previous,
            queueLength: existingSession.queue.length,
            channelName: existingSession.channelName
          });
        }

        const vol = typeof req.body.volume === 'number'
          ? Math.max(0, Math.min(100, req.body.volume))
          : 80;
        existingSession.volume = vol;
        if (existingSession.currentResource?.volume) {
          existingSession.currentResource.volume.setVolume(vol / 100);
        }
        return res.json({
          ok: true,
          message: `Đã chỉnh âm lượng phòng Voice thành ${vol}%.`,
          volume: vol,
          channelName: existingSession.channelName
        });
      }

      // Join/play actions may target a selected Voice channel or fall back to the
      // active Voice channel / existing session.
      const { channel: targetVoice } = await findUserVoiceChannel(
        targetGuild,
        undefined,
        voiceChannelId
      );

      if (!targetVoice) {
        return res.status(404).json({
          ok: false,
          error: 'Không tìm thấy kênh Voice nào trên máy chủ Discord.'
        });
      }

      const session = await ensureVoiceSession(targetGuild, targetVoice);

      if (action === 'join') {
        return res.json({
          ok: true,
          message: `Bot đã nhảy vào kênh thoại 🔊 ${targetVoice.name} thành công!`,
          channelName: targetVoice.name
        });
      }

      if (action === 'play') {
        const track = await resolveAudioStreamForQuery(query || 'Chìm Sâu RPT MCK', 'Web/App Admin');
        if (session.currentTrack) {
          session.queue.push(track);
          return res.json({
            ok: true,
            message: `Đã thêm "${track.title}" vào hàng đợi phòng 🔊 ${targetVoice.name}.`,
            track,
            queued: true,
            queueLength: session.queue.length,
            channelName: targetVoice.name
          });
        }
        await playTrackInSession(session, track);
        return res.json({
          ok: true,
          message: `Đang phát "${track.title}" trực tiếp trong phòng 🔊 ${targetVoice.name}!`,
          track,
          queued: false,
          queueLength: session.queue.length,
          channelName: targetVoice.name
        });
      }

      return res.status(400).json({ ok: false, error: 'Hành động Voice không hợp lệ.' });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi khi điều khiển phòng Voice trên Discord.'
      });
    }
  });

  // 3. Sync configuration from Web Dashboard to Live Bot Engine
  app.post('/api/bot/sync-config', (req, res) => {
    const {
      commands,
      autoResponses,
      autoModConfig,
      joinRoleEnabled,
      modulesEnabled,
      levelRoles,
      reactionRoles,
      youtubeFeeds,
      tiktokFeeds
    } = req.body;
    if (Array.isArray(commands)) liveConfig.commands = commands;
    if (Array.isArray(autoResponses)) liveConfig.autoResponses = autoResponses;
    if (autoModConfig) liveConfig.autoModConfig = autoModConfig;
    if (typeof joinRoleEnabled === 'boolean') liveConfig.joinRoleEnabled = joinRoleEnabled;
    if (modulesEnabled) liveConfig.modulesEnabled = { ...liveConfig.modulesEnabled, ...modulesEnabled };
    if (Array.isArray(levelRoles)) liveConfig.levelRoles = levelRoles;
    if (Array.isArray(reactionRoles)) liveConfig.reactionRoles = reactionRoles;
    if (Array.isArray(youtubeFeeds)) liveSocialFeeds.youtube = youtubeFeeds;
    if (Array.isArray(tiktokFeeds)) liveSocialFeeds.tiktok = tiktokFeeds;

    res.json({
      ok: true,
      message: 'Đã đồng bộ cấu hình, hệ thống lệnh và phân hệ trực tiếp xuống nhân xử lý Bot.'
    });
  });

  // 3b. Runtime Analytics
  app.get('/api/bot/analytics', (req, res) => {
    const guildId = String(req.query.guildId || '');
    const guild = guildId && discordClient?.isReady()
      ? discordClient.guilds.cache.get(guildId)
      : discordClient?.guilds.cache.first();
    const now = Date.now();
    const dayMap = new Map<string, { joins: number; leaves: number }>();
    for (const ts of memberJoinEvents) {
      const key = new Date(ts).toLocaleDateString('vi-VN');
      const bucket = dayMap.get(key) || { joins: 0, leaves: 0 };
      bucket.joins += 1;
      dayMap.set(key, bucket);
    }
    const memberGrowth = Array.from({ length: 30 }, (_, idx) => {
      const d = new Date(now - (29 - idx) * 86400000);
      const key = d.toLocaleDateString('vi-VN');
      const bucket = dayMap.get(key) || { joins: 0, leaves: 0 };
      return { date: key, total: guild?.memberCount || 0, joins: bucket.joins, leaves: bucket.leaves };
    });
    const totalMessages = Math.max(1, Array.from(channelMessageCounts.values()).reduce((sum, n) => sum + n, 0));
    const topChannels = Array.from(channelMessageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, messageCount]) => ({
        name: `#${name}`,
        messageCount,
        percentage: Math.round((messageCount / totalMessages) * 1000) / 10
      }));
    const topMembers = Array.from(userXPStore.values())
      .filter((entry) => !guildId || entry.guildId === guildId)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10)
      .map((entry) => ({
        id: entry.userId,
        name: entry.displayName || entry.username,
        avatar: entry.avatar,
        messages: entry.messages,
        xp: entry.xp
      }));
    res.json({
      ok: true,
      source: 'runtime',
      analytics: {
        memberGrowth,
        hourlyActivity: messageHourlyCounts.map((messages, hour) => ({
          hour,
          messages,
          voiceMinutes: Math.round(voiceHourlyMinutes[hour] * 10) / 10
        })),
        topMembers,
        topChannels,
        modSummary: { ...moderationStats }
      }
    });
  });

  // 3c. Clear runtime audit logs
  app.delete('/api/bot/logs', (req, res) => {
    liveAuditLogs = [];
    res.json({ ok: true, message: 'Đã xóa nhật ký runtime.' });
  });

  // 3d. Real member warning
  app.post('/api/bot/warn-member', async (req, res) => {
    const { guildId, memberId, reason } = req.body || {};
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({ ok: false, error: 'Bot chưa kết nối Discord.' });
    }
    try {
      const targetGuild = guildId ? discordClient.guilds.cache.get(guildId) : discordClient.guilds.cache.first();
      if (!targetGuild) return res.status(404).json({ ok: false, error: 'Không tìm thấy server.' });
      const member = await targetGuild.members.fetch(memberId);
      if (!member) return res.status(404).json({ ok: false, error: 'Không tìm thấy thành viên.' });
      const key = `${targetGuild.id}:${member.id}`;
      const warnings = (userWarningStore.get(key) || 0) + 1;
      userWarningStore.set(key, warnings);
      appendLog({
        actionType: 'MEMBER_WARN',
        executor: { name: 'Web Admin', isBot: false },
        target: { name: member.displayName, id: member.id },
        details: `Cảnh cáo lần ${warnings}: ${reason || 'Vi phạm nội quy máy chủ'}`,
        severity: 'warning'
      });
      return res.json({ ok: true, warnings, message: `Đã cảnh cáo ${member.displayName}. Tổng cảnh cáo: ${warnings}.` });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || 'Không thể cảnh cáo thành viên.' });
    }
  });

  // 3e. Real-time XP Leaderboard
  app.get('/api/bot/leaderboard', (req, res) => {
    const guildId = req.query.guildId as string;
    let list = Array.from(userXPStore.values());
    if (guildId) {
      list = list.filter((d) => d.guildId === guildId);
    }
    list.sort((a, b) => b.xp - a.xp);
    res.json({
      ok: true,
      leaderboard: list.slice(0, 50)
    });
  });

  // 3c. Publish Interactive Auto-Role Buttons to a Discord Channel
  app.post('/api/bot/publish-autorole-buttons', async (req, res) => {
    const { guildId, channelId, title, description, roles } = req.body;
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({ ok: false, error: 'Bot chưa kết nối Discord.' });
    }
    try {
      const targetGuild = guildId ? discordClient.guilds.cache.get(guildId) : discordClient.guilds.cache.first();
      if (!targetGuild) return res.status(404).json({ ok: false, error: 'Không tìm thấy server.' });

      const targetChannel = channelId
        ? targetGuild.channels.cache.get(channelId)
        : targetGuild.channels.cache.find((c) => c.type === ChannelType.GuildText);

      if (!targetChannel || !('send' in targetChannel)) {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy kênh văn bản.' });
      }

      const roleItems =
        Array.isArray(roles) && roles.length > 0
          ? roles
          : targetGuild.roles.cache
              .filter((r) => !r.managed && r.id !== targetGuild.id)
              .first(4)
              .map((r) => ({ roleId: r.id, roleName: r.name, emoji: '✨' }));

      const row = new ActionRowBuilder<ButtonBuilder>();
      roleItems.slice(0, 5).forEach((item: any, idx: number) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`role_toggle_${item.roleId}`)
            .setLabel(`${item.emoji ? item.emoji + ' ' : ''}${item.roleName}`)
            .setStyle(idx % 2 === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
      });

      const emb = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(title || '🎭 Bảng Đăng Ký Vai Trò Tự Động')
        .setDescription(description || 'Bấm vào các nút bấm dưới đây để nhận hoặc gỡ vai trò tương ứng trên máy chủ:')
        .setFooter({ text: 'Nhấn một lần để nhận, nhấn lần nữa để hủy vai trò • AegisBot' });

      await (targetChannel as TextChannel).send({ embeds: [emb], components: [row] });

      return res.json({ ok: true, message: `Đã đăng bảng chọn vai trò thành công vào kênh #${targetChannel.name}!` });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 3d. Test / Push Real Social Alert (YouTube / TikTok)
  app.post('/api/bot/test-social', async (req, res) => {
    const { platform, title, url, targetChannelId } = req.body;
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({ ok: false, error: 'Bot chưa kết nối Discord Gateway.' });
    }
    try {
      let targetChannel: any = targetChannelId ? await discordClient.channels.fetch(targetChannelId).catch(() => null) : null;
      if (!targetChannel) {
        targetChannel = discordClient.channels.cache.find((c) => c.type === ChannelType.GuildText);
      }
      if (!targetChannel || !('send' in targetChannel)) {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy kênh văn bản hợp lệ.' });
      }

      const emb = new EmbedBuilder()
        .setColor(platform === 'youtube' ? 0xff0000 : 0x00f2fe)
        .setTitle(platform === 'youtube' ? '🔔 Video Mới Trên YouTube' : '📱 Clip Mới Trên TikTok')
        .setDescription(`**${title || 'Video mới nhất'}**\n\nXem ngay tại: ${url || 'https://youtube.com'}`)
        .setTimestamp()
        .setFooter({ text: 'AegisBot Live Social Feeds' });

      await targetChannel.send({
        content: `📢 **Thông báo ${platform === 'youtube' ? 'YouTube' : 'TikTok'} mới**!`,
        embeds: [emb]
      });

      appendLog({
        actionType: 'SOCIAL_ALERT',
        executor: { name: 'AegisBot Social Poller', isBot: true },
        details: `Gửi thông báo ${platform.toUpperCase()}: "${title || 'Video mới'}"`,
        severity: 'info',
        channelName: `#${targetChannel.name}`
      });

      return res.json({ ok: true, message: `Đã gửi thông báo thành công vào #${targetChannel.name}!` });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 3e. Run Social Monitor immediately (YouTube/TikTok)
  app.post('/api/bot/social-monitor/check', async (req, res) => {
    const result = await runSocialMonitor('manual');
    return res.json({
      ok: result.errors.length === 0,
      ...result,
      socialFeeds: liveSocialFeeds
    });
  });

  // 4. Reconnect / Retry bot login from environment variables
  app.post('/api/bot/reconnect', async (req, res) => {
    await startDiscordBotIfConfigured();
    res.json({
      status: botConnectionStatus,
      error: botConnectionError
    });
  });

  // 4b. Configure & Save Bot Token / Client ID directly from Web Dashboard
  app.post('/api/bot/configure', async (req, res) => {
    const { token, clientId, defaultMemberRoleId } = req.body;
    if (token) process.env.DISCORD_BOT_TOKEN = token.trim();
    if (clientId) process.env.DISCORD_CLIENT_ID = clientId.trim();
    if (defaultMemberRoleId !== undefined) {
      process.env.DEFAULT_MEMBER_ROLE_ID = defaultMemberRoleId.trim();
      liveConfig.defaultMemberRoleId = defaultMemberRoleId.trim();
    }

    try {
      const envPath = path.join(__dirname, '.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }
      const setEnvVar = (k: string, v: string) => {
        const regex = new RegExp(`^${k}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${k}="${v}"`);
        } else {
          envContent = (envContent.trim() ? envContent.trim() + '\n' : '') + `${k}="${v}"\n`;
        }
      };
      if (process.env.NODE_ENV !== 'production') {
        if (token) setEnvVar('DISCORD_BOT_TOKEN', token.trim());
        if (clientId) setEnvVar('DISCORD_CLIENT_ID', clientId.trim());
        if (defaultMemberRoleId !== undefined) setEnvVar('DEFAULT_MEMBER_ROLE_ID', defaultMemberRoleId.trim());
        fs.writeFileSync(envPath, envContent, 'utf-8');
      }
    } catch (e: any) {
      console.warn('Could not write to .env:', e?.message);
    }

    await startDiscordBotIfConfigured();

    res.json({
      ok: botConnectionStatus === 'connected',
      status: botConnectionStatus,
      error: botConnectionError,
      botUser:
        discordClient && discordClient.isReady()
          ? {
              id: discordClient.user.id,
              tag: discordClient.user.tag,
              avatar: discordClient.user.displayAvatarURL(),
              ping: discordClient.ws.ping
            }
          : null
    });
  });

  // 4c. Moderate real Discord Member (Kick / Ban / Timeout)
  app.post('/api/bot/moderate-member', async (req, res) => {
    const { guildId, memberId, action, reason, durationMinutes } = req.body;
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({ ok: false, error: 'Bot chưa kết nối Discord.' });
    }
    try {
      const targetGuild = guildId ? discordClient.guilds.cache.get(guildId) : discordClient.guilds.cache.first();
      if (!targetGuild) return res.status(404).json({ ok: false, error: 'Không tìm thấy server.' });
      const member = await targetGuild.members.fetch(memberId);
      if (!member) return res.status(404).json({ ok: false, error: 'Không tìm thấy thành viên trong server.' });

      if (action === 'KICK') {
        await member.kick(reason || 'Bị kick từ Web Dashboard');
      } else if (action === 'BAN') {
        await member.ban({ reason: reason || 'Bị ban từ Web Dashboard' });
      } else if (action === 'TIMEOUT') {
        await member.timeout((durationMinutes || 60) * 60 * 1000, reason || 'Bị timeout từ Web Dashboard');
      } else {
        return res.status(400).json({ ok: false, error: 'Hành động moderation không hợp lệ.' });
      }
      appendLog({
        actionType: action === 'KICK' ? 'MEMBER_KICK' : action === 'BAN' ? 'MEMBER_BAN' : 'MEMBER_TIMEOUT',
        executor: { name: 'Web Admin', isBot: false },
        target: { name: member.displayName, id: member.id },
        details: reason || 'Moderation từ Web Dashboard',
        severity: 'danger'
      });
      return res.json({ ok: true, message: `Thực hiện ${action} thành công đối với ${member.displayName}.` });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || 'Lỗi khi thực thi quản lý thành viên.' });
    }
  });

  // 5. Send real message to a connected Discord channel (when Bot is online)
  app.post('/api/bot/send-channel-message', async (req, res) => {
    const { channelId, content, embedTitle, embedDescription, embedColor } = req.body;
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({
        ok: false,
        error: 'Bot chưa ở trạng thái Online. Hãy cấu hình DISCORD_BOT_TOKEN hoặc dùng tính năng bắn Webhook trực tiếp.'
      });
    }

    try {
      const channel = await discordClient.channels.fetch(channelId);
      if (!channel || !('send' in channel)) {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy kênh văn bản hợp lệ trên server.' });
      }

      const embeds: EmbedBuilder[] = [];
      if (embedTitle || embedDescription) {
        const hex = parseInt((embedColor || '#5865F2').replace('#', ''), 16);
        const emb = new EmbedBuilder().setColor(isNaN(hex) ? 0x5865f2 : hex);
        if (embedTitle) emb.setTitle(embedTitle);
        if (embedDescription) emb.setDescription(embedDescription);
        emb.setFooter({ text: 'Gửi trực tiếp từ AegisBot Web Dashboard' });
        embeds.push(emb);
      }

      await (channel as TextChannel).send({
        content: content || undefined,
        embeds: embeds.length > 0 ? embeds : undefined
      });

      appendLog({
        actionType: 'SOCIAL_ALERT',
        executor: { name: 'Web Dashboard', isBot: false },
        details: `Đã gửi tin nhắn trực tiếp tới kênh ID ${channelId}`,
        severity: 'info'
      });

      return res.json({ ok: true, message: 'Đã gửi tin nhắn thành công lên kênh Discord của bạn!' });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || 'Lỗi khi gửi tin nhắn tới Discord' });
    }
  });

  // 6. Send real message via Discord Webhook URL (Instant zero-setup live test on user's server)
  app.post('/api/bot/send-webhook', async (req, res) => {
    const { webhookUrl, username, content, embedTitle, embedDescription, embedColor } = req.body;
    let webhook: URL;
    try {
      webhook = new URL(String(webhookUrl || '').trim());
    } catch {
      return res.status(400).json({ ok: false, error: 'URL Webhook Discord không hợp lệ.' });
    }
    const allowedHosts = new Set(['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com']);
    if (webhook.protocol !== 'https:' || !allowedHosts.has(webhook.hostname) || !webhook.pathname.startsWith('/api/webhooks/')) {
      return res.status(400).json({ ok: false, error: 'URL Webhook Discord không hợp lệ.' });
    }

    try {
      const hex = parseInt((embedColor || '#5865F2').replace('#', ''), 16);
      const payload: any = {
        username: username || 'AegisBot Studio',
        content: content || '🚀 Kết nối thành công từ bảng điều khiển **AegisBot Studio**!'
      };

      if (embedTitle || embedDescription) {
        payload.embeds = [
          {
            title: embedTitle || '🔔 Thông Báo Từ AegisBot Dashboard',
            description: embedDescription || 'Hệ thống thông báo tự động & quản trị máy chủ đã sẵn sàng hoạt động.',
            color: isNaN(hex) ? 5793266 : hex,
            footer: {
              text: 'AegisBot v14 • Real-time Webhook Dispatcher'
            },
            timestamp: new Date().toISOString()
          }
        ];
      }

      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          ok: false,
          error: `Discord từ chối Webhook (${response.status}): ${errText}`
        });
      }

      appendLog({
        actionType: 'SOCIAL_ALERT',
        executor: { name: 'Webhook Dispatcher', isBot: true },
        details: `Đã bắn thông báo thật lên máy chủ Discord qua Webhook: "${embedTitle || content}"`,
        severity: 'info'
      });

      return res.json({
        ok: true,
        message: 'Đã gửi tin nhắn thật vào kênh Discord của bạn thành công! Hãy mở ứng dụng Discord để kiểm tra.'
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Không thể kết nối tới Discord Webhook'
      });
    }
  });

  // Helper to recursively collect all clean project files for GitHub export
  function collectWorkspaceFiles(dirPath: string, baseDir: string): { path: string; size: number; isBinary: boolean }[] {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let results: { path: string; size: number; isBinary: boolean }[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!shouldIncludeFileInGitHubPush(`${relPath}/placeholder.txt`)) continue;
        results = results.concat(collectWorkspaceFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        if (!shouldIncludeFileInGitHubPush(relPath)) continue;
        const stat = fs.statSync(fullPath);
        const isBinary = /\.(png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(relPath);
        results.push({ path: relPath, size: stat.size, isBinary });
      }
    }
    return results;
  }

  // GitHub/project-management APIs are admin-only.
  app.use('/api/github', requireAdmin);

  // 7. List all project files ready for GitHub Push
  app.get('/api/github/project-files', (req, res) => {
    try {
      const files = collectWorkspaceFiles(__dirname, __dirname);
      res.json({
        ok: true,
        totalFiles: files.length,
        files
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Không thể đọc cây thư mục dự án.' });
    }
  });

  // 8. Download full project archive (.tar.gz) excluding node_modules & .env
  app.get('/api/github/download-bundle', (req, res) => {
    try {
      const tmpArchive = '/tmp/aegis-discord-bot-fullstack.tar.gz';
      execFileSync(
        'tar',
        [
          '-czf',
          tmpArchive,
          '--exclude=node_modules',
          '--exclude=dist',
          '--exclude=dev-dist',
          '--exclude=.git',
          '--exclude=.aistudio',
          '--exclude=.playwright',
          '--exclude=.env',
          '--exclude=.env.local',
          '--exclude=bun.lock',
          '.'
        ],
        { cwd: __dirname }
      );
      res.download(tmpArchive, 'aegis-discord-bot-fullstack.tar.gz');
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Lỗi khi nén dự án.' });
    }
  });

  // 9. 1-Click Push Entire Project to User's GitHub Account via GitHub REST API
  app.post('/api/github/push-project', async (req, res) => {
    const {
      githubToken,
      repoName,
      description = 'AegisBot - Full-Stack Discord.js v14 Bot (Voice 24/7, Auto-Mod, Auto-Responder & Web/PWA Dashboard)',
      isPrivate = false
    } = req.body;

    const token = (githubToken || process.env.GITHUB_TOKEN || '').trim();
    if (!token) {
      return res.status(400).json({
        ok: false,
        error: 'Vui lòng nhập GitHub Personal Access Token (PAT) có quyền "repo" để đẩy code lên GitHub.'
      });
    }

    const cleanRepo = sanitizeRepoName(repoName || 'aegis-discord-bot');
    const ghHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'AegisBot-Studio-Publisher'
    };

    try {
      // Step 1: Verify GitHub user
      const userRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
      if (!userRes.ok) {
        return res.status(401).json({
          ok: false,
          error: 'GitHub Token không hợp lệ hoặc đã hết hạn. Hãy kiểm tra lại Personal Access Token.'
        });
      }
      const userData: any = await userRes.json();
      const owner = userData.login;

      // Step 2: Check if repository exists; if not, create it with auto_init: true so main branch exists
      let repoCheck = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers: ghHeaders
      });

      if (repoCheck.status === 404) {
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify({
            name: cleanRepo,
            description,
            private: Boolean(isPrivate),
            auto_init: true
          })
        });

        if (!createRes.ok) {
          const errBody: any = await createRes.json().catch(() => ({}));
          return res.status(createRes.status).json({
            ok: false,
            error: `Không thể tạo repository trên GitHub: ${errBody.message || createRes.statusText}`
          });
        }
        // Wait briefly for GitHub to initialize main branch
        await new Promise((r) => setTimeout(r, 1200));
        repoCheck = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
          headers: ghHeaders
        });
      }

      const repoData: any = await repoCheck.json();
      const defaultBranch = repoData.default_branch || 'main';

      // Step 3: Get latest commit SHA on defaultBranch (or initialize README if empty repo)
      let refRes = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepo}/git/ref/heads/${defaultBranch}`,
        { headers: ghHeaders }
      );

      if (!refRes.ok) {
        // Repo exists but is completely empty — create initial README via Contents API
        const readmeInit = Buffer.from('# AegisBot Full-Stack Discord Bot\n').toString('base64');
        await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/README.md`, {
          method: 'PUT',
          headers: ghHeaders,
          body: JSON.stringify({
            message: 'Initial commit',
            content: readmeInit,
            branch: defaultBranch
          })
        });
        await new Promise((r) => setTimeout(r, 1000));
        refRes = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepo}/git/ref/heads/${defaultBranch}`,
          { headers: ghHeaders }
        );
      }

      const refData: any = await refRes.json();
      const latestCommitSha = refData.object?.sha;

      // Step 4: Create Git Blobs for all workspace files
      const projectFiles = collectWorkspaceFiles(__dirname, __dirname);
      const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];

      for (const fileInfo of projectFiles) {
        const fullFilePath = path.join(__dirname, fileInfo.path);
        const rawBuffer = fs.readFileSync(fullFilePath);
        const base64Content = rawBuffer.toString('base64');

        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/blobs`, {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify({
            content: base64Content,
            encoding: 'base64'
          })
        });

        if (blobRes.ok) {
          const blobData: any = await blobRes.json();
          treeItems.push({
            path: fileInfo.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha
          });
        }
      }

      // Step 5: Create Git Tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees`, {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          base_tree: latestCommitSha,
          tree: treeItems
        })
      });

      if (!treeRes.ok) {
        const treeErr: any = await treeRes.json().catch(() => ({}));
        return res.status(treeRes.status).json({
          ok: false,
          error: `Lỗi khi tạo Git Tree: ${treeErr.message || treeRes.statusText}`
        });
      }

      const treeData: any = await treeRes.json();

      // Step 6: Create Git Commit
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/commits`, {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          message: '🚀 Deploy full-stack AegisBot Discord Bot v14 + Web/PWA Controller',
          tree: treeData.sha,
          parents: latestCommitSha ? [latestCommitSha] : []
        })
      });

      const commitData: any = await commitRes.json();

      // Step 7: Update branch reference to point to new commit
      await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/refs/heads/${defaultBranch}`, {
        method: 'PATCH',
        headers: ghHeaders,
        body: JSON.stringify({
          sha: commitData.sha,
          force: true
        })
      });

      const repoUrl = `https://github.com/${owner}/${cleanRepo}`;

      appendLog({
        actionType: 'ROLE_UPDATE',
        executor: { name: owner, isBot: false },
        details: `Đã đẩy toàn bộ ${treeItems.length} tệp dự án lên GitHub: ${repoUrl}`,
        severity: 'info'
      });

      return res.json({
        ok: true,
        repoUrl,
        owner,
        repoName: cleanRepo,
        branch: defaultBranch,
        filesCount: treeItems.length,
        message: `Đã đẩy thành công toàn bộ ${treeItems.length} tệp mã nguồn lên ${repoUrl}!`
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi kết nối tới GitHub API.'
      });
    }
  });

  // Legacy controller path: keep a single source of truth for the Admin Web UI.
  app.get('/control', (req, res) => {
    res.redirect(302, '/');
  });

  // Serve static public assets
  app.use('/public', express.static(path.join(__dirname, 'public')));

  // Start Discord Bot if token is configured in environment
  startDiscordBotIfConfigured();
  // Start the real YouTube/TikTok notification monitor after the API is ready.
  startSocialMonitor();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const staticOptions = {
      setHeaders: (res: express.Response, filePath: string) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    };
    app.use(express.static(distPath, staticOptions));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AegisBot Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
