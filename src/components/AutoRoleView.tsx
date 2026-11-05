import React, { useState } from 'react';
import { 
  UserCheck, 
  Sparkles, 
  Award, 
  Plus, 
  Trash2, 
  Shield, 
  Check, 
  MousePointerClick,
  Sliders,
  Send
} from 'lucide-react';
import { ReactionRoleGroup, GuildInfo } from '../bot/types';
import { LevelRoleRule } from '../bot/logic/roleEngine';

interface AutoRoleViewProps {
  reactionRoleGroups: ReactionRoleGroup[];
  levelRoles: LevelRoleRule[];
  joinRoleEnabled: boolean;
  onToggleJoinRole: (enabled: boolean) => void;
  onAddReactionRoleGroup: (group: ReactionRoleGroup) => void;
  onRemoveReactionRoleGroup: (groupId: string) => void;
  onAddLevelRole: (rule: LevelRoleRule) => void;
  onRemoveLevelRole: (roleId: string) => void;
  guild: GuildInfo;
}

export const AutoRoleView: React.FC<AutoRoleViewProps> = ({
  reactionRoleGroups,
  levelRoles,
  joinRoleEnabled,
  onToggleJoinRole,
  onAddReactionRoleGroup,
  onRemoveReactionRoleGroup,
  onAddLevelRole,
  onRemoveLevelRole,
  guild
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'buttons' | 'level'>('buttons');
  const [clickedRolesNotice, setClickedRolesNotice] = useState<string | null>(null);

  // Form state for adding level role
  const [newLevelReq, setNewLevelReq] = useState(10);
  const [newLevelRoleId, setNewLevelRoleId] = useState('');
  const [newLevelRoleName, setNewLevelRoleName] = useState('');
  const [newGroupTitle, setNewGroupTitle] = useState('🎭 Chọn Vai Trò');
  const [newGroupDescription, setNewGroupDescription] = useState('Bấm nút để nhận hoặc gỡ vai trò.');
  const [newGroupChannelId, setNewGroupChannelId] = useState('');
  const [newGroupItems, setNewGroupItems] = useState<ReactionRoleGroup['items']>([]);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleEmoji, setNewRoleEmoji] = useState('✨');

  // Backend data can be empty/malformed while the bot is reconnecting. Normalize it
  // here so this view can never crash the whole dashboard because of a bad role payload.
  const safeReactionRoleGroups = Array.isArray(reactionRoleGroups)
    ? reactionRoleGroups.filter(Boolean).map((group) => ({
        ...group,
        items: Array.isArray(group.items) ? group.items.filter(Boolean) : []
      }))
    : [];
  const safeLevelRoles = Array.isArray(levelRoles) ? levelRoles.filter(Boolean) : [];

  const handleTestClickButtonRole = (roleName: string) => {
    setClickedRolesNotice(`Nút bấm vai trò "${roleName}" hoạt động tốt!`);
    setTimeout(() => setClickedRolesNotice(null), 2500);
  };

  const availableRoles = (guild.roles || []).filter((role) => role.id !== guild.id);
  const textChannels = (guild.channels || []).filter((channel) => channel.type === 'text');

  const handleAddGroupRole = () => {
    const role = availableRoles.find((item) => item.id === newRoleId);
    if (!role || newGroupItems.some((item) => item.roleId === role.id)) return;
    setNewGroupItems((prev) => [...prev, { roleId: role.id, roleName: role.name, emoji: newRoleEmoji.trim() || '✨', color: role.color || '#5865F2', description: `Nhận vai trò ${role.name}` }]);
    setNewRoleId('');
  };

  const handleCreateReactionGroup = () => {
    if (!newGroupTitle.trim() || newGroupItems.length === 0) return;
    onAddReactionRoleGroup({ id: `rr-${Date.now()}`, title: newGroupTitle.trim(), description: newGroupDescription.trim(), channelId: newGroupChannelId || textChannels[0]?.id || '', type: 'BUTTON', items: newGroupItems });
    setNewGroupItems([]);
    setNewGroupTitle('🎭 Chọn Vai Trò');
    setNewGroupDescription('Bấm nút để nhận hoặc gỡ vai trò.');
  };

  const handlePublishButtons = async (group: ReactionRoleGroup) => {
    try {
      const res = await fetch('/api/bot/publish-autorole-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: guild.id,
          title: group.title,
          description: group.description,
          channelId: group.channelId,
          roles: group.items
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setClickedRolesNotice(data.message);
      } else {
        setClickedRolesNotice(`⚠️ ${data.error || 'Bot chưa kết nối để đăng nút lên Discord.'}`);
      }
    } catch {
      setClickedRolesNotice('Không thể gửi yêu cầu đăng nút bấm tới server.');
    }
    setTimeout(() => setClickedRolesNotice(null), 4000);
  };

  const handleCreateLevelRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelRoleId || !newLevelRoleName.trim()) return;
    onAddLevelRole({
      levelRequired: newLevelReq,
      roleId: newLevelRoleId,
      roleName: newLevelRoleName.trim()
    });
    setNewLevelRoleId('');
    setNewLevelRoleName('');
    setNewLevelReq(prev => prev + 5);
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Cấp Quyền & Vai Trò Tự Động (Auto-Role)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30">
              Role Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tự động gán vai trò khi vào server, tạo bảng chọn nút tương tác và thưởng vai trò theo cấp bậc trò chuyện
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'buttons'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Nút Chọn Vai Trò</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Cấp Khi Gia Nhập</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('level')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'level'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Vai Trò Theo Level</span>
          </button>
        </div>
      </div>

      {clickedRolesNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{clickedRolesNotice}</span>
        </div>
      )}

      {/* TAB 1: BUTTON / REACTION ROLES */}
      {activeTab === 'buttons' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeReactionRoleGroups.map((group) => (
              <div key={group.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{group.title}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {group.type}
                  </span>
                </div>

                {/* Interactive Discord Buttons Preview */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-mono">
                    Mô phỏng tin nhắn Discord với Button tương tác:
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item.roleId}
                        type="button"
                        onClick={() => handleTestClickButtonRole(item.roleName)}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white flex items-center gap-2 font-medium transition-transform active:scale-95 shadow-sm"
                        style={{ borderLeftColor: item.color, borderLeftWidth: 3 }}
                      >
                        <span className="text-base">{item.emoji}</span>
                        <span>{item.roleName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Kênh hiển thị: <strong className="text-indigo-400">{textChannels.find(c => c.id === group.channelId)?.name ? '#' + textChannels.find(c => c.id === group.channelId)?.name : 'kênh mặc định'}</strong></span>
                  <button
                    type="button"
                    onClick={() => handlePublishButtons(group)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Đăng Lên Kênh Discord Thật</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div><h3 className="text-sm font-bold text-white">Tạo Bảng Chọn Vai Trò Mới</h3><p className="text-xs text-slate-400 mt-1">Chọn role thật trên Discord, thêm emoji và kênh đăng.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newGroupTitle} onChange={e => setNewGroupTitle(e.target.value)} placeholder="Tiêu đề bảng" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              <select value={newGroupChannelId} onChange={e => setNewGroupChannelId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"><option value="">Kênh text đầu tiên</option>{textChannels.map(ch => <option key={ch.id} value={ch.id}>#{ch.name}</option>)}</select>
            </div>
            <input value={newGroupDescription} onChange={e => setNewGroupDescription(e.target.value)} placeholder="Mô tả" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={newRoleId} onChange={e => setNewRoleId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"><option value="">Chọn role để thêm</option>{availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <input value={newRoleEmoji} onChange={e => setNewRoleEmoji(e.target.value)} maxLength={4} className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white text-center" />
              <button type="button" onClick={handleAddGroupRole} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold">+ Thêm</button>
            </div>
            {newGroupItems.length > 0 && <div className="flex flex-wrap gap-2">{newGroupItems.map(item => <button type="button" key={item.roleId} onClick={() => setNewGroupItems(prev => prev.filter(x => x.roleId !== item.roleId))} className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200">{item.emoji} {item.roleName} ×</button>)}</div>}
            <button type="button" disabled={!newGroupItems.length || !newGroupTitle.trim()} onClick={handleCreateReactionGroup} className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold">Tạo & Lưu Bảng Vai Trò</button>
          </div>
        </div>
      )}

      {/* TAB 2: JOIN AUTO-ROLE */}
      {activeTab === 'join' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Tự Động Gán Vai Trò Khi Gia Nhập</h3>
              <p className="text-xs text-slate-400">
                Gán vai trò ngay lập tức cho người dùng mới khi tham gia máy chủ
              </p>
            </div>
            <input
              type="checkbox"
              checked={joinRoleEnabled}
              onChange={(e) => onToggleJoinRole(e.target.checked)}
              className="w-5 h-5 rounded text-indigo-600 bg-slate-950 border-slate-800"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vai Trò Dành Cho Người Dùng Mới (Members)
              </label>
              <select value={(guild as any).defaultMemberRoleId || ''} onChange={e => window.dispatchEvent(new CustomEvent('qghn:default-member-role', { detail: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                <option value="">Không cấp role</option>
                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vai Trò Dành Cho Bot Mới Mời (Bots)
              </label>
              <select value={(guild as any).defaultBotRoleId || ''} onChange={e => window.dispatchEvent(new CustomEvent('qghn:default-bot-role', { detail: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                <option value="">Không cấp role cho bot</option>
                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEVEL ROLES */}
      {activeTab === 'level' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-1">Cột Mốc Thưởng Vai Trò Theo Cấp</h3>
              <p className="text-xs text-slate-400 mb-4">
                Khi thành viên tích lũy đủ điểm kinh nghiệm (XP) qua việc nhắn tin và voice, bot sẽ tự động thăng cấp và gán vai trò tương ứng.
              </p>

              <div className="space-y-2">
                {safeLevelRoles.map((lr) => (
                  <div
                    key={lr.roleId}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tabular-nums">
                        Level {lr.levelRequired}
                      </span>
                      <span className="font-semibold text-slate-200">{lr.roleName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveLevelRole(lr.roleId)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Xóa cột mốc"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={handleCreateLevelRole} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Thêm Cột Mốc Cấp Mới</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Yêu Cầu Cấp Độ (Level)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newLevelReq}
                  onChange={(e) => setNewLevelReq(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên Vai Trò Thưởng
                </label>
                <input
                  type="text"
                  required
                  value={newLevelRoleName}
                  onChange={(e) => setNewLevelRoleName(e.target.value)}
                  placeholder="Ví dụ: 🏆 Kim Cương Trò Chuyện"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Thêm Cột Mốc Thưởng
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
