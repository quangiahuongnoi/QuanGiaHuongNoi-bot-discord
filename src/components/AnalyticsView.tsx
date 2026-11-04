import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Mic, 
  ShieldCheck, 
  Calendar,
  Flame,
  Award
} from 'lucide-react';
import { ServerAnalyticsData, GuildInfo } from '../bot/types';

interface AnalyticsViewProps {
  analytics: ServerAnalyticsData;
  guild: GuildInfo;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  guild
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/api/bot/leaderboard?guildId=${guild.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
          setLiveLeaderboard(data.leaderboard);
        }
      })
      .catch(() => {});
  }, [guild.id]);

  const displayMembers =
    liveLeaderboard.length > 0
      ? liveLeaderboard.slice(0, 4).map((d) => ({
          id: d.userId,
          name: d.displayName || d.username,
          avatar: d.avatar,
          messages: d.messages,
          xp: d.xp
        }))
      : analytics.topMembers;

  const maxHourlyMessages = Math.max(...analytics.hourlyActivity.map(h => h.messages), 1);
  const maxHourlyVoice = Math.max(...analytics.hourlyActivity.map(h => h.voiceMinutes), 1);

  return (
    <div className="space-y-6">
      {/* Header and Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Phân Tích Dữ Liệu Server Chuyên Sâu</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              Realtime Telemetry
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi biểu đồ tăng trưởng thành viên, lưu lượng tin nhắn theo giờ và bảng xếp hạng thành viên tích cực
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '7d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Ngày Qua
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '30d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            30 Ngày Qua
          </button>
        </div>
      </div>

      {/* Top Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tăng Trưởng Thành Viên</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              +62
            </span>
            <span className="text-xs text-emerald-400 font-medium">+3.5% tuần này</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tổng cộng: <strong className="text-slate-300 font-mono">{guild.memberCount}</strong> thành viên
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Khung Giờ Nhộn Nhịp Nhất</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              20:00 - 22:00
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Đạt đỉnh <strong className="text-slate-300 font-mono">1,320 tin nhắn/giờ</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tổng Giờ Phòng Thoại (Voice)</span>
            <Mic className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              182.5 giờ
            </span>
            <span className="text-xs text-indigo-400 font-medium">+14% so với tuần trước</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Chủ yếu tại <strong className="text-slate-300">Phòng Voice 01</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Hiệu Quả Auto-Mod</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              99.8%
            </span>
            <span className="text-xs text-emerald-400 font-medium">Bảo vệ tự động</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Đã chặn <strong className="text-slate-300">42 link mời spam</strong>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 24h Activity Distribution Heatmap (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Lưu Lượng Hoạt Động Theo Khung Giờ (24h)</h3>
              <p className="text-xs text-slate-400">Số lượng tin nhắn và phút đàm thoại voice theo thời gian trong ngày</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
                <span>Tin Nhắn Chat</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                <span>Phút Voice</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-1 sm:gap-2">
              {analytics.hourlyActivity.map((item) => {
                const msgHeight = Math.max(10, Math.round((item.messages / maxHourlyMessages) * 100));
                const voiceHeight = Math.max(8, Math.round((item.voiceMinutes / maxHourlyVoice) * 100));
                return (
                  <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      <div
                        className="w-1/2 bg-indigo-600 group-hover:bg-indigo-400 rounded-t transition-all"
                        style={{ height: `${msgHeight}%` }}
                        title={`${item.hour}:00 - ${item.messages} tin nhắn`}
                      />
                      <div
                        className="w-1/2 bg-emerald-600 group-hover:bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${voiceHeight}%` }}
                        title={`${item.hour}:00 - ${item.voiceMinutes} phút voice`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 tabular-nums">
                      {item.hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Channels Breakdown & Mod Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Channels */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Kênh Trò Chuyện Hoạt Động Nhất</h3>
            <div className="space-y-3 pt-1">
              {analytics.topChannels.map((ch) => (
                <div key={ch.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300 font-mono">{ch.name}</span>
                    <span className="text-slate-400 font-mono tabular-nums">
                      {ch.messageCount.toLocaleString()} ({ch.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation Actions Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Tổng Hợp Xử Phạt Trong Tuần</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                  {analytics.modSummary.warns}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cảnh Cáo</div>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-lg font-bold text-purple-400 font-mono tabular-nums">
                  {analytics.modSummary.timeouts}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Timeout</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-lg font-bold text-blue-400 font-mono tabular-nums">
                  {analytics.modSummary.kicks}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kick</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-lg font-bold text-rose-400 font-mono tabular-nums">
                  {analytics.modSummary.bans}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ban</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Active Members Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Bảng Xếp Hạng Thành Viên Tích Cực Nhất (Leaderboard)</span>
            </h3>
            <p className="text-xs text-slate-400">Xếp hạng dựa trên tần suất tương tác, tin nhắn gửi và điểm XP tích lũy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayMembers.map((member, idx) => (
            <div
              key={member.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3"
            >
              <div className="w-7 text-center font-bold font-mono text-sm shrink-0">
                {idx === 0 && <span className="text-amber-400">#1</span>}
                {idx === 1 && <span className="text-slate-300">#2</span>}
                {idx === 2 && <span className="text-amber-600">#3</span>}
                {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
              </div>

              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0">
                <img src={member.avatar} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="truncate flex-1">
                <div className="font-semibold text-xs text-white truncate">{member.name}</div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {member.messages.toLocaleString()} tin nhắn
                </div>
                <div className="text-[10px] text-indigo-400 font-mono font-medium">
                  {member.xp.toLocaleString()} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
