import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  ShieldAlert, 
  MessageSquare, 
  Radio, 
  Music, 
  Bell, 
  UserCheck,
  Sparkles
} from 'lucide-react';
import { AuditLogEntry, GuildInfo } from '../bot/types';

interface LogsViewProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
  guild: GuildInfo;
}

export const LogsView: React.FC<LogsViewProps> = ({
  logs,
  onClearLogs,
  guild
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all') {
      if (filterType === 'mod' && !log.actionType.startsWith('MEMBER_')) return false;
      if (filterType === 'message' && !log.actionType.startsWith('MESSAGE_')) return false;
      if (filterType === 'voice' && !log.actionType.startsWith('VOICE_')) return false;
      if (filterType === 'music' && !log.actionType.startsWith('MUSIC_')) return false;
      if (filterType === 'social' && !log.actionType.startsWith('SOCIAL_')) return false;
    }

    if (severityFilter !== 'all' && log.severity !== severityFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchExecutor = log.executor.name.toLowerCase().includes(q);
      const matchTarget = log.target?.name.toLowerCase().includes(q);
      return matchDetails || matchExecutor || matchTarget;
    }

    return true;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `discord_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'ActionType', 'Severity', 'Executor', 'Target', 'Details', 'Channel'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.actionType,
      l.severity,
      `"${l.executor.name}"`,
      `"${l.target?.name || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.channelName || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `discord_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getActionBadge = (type: string, severity: string) => {
    let color = 'bg-slate-800 text-slate-300';
    if (severity === 'danger') color = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    else if (severity === 'warning') color = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    else if (severity === 'info') color = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${color}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Hệ Thống Nhật Ký Audit Logs Chi Tiết</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
              {logs.length} Bản Ghi
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghi nhận toàn diện các hành động quản trị, chỉnh sửa tin nhắn, hoạt động âm nhạc và thông báo mạng xã hội
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
          <button
            type="button"
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất JSON</span>
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Xóa toàn bộ nhật ký"
            aria-label="Xóa toàn bộ nhật ký"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung chi tiết, người thực hiện hoặc đối tượng..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Tất cả loại sự kiện</option>
          <option value="mod">Xử Phạt & Quản Trị (Mod)</option>
          <option value="message">Tin Nhắn (Edit/Delete)</option>
          <option value="voice">Phòng Thoại (Voice)</option>
          <option value="music">Âm Nhạc (Music)</option>
          <option value="social">Mạng Xã Hội (Social)</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Mọi mức độ</option>
          <option value="info">Thông tin (Info)</option>
          <option value="warning">Cảnh báo (Warning)</option>
          <option value="danger">Nghiêm trọng (Danger)</option>
        </select>
      </div>

      {/* Audit Log Table Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-[11px] uppercase">
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Loại Sự Kiện</th>
                <th className="py-3 px-4">Người Thực Hiện</th>
                <th className="py-3 px-4">Nội Dung Chi Tiết</th>
                <th className="py-3 px-4 text-right">Kênh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400 tabular-nums">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getActionBadge(log.actionType, log.severity)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <span>{log.executor.name}</span>
                      {log.executor.isBot && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-bold">
                          BOT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 leading-relaxed max-w-md">
                    <div>{log.details}</div>
                    {log.target && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Đối tượng: <strong className="text-slate-300">{log.target.name}</strong>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {log.channelName || 'Hệ thống'}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Không tìm thấy bản ghi nhật ký nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
