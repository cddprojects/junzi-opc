import { Input } from "@/components/ui/input";

export function EnHint() {
  return <span className="ml-1 text-[11px] font-normal text-[#888]">英文（选填，空则前台显示中文）</span>;
}

export function EnInput({
  name,
  defaultValue,
  value,
  onChange,
  label,
  multiline,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (next: string) => void;
  label?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block text-[13px]">
      {label || "英文"}
      <EnHint />
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          rows={3}
          className="mt-1 w-full rounded-md border border-input px-3 py-2"
        />
      ) : (
        <Input
          name={name}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className="mt-1 h-9"
        />
      )}
    </label>
  );
}
