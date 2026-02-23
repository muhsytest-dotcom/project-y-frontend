export type Toast = {
  id: string;
  tone: "success" | "error" | "info";
  message: string;
};

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const toneClass =
          toast.tone === "success"
            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
            : toast.tone === "error"
              ? "bg-rose-100 text-rose-900 border-rose-300"
              : "bg-blue-100 text-blue-900 border-blue-300";
        return (
          <div key={toast.id} className={`max-w-sm rounded-lg border px-3 py-2 text-sm shadow ${toneClass}`}>
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
