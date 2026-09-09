"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/locale-provider";

type Hit = { href: string; title: string; hint: string };

export function AdminSearch() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const shownHits = query.trim() ? hits : [];

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) return;
    const timer = window.setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: { items?: Hit[] }) => {
          setHits(data.items || []);
          setOpen(true);
        })
        .catch(() => setHits([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="admin-search" ref={box}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => shownHits.length && setOpen(true)}
        placeholder={t("adminSearchPlaceholder")}
        aria-label={t("adminSearchPlaceholder")}
      />
      {open && shownHits.length > 0 ? (
        <div className="admin-search-pop">
          {shownHits.map((hit) => (
            <Link key={hit.href + hit.title} href={hit.href} onClick={() => setOpen(false)}>
              <span>{hit.title}</span>
              <span className="hint"> · {hit.hint}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
