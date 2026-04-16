"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const COLORS: Record<ToastType, string> = {
  success: "bg-green-900/90 border-green-600 text-green-200",
  error: "bg-red-900/90 border-red-600 text-red-200",
  warning: "bg-yellow-900/90 border-yellow-600 text-yellow-200",
  info: "bg-blue-900/90 border-blue-600 text-blue-200",
};

const ICONS: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2717",
  warning: "!",
  info: "i",
};

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm text-sm animate-[slideIn_0.3s_ease] ${COLORS[toast.type]}`}
    >
      <span className="font-bold text-base w-5 h-5 flex items-center justify-center rounded-full bg-white/10">
        {ICONS[toast.type]}
      </span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  );
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
