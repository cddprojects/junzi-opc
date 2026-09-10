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
      <div className="w-full max-w-[320px] rounded-xl bg-white p-5 shadow-xl">
        <p className="text-center text-[14px] text-[#3a2c10]">{title}</p>
        <div className="mx-auto mt-4 h-1.5 w-28 overflow-hidden rounded-full bg-[#f3ead8]">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[#8a5a20]" />
        </div>
        <button type="button" onClick={onCancel} className="mt-5 w-full py-2 text-[13px] text-[#8a5a20]">
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
