"use client";

export function StringListEditor({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-lg border border-[#efe6d4] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">{label}</p>
        <button
          type="button"
          className="text-[12px] text-[#8a5a20]"
          onClick={() => onChange([...values, ""])}
        >
          增加一项
        </button>
      </div>
      {hint && <p className="mt-1 text-[12px] text-[#888]">{hint}</p>}
      <div className="mt-2 space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={value}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="h-9 flex-1 rounded-md border border-input px-3 text-[13px]"
            />
            <button
              type="button"
              className="text-[12px] text-[#888]"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function moveItem<T>(list: T[], index: number, offset: number) {
  const next = [...list];
  const target = index + offset;
  if (target < 0 || target >= next.length) return list;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}
