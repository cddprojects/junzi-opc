"use client";

export function PayBusyOverlay({
  title,
  cancelLabel,
  onCancel,
}: {
  title: string;
  cancelLabel: string;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      role="alertdialog"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
    >
      <div className="front-card w-full max-w-[320px] p-6 shadow-xl">
        <p className="text-center text-[15px] text-[var(--front-text)]">{title}</p>
        <div className="mx-auto mt-4 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--front-surface-soft)]">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[var(--front-accent)]" />
        </div>
        <button type="button" onClick={onCancel} className="mt-5 w-full py-2 text-[14px] text-[var(--front-accent)]">
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
