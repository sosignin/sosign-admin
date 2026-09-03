"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_CONFIG, playNotificationSound } from "./AdminNotificationCenter";

export default function AdminToastNotifier({ latestNotification, soundEnabled = true }) {
  const router = useRouter();
  const [currentToast, setCurrentToast] = useState(null);
  const [lastSeenId, setLastSeenId] = useState(null);

  useEffect(() => {
    if (!latestNotification || !latestNotification._id) return;

    // First time loading - record the latest ID without triggering a toast sound
    if (lastSeenId === null) {
      setLastSeenId(latestNotification._id);
      return;
    }

    // New notification arrived that is different from previous!
    if (latestNotification._id !== lastSeenId && !latestNotification.isRead) {
      setLastSeenId(latestNotification._id);
      setCurrentToast(latestNotification);

      // Play audio chime if enabled
      if (soundEnabled) {
        playNotificationSound();
      }

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setCurrentToast((prev) => (prev?._id === latestNotification._id ? null : prev));
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification, lastSeenId, soundEnabled]);

  if (!currentToast) return null;

  const config = CATEGORY_CONFIG[currentToast.category] || CATEGORY_CONFIG.system;

  const handleClick = () => {
    const link = currentToast.link || "/dashboard";
    setCurrentToast(null);
    router.push(link);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        onClick={handleClick}
        className="bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-2xl rounded-2xl p-4 flex items-start gap-3 cursor-pointer hover:shadow-blue-500/10 hover:border-blue-300 transition-all group"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bg} shadow-sm`}>
          <i className={`${config.icon} text-base`}></i>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              {config.label}
            </span>
            <span className="text-[10px] text-gray-400">Just now</span>
          </div>
          <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {currentToast.title}
          </h4>
          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
            {currentToast.message}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentToast(null);
          }}
          className="text-gray-400 hover:text-gray-600 w-5 h-5 rounded flex items-center justify-center text-xs shrink-0"
          title="Dismiss"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}
