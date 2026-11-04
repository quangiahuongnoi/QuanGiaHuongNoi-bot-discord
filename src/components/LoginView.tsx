import React, { FormEvent, useState } from 'react';
import { LockKeyhole, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<string | null>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const message = await onLogin(username, password);
    if (message) setError(message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-7">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-white">AegisBot Studio</h1>
            <p className="text-sm text-slate-400 mt-2">Đăng nhập Admin để điều khiển Discord Bot</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Tài khoản Admin</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Mật khẩu</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500"
                  placeholder="Nhập mật khẩu Admin"
                />
              </div>
            </div>

            {error && (
              <div className="flex gap-2 items-start rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập Admin'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-5 text-slate-500">
            <b className="text-slate-400">Lần đầu chạy?</b> Hãy đặt <code className="text-indigo-300">ADMIN_USERNAME</code> và <code className="text-indigo-300">ADMIN_PASSWORD</code> trong file <code className="text-indigo-300">.env</code>, sau đó khởi động lại server.
          </div>
        </div>
      </div>
    </div>
  );
};
