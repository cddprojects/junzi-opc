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
    <div className="px-4 py-10">
      <div className="front-card px-5 py-8 md:px-8">
        <h2 className="front-h2 font-serif">{title}</h2>
        <p className="mt-4 text-[15px] leading-7 text-[var(--front-text-soft)]">{body}</p>
        {actions && actions.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="front-btn-secondary"
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
