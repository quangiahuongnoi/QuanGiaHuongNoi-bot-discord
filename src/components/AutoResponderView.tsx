import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Play, 
  Check, 
  AlertCircle,
  HelpCircle,
  Terminal,
  MessageSquare
} from 'lucide-react';
import { AutoResponseRule, MatchType, matchAutoResponse } from '../bot/logic/autoResponder';
import { GuildInfo } from '../bot/types';

interface AutoResponderViewProps {
  rules: AutoResponseRule[];
  onSaveRule: (rule: AutoResponseRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  guild: GuildInfo;
}

export const AutoResponderView: React.FC<AutoResponderViewProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  guild
}) => {
  const [editingRule, setEditingRule] = useState<AutoResponseRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testInput, setTestInput] = useState('xin chào bot');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testMatchedRule, setTestMatchedRule] = useState<AutoResponseRule | null>(null);

  // Form states for creating/editing
  const [trigger, setTrigger] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('CONTAINS');
  const [response, setResponse] = useState('');
  const [replyType, setReplyType] = useState<'REPLY' | 'MENTION' | 'DM'>('REPLY');
  const [cooldown, setCooldown] = useState(5);
  const [useEmbed, setUseEmbed] = useState(false);
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDesc, setEmbedDesc] = useState('');
  const [embedColor, setEmbedColor] = useState('#5865F2');
  const [embedFooter, setEmbedFooter] = useState('');

  const openCreateModal = () => {
    setEditingRule(null);
    setTrigger('');
    setMatchType('CONTAINS');
    setResponse('Chào {user}! Tôi là AegisBot, rất hân hạnh được hỗ trợ bạn.');
    setReplyType('REPLY');
    setCooldown(5);
    setUseEmbed(false);
    setEmbedTitle('');
    setEmbedDesc('');
    setEmbedColor('#5865F2');
    setEmbedFooter('');
    setIsModalOpen(true);
  };

  const openEditModal = (rule: AutoResponseRule) => {
    setEditingRule(rule);
    setTrigger(rule.trigger);
    setMatchType(rule.matchType);
    setResponse(rule.response);
    setReplyType(rule.replyType);
    setCooldown(rule.cooldownSeconds || 0);
    setUseEmbed(!!rule.embed);
    setEmbedTitle(rule.embed?.title || '');
    setEmbedDesc(rule.embed?.description || '');
    setEmbedColor(rule.embed?.color || '#5865F2');
    setEmbedFooter(rule.embed?.footer || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trigger.trim() || !response.trim()) return;

    const newRule: AutoResponseRule = {
      id: editingRule ? editingRule.id : `ar-${Date.now()}`,
      trigger: trigger.trim(),
      matchType,
      response: response.trim(),
      replyType,
      enabled: editingRule ? editingRule.enabled : true,
      cooldownSeconds: cooldown,
      embed: useEmbed
        ? {
            title: embedTitle.trim() || undefined,
            description: embedDesc.trim() || undefined,
            color: embedColor,
            footer: embedFooter.trim() || undefined
          }
        : undefined
    };

    onSaveRule(newRule);
    setIsModalOpen(false);
  };

  const runTest = () => {
    const res = matchAutoResponse(testInput, rules, {
      authorId: '123456789',
      authorName: 'Hoàng Long',
      serverName: guild.name,
      channelId: 'c-general',
      channelName: 'trò-chuyện-chung'
    });

    if (res.matched && res.rule) {
      setTestMatchedRule(res.rule);
      setTestResult(res.processedResponse || res.rule.response);
    } else {
      setTestMatchedRule(null);
      setTestResult('Không có quy tắc phản hồi nào khớp với nội dung này.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Tự Động Phản Hồi Tin Nhắn</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
              {rules.length} Quy Tắc
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Thiết lập phản hồi tự động khi người dùng gõ từ khóa, cú pháp regex hoặc lệnh đặc biệt
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phản Hồi Mới</span>
        </button>
      </div>

      {/* Live Test Sandbox Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hộp Thử Nghiệm Phản Hồi Trực Tiếp</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Nhập thử tin nhắn (ví dụ: 'xin chào', '!rules', '!social')..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={runTest}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Chạy Kiểm Tra</span>
          </button>
        </div>

        {testResult && (
          <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1.5">
              <span>Kết quả phản hồi của Bot:</span>
              {testMatchedRule && (
                <span className="text-emerald-400 font-medium">
                  (Khớp quy tắc: "{testMatchedRule.trigger}")
                </span>
              )}
            </div>
            <div className="text-slate-200">{testResult}</div>

            {testMatchedRule?.embed && (
              <div 
                className="mt-2.5 p-3 rounded bg-slate-900 border-l-4 text-xs"
                style={{ borderLeftColor: testMatchedRule.embed.color || '#5865F2' }}
              >
                {testMatchedRule.embed.title && (
                  <div className="font-bold text-white mb-1">{testMatchedRule.embed.title}</div>
                )}
                {testMatchedRule.embed.description && (
                  <div className="text-slate-300 whitespace-pre-line mb-1">{testMatchedRule.embed.description}</div>
                )}
                {testMatchedRule.embed.footer && (
                  <div className="text-[10px] text-slate-500 mt-2">{testMatchedRule.embed.footer}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-xl border transition-all ${
              rule.enabled
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'bg-slate-900/50 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {rule.trigger}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {rule.matchType === 'EXACT' && 'Chính xác'}
                    {rule.matchType === 'CONTAINS' && 'Chứa từ'}
                    {rule.matchType === 'STARTS_WITH' && 'Bắt đầu bằng'}
                    {rule.matchType === 'REGEX' && 'Regex'}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400">
                    {rule.replyType === 'REPLY' && 'Trả lời trực tiếp'}
                    {rule.replyType === 'MENTION' && 'Tag @user'}
                    {rule.replyType === 'DM' && 'Gửi tin nhắn riêng (DM)'}
                  </span>
                  {rule.cooldownSeconds && rule.cooldownSeconds > 0 && (
                    <span className="text-[11px] text-amber-400/90">
                      (Cooldown: {rule.cooldownSeconds}s)
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {rule.response}
                </p>

                {rule.embed && (
                  <div
                    className="mt-2 p-2.5 rounded bg-slate-950/80 border-l-4 text-xs max-w-xl"
                    style={{ borderLeftColor: rule.embed.color || '#5865F2' }}
                  >
                    {rule.embed.title && (
                      <div className="font-bold text-white text-xs mb-0.5">{rule.embed.title}</div>
                    )}
                    {rule.embed.description && (
                      <div className="text-slate-400 text-[11px] line-clamp-2">{rule.embed.description}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-1">
                <button
                  type="button"
                  onClick={() => onToggleRule(rule.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    rule.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {rule.enabled ? 'Đang bật' : 'Đã tắt'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(rule)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Chỉnh sửa quy tắc"
                  aria-label="Chỉnh sửa quy tắc"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  title="Xóa quy tắc"
                  aria-label="Xóa quy tắc"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {editingRule ? 'Chỉnh Sửa Phản Hồi Tự Động' : 'Tạo Phản Hồi Tự Động Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Đóng ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Từ Khóa Kích Hoạt (Trigger)
                </label>
                <input
                  type="text"
                  required
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="Ví dụ: xin chào, !donate, discord\.gg\/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kiểu Khớp Lệnh
                  </label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as MatchType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CONTAINS">Chứa từ (Contains)</option>
                    <option value="EXACT">Khớp chính xác (Exact)</option>
                    <option value="STARTS_WITH">Bắt đầu bằng (Starts with)</option>
                    <option value="REGEX">Regular Expression</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hình Thức Trả Lời
                  </label>
                  <select
                    value={replyType}
                    onChange={(e) => setReplyType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="REPLY">Reply tin nhắn</option>
                    <option value="MENTION">Tag @mention</option>
                    <option value="DM">Nhắn riêng (DM)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Nội Dung Phản Hồi
                  </label>
                  <div className="text-[10px] text-slate-400">
                    Hỗ trợ: <code className="text-indigo-400">{"{user}"}</code>, <code className="text-indigo-400">{"{server}"}</code>, <code className="text-indigo-400">{"{channel}"}</code>
                  </div>
                </div>
                <textarea
                  required
                  rows={3}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Nhập nội dung bot sẽ trả lời..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Cooldown */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Thời Gian Chờ Giữa Các Lần (Cooldown - giây)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={cooldown}
                  onChange={(e) => setCooldown(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Embed Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Đính kèm Discord Rich Embed
                  </span>
                  <input
                    type="checkbox"
                    checked={useEmbed}
                    onChange={(e) => setUseEmbed(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800"
                  />
                </div>

                {useEmbed && (
                  <div className="mt-3 space-y-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Tiêu Đề Embed</label>
                      <input
                        type="text"
                        value={embedTitle}
                        onChange={(e) => setEmbedTitle(e.target.value)}
                        placeholder="Ví dụ: 📜 Thông Báo Quan Trọng"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Mô Tả Embed</label>
                      <textarea
                        rows={2}
                        value={embedDesc}
                        onChange={(e) => setEmbedDesc(e.target.value)}
                        placeholder="Nội dung chi tiết trong khung embed..."
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Màu Sắc Viền</label>
                        <input
                          type="color"
                          value={embedColor}
                          onChange={(e) => setEmbedColor(e.target.value)}
                          className="w-full h-8 bg-slate-900 border border-slate-800 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Footer Nhỏ</label>
                        <input
                          type="text"
                          value={embedFooter}
                          onChange={(e) => setEmbedFooter(e.target.value)}
                          placeholder="AegisBot • Trợ lý tự động"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {editingRule ? 'Lưu Thay Đổi' : 'Tạo Quy Tắc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
