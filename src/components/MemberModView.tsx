import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Search, 
  AlertTriangle, 
  Clock, 
  UserX, 
  Ban, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck,
  Lock,
  Sparkles
} from 'lucide-react';
import { Member, GuildInfo } from '../bot/types';
import { AutoModConfig } from '../bot/logic/moderationRules';

interface MemberModViewProps {
  members: Member[];
  autoModConfig: AutoModConfig;
  onUpdateAutoMod: (config: AutoModConfig) => void;
  onWarnMember: (memberId: string, reason: string) => void | Promise<boolean>;
  onTimeoutMember: (memberId: string, durationMinutes: number, reason: string) => void | Promise<boolean>;
  onKickMember: (memberId: string, reason: string) => void | Promise<boolean>;
  onBanMember: (memberId: string, reason: string) => void | Promise<boolean>;
  guild: GuildInfo;
}

export const MemberModView: React.FC<MemberModViewProps> = ({
  members,
  autoModConfig,
  onUpdateAutoMod,
  onWarnMember,
  onTimeoutMember,
  onKickMember,
  onBanMember,
  guild
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'automod'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newBannedWord, setNewBannedWord] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [actionType, setActionType] = useState<'WARN' | 'TIMEOUT' | 'KICK' | 'BAN' | null>(null);
  const [actionReason, setActionReason] = useState('Vi phạm nội quy máy chủ');
  const [timeoutMinutes, setTimeoutMinutes] = useState(60);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'warned') return m.warnings > 0;
    if (statusFilter === 'timed_out') return !!m.isTimedOut;
    return m.status === statusFilter;
  });

  const handleExecuteModAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !actionType) return;

    let ok = false;
    if (actionType === 'WARN') {
      ok = (await onWarnMember(selectedMember.id, actionReason)) !== false;
    } else if (actionType === 'TIMEOUT') {
      ok = (await onTimeoutMember(selectedMember.id, timeoutMinutes, actionReason)) !== false;
    } else if (actionType === 'KICK') {
      ok = (await onKickMember(selectedMember.id, actionReason)) !== false;
    } else if (actionType === 'BAN') {
      ok = (await onBanMember(selectedMember.id, actionReason)) !== false;
    }

    if (!ok) {
      setActionSuccessNotice('⚠️ Discord không xác nhận được thao tác. Kiểm tra quyền Bot và thử lại.');
      setTimeout(() => setActionSuccessNotice(null), 3500);
      return;
    }

    const label = actionType === 'WARN' ? 'cảnh cáo' : actionType === 'TIMEOUT' ? `timeout ${timeoutMinutes} phút` : actionType === 'KICK' ? 'kick' : 'ban vĩnh viễn';
    setActionSuccessNotice(`✅ Đã ${label} ${selectedMember.displayName}.`);
    setActionType(null);
    setSelectedMember(null);
    setTimeout(() => setActionSuccessNotice(null), 3000);
  };

  const handleAddBannedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannedWord.trim()) return;
    const word = newBannedWord.trim().toLowerCase();
    if (!autoModConfig.blacklistedWords.includes(word)) {
      onUpdateAutoMod({
        ...autoModConfig,
        blacklistedWords: [...autoModConfig.blacklistedWords, word]
      });
    }
    setNewBannedWord('');
  };

  const handleRemoveBannedWord = (wordToRemove: string) => {
    onUpdateAutoMod({
      ...autoModConfig,
      blacklistedWords: autoModConfig.blacklistedWords.filter(w => w !== wordToRemove)
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Quản Lý Thành Viên & Hệ Thống Auto-Mod</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              Bảo Mật Cấp 2
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát danh sách thành viên, áp dụng lệnh xử phạt và cấu hình bộ lọc chống phá hoại
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thành Viên ({members.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automod')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'automod'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Quy Tắc Auto-Mod</span>
          </button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* TAB 1: MEMBERS ROSTER */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thành viên theo tên hoặc username..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="online">Đang Online</option>
              <option value="warned">Có Cảnh Cáo (&gt; 0)</option>
              <option value="timed_out">Đang Bị Timeout</option>
            </select>
          </div>

          {/* Members Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-[11px] uppercase">
                    <th className="py-3 px-4">Thành Viên</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Cấp Độ / XP</th>
                    <th className="py-3 px-4">Cảnh Cáo</th>
                    <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Avatar and name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                                {member.displayName[0]}
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                              <span>{member.displayName}</span>
                              {member.isBot && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1 py-0.2 rounded font-bold">
                                  BOT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              @{member.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.status === 'online'
                                ? 'bg-emerald-500'
                                : member.status === 'idle'
                                ? 'bg-amber-500'
                                : member.status === 'dnd'
                                ? 'bg-rose-500'
                                : 'bg-slate-500'
                            }`}
                          />
                          <span className="capitalize text-slate-300 text-[11px]">
                            {member.status}
                          </span>
                          {member.isTimedOut && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-medium border border-rose-500/30">
                              Timeout
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Level / XP */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-300 tabular-nums">
                          Level {member.level} · {member.xp.toLocaleString()} XP
                        </div>
                      </td>

                      {/* Warnings */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                            member.warnings === 0
                              ? 'bg-slate-800 text-slate-400'
                              : member.warnings < 3
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {member.warnings} cảnh cáo
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(member);
                              setActionType('WARN');
                            }}
                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium transition-colors"
                            title="Gửi Cảnh Cáo"
                          >
                            Cảnh Cáo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(member);
                              setActionType('TIMEOUT');
                            }}
                            className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[11px] font-medium transition-colors"
                            title="Timeout / Cách Ly"
                          >
                            Timeout
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(member);
                              setActionType('KICK');
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                            title="Kick khỏi server"
                          >
                            Kick
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(member);
                              setActionType('BAN');
                            }}
                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-medium transition-colors"
                            title="Cấm vĩnh viễn (Ban)"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMOD & SECURITY POLICIES */}
      {activeTab === 'automod' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rules Toggles Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Chính Sách Kiểm Duyệt Tự Động (Auto-Mod Shield)</span>
            </h3>

            {/* Anti-Invite */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-white">Chặn Link Mời Discord Khác (Anti-Invite)</div>
                <div className="text-[11px] text-slate-400">Tự động xóa tin nhắn chứa discord.gg và cảnh cáo người gửi</div>
              </div>
              <input
                type="checkbox"
                checked={autoModConfig.antiInviteEnabled}
                onChange={(e) => onUpdateAutoMod({ ...autoModConfig, antiInviteEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Anti-Spam Characters */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Chống Lặp Ký Tự Liên Tục (Anti-Spam)</div>
                  <div className="text-[11px] text-slate-400">Ngăn chặn spam chữ kéo dài (ví dụ: "chaoooooooooooo")</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoModConfig.antiSpamEnabled}
                  onChange={(e) => onUpdateAutoMod({ ...autoModConfig, antiSpamEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
              </div>
              {autoModConfig.antiSpamEnabled && (
                <div className="flex items-center gap-3 pt-2 text-xs text-slate-300">
                  <span>Số ký tự lặp tối đa cho phép:</span>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={autoModConfig.maxDuplicateChars}
                    onChange={(e) => onUpdateAutoMod({ ...autoModConfig, maxDuplicateChars: Number(e.target.value) })}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                  />
                </div>
              )}
            </div>

            {/* Anti-Mass Mention */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Chống Mass Mention (Tag Hàng Loạt)</div>
                  <div className="text-[11px] text-slate-400">Tự động timeout khi có người tag quá nhiều thành viên hoặc @everyone</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoModConfig.antiMassMentionEnabled}
                  onChange={(e) => onUpdateAutoMod({ ...autoModConfig, antiMassMentionEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
              </div>
              {autoModConfig.antiMassMentionEnabled && (
                <div className="flex items-center gap-3 pt-2 text-xs text-slate-300">
                  <span>Số lượt mention tối đa mỗi tin:</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={autoModConfig.maxMentionsAllowed}
                    onChange={(e) => onUpdateAutoMod({ ...autoModConfig, maxMentionsAllowed: Number(e.target.value) })}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Word Blacklist Editor Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Từ Điển Từ Cấm (Word Blacklist)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {autoModConfig.blacklistedWords.length} từ khóa cấm
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Bot sẽ tự động thu hồi tin nhắn và gửi cảnh cáo riêng cho người dùng vi phạm khi xuất hiện các từ này trong kênh trò chuyện.
            </p>

            {/* Add Banned Word Form */}
            <form onSubmit={handleAddBannedWord} className="flex gap-2">
              <input
                type="text"
                value={newBannedWord}
                onChange={(e) => setNewBannedWord(e.target.value)}
                placeholder="Nhập từ cấm mới (ví dụ: 'hack_token', 'scam')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Từ</span>
              </button>
            </form>

            {/* Banned Words Pills */}
            <div className="flex flex-wrap gap-2 pt-2 max-h-56 overflow-y-auto">
              {autoModConfig.blacklistedWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-mono"
                >
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBannedWord(word)}
                    className="hover:text-white"
                    title="Xóa từ khỏi danh sách"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Moderation Action Modal */}
      {actionType && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  {actionType === 'WARN' && 'Gửi Cảnh Cáo Thành Viên'}
                  {actionType === 'TIMEOUT' && 'Áp Dụng Timeout / Cách Ly'}
                  {actionType === 'KICK' && 'Trục Xuất Thành Viên (Kick)'}
                  {actionType === 'BAN' && 'Cấm Vĩnh Viễn (Ban)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteModAction} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 shrink-0">
                  <img src={selectedMember.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{selectedMember.displayName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">@{selectedMember.username}</div>
                </div>
              </div>

              {actionType === 'TIMEOUT' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Thời Lượng Timeout
                  </label>
                  <select
                    value={timeoutMinutes}
                    onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value={5}>5 Phút</option>
                    <option value={60}>1 Giờ</option>
                    <option value={1440}>24 Giờ (1 Ngày)</option>
                    <option value={10080}>7 Ngày</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Lý Do Xử Phạt
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Nhập lý do gửi cảnh cáo hoặc xử phạt..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm ${
                    actionType === 'BAN'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  Xác Nhận Xử Lý
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
