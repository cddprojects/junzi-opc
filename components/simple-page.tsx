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
      <div className="rounded-xl bg-white px-4 py-6 md:px-6">
        <h2 className="font-serif text-[20px] text-[#3a2c10]">{title}</h2>
        <p className="mt-3 text-[14px] leading-7 text-[#666]">{body}</p>
        {actions && actions.length > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-lg bg-[#f3ead8] px-3 py-2.5 text-center text-[14px] text-[#8a5a20]"
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
