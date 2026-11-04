import React, { useState } from 'react';
import { Smartphone, Download, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuideModal(true);
          }
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        aria-label="Cài đặt App điều khiển AegisBot"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>Cài Đặt App Điều Khiển</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Cài Đặt App AegisBot Trên Điện Thoại & Máy Tính
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white text-xs"
                aria-label="Đóng hướng dẫn cài đặt App"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Ứng dụng <strong>AegisBot Studio</strong> đạt chuẩn <strong>Progressive Web App (PWA)</strong>. Bạn có thể cài đặt trực tiếp ra màn hình chính để điều khiển bot 24/7 như một ứng dụng độc lập:
              </p>

              {isIOS ? (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-indigo-400">Trên iPhone / iPad (Safari):</div>
                  <div>1. Nhấn vào nút <strong>Chia sẻ (Share)</strong> ở thanh công cụ phía dưới trình duyệt.</div>
                  <div>2. Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-indigo-400">Trên Máy Tính (Chrome / Edge) & Android:</div>
                  <div>1. Mở ứng dụng ở tab trình duyệt độc lập (nhấn biểu tượng mở tab mới góc trên bên phải nếu đang ở trong khung xem trước).</div>
                  <div>2. Nhấn biểu tượng <strong>Cài đặt ứng dụng (Install AegisBot)</strong> trên thanh địa chỉ trình duyệt hoặc menu <strong>⋮ → Cài đặt ứng dụng</strong>.</div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition-colors"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
