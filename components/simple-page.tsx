import Link from "next/link";

export function SimplePlaceholder({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions?: { href: string; label: string }[];
}) {
  return (
    <div className="px-4 py-8">
      <div className="rounded-lg bg-white px-4 py-6">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <p className="mt-3 text-[14px] leading-7 text-[#666]">{body}</p>
        {actions && actions.length > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-md bg-[#f7f7f7] px-3 py-2.5 text-center text-[14px] text-[#333]"
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
