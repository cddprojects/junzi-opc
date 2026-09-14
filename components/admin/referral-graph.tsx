"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { useT } from "@/components/locale-provider";
import {
  GRAPH_NODE_HEIGHT,
  GRAPH_NODE_WIDTH,
  layoutReferralGraph,
  suggestedCollapsedIds,
  type ReferralGraphInput,
  type ReferralGraphLaidNode,
} from "@/lib/referral-graph-layout";

const MIN_SCALE = 0.28;
const MAX_SCALE = 2.4;

type View = { x: number; y: number; scale: number };
type Point = { x: number; y: number };

export function ReferralGraph({
  root,
  className = "",
}: {
  root: ReferralGraphInput;
  className?: string;
}) {
  const t = useT();
  const rawId = useId();
  const markerId = `referral-arrow-${rawId.replace(/:/g, "")}`;
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, scale: 1 });
  const pointersRef = useRef(new Map<number, Point>());
  const panRef = useRef<{ id: number; start: Point; origin: View; moved: boolean } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const userMovedRef = useRef(false);
  const [collapsedIds, setCollapsedIds] = useState<string[]>(() => suggestedCollapsedIds(root));
  const [selectedId, setSelectedId] = useState<string | null>(root.userId);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });

  const layout = useMemo(() => layoutReferralGraph(root, { collapsedIds }), [root, collapsedIds]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const byId = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);

  const commitView = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const fitView = useCallback(() => {
    const nextLayout = layoutRef.current;
    const el = viewportRef.current;
    if (!el || !nextLayout.nodes.length) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    if (vw < 8 || vh < 8) return;
    const fitted = Math.min(vw / nextLayout.width, vh / nextLayout.height) * 0.88;
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitted));
    commitView({
      x: (vw - nextLayout.width * scale) / 2,
      y: (vh - nextLayout.height * scale) / 2,
      scale,
    });
  }, [commitView]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let lastWidth = el.clientWidth;
    fitView();
    const observer = new ResizeObserver(() => {
      const width = el.clientWidth;
      const jumped = Math.abs(width - lastWidth) > 80;
      lastWidth = width;
      if (jumped) userMovedRef.current = false;
      if (!userMovedRef.current || jumped) fitView();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitView]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const prev = viewRef.current;
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
      const wx = (px - prev.x) / prev.scale;
      const wy = (py - prev.y) / prev.scale;
      userMovedRef.current = true;
      commitView({ scale, x: px - wx * scale, y: py - wy * scale });
    },
    [commitView],
  );

  const centerNode = useCallback(
    (node: ReferralGraphLaidNode) => {
      const el = viewportRef.current;
      if (!el) return;
      const prev = viewRef.current;
      userMovedRef.current = true;
      commitView({
        ...prev,
        x: el.clientWidth / 2 - node.x * prev.scale,
        y: el.clientHeight / 2 - (node.y + GRAPH_NODE_HEIGHT / 2) * prev.scale,
      });
    },
    [commitView],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0016));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function pointerList() {
    return [...pointersRef.current.values()];
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const el = viewportRef.current;
    if (!el) return;
    el.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = pointerList();
    if (points.length >= 2) {
      pinchRef.current = { dist: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), scale: viewRef.current.scale };
      panRef.current = null;
      return;
    }
    panRef.current = {
      id: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: viewRef.current,
      moved: false,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = pointerList();
    if (points.length >= 2 && pinchRef.current) {
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (pinchRef.current.dist > 0 && dist > 0) {
        const midX = (points[0].x + points[1].x) / 2;
        const midY = (points[0].y + points[1].y) / 2;
        const target = pinchRef.current.scale * (dist / pinchRef.current.dist);
        zoomAt(midX, midY, target / viewRef.current.scale);
      }
      return;
    }
    const pan = panRef.current;
    if (!pan || pan.id !== event.pointerId) return;
    const dx = event.clientX - pan.start.x;
    const dy = event.clientY - pan.start.y;
    if (Math.hypot(dx, dy) > 4) {
      pan.moved = true;
      userMovedRef.current = true;
    }
    commitView({ ...pan.origin, x: pan.origin.x + dx, y: pan.origin.y + dy });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (panRef.current?.id === event.pointerId) panRef.current = null;
  }

  function selectNode(node: ReferralGraphLaidNode, event: React.MouseEvent) {
    if (panRef.current?.moved) return;
    event.stopPropagation();
    setSelectedId(node.id);
    centerNode(node);
  }

  function search() {
    const needle = query.trim().toLowerCase().replace(/[\s\-_]/g, "");
    if (!needle) return;
    const match = layout.nodes.find((node) => {
      const name = node.name.toLowerCase();
      const code = node.code.toLowerCase().replace(/[\s\-_]/g, "");
      return name.includes(needle) || code.includes(needle);
    });
    if (!match) return;
    setSelectedId(match.id);
    centerNode(match);
  }

  return (
    <div className={`referral-graph ${className}`.trim()}>
      <div className="referral-graph-toolbar">
        <form
          className="referral-graph-search"
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("adminGraphSearch")}
            aria-label={t("adminGraphSearch")}
          />
        </form>
        <div className="referral-graph-tools">
          <button type="button" className="jx-btn-ghost" onClick={() => zoomFromCenter(viewportRef.current, zoomAt, 1.18)} aria-label={t("adminGraphZoomIn")}>
            <Plus size={16} />
          </button>
          <button type="button" className="jx-btn-ghost" onClick={() => zoomFromCenter(viewportRef.current, zoomAt, 1 / 1.18)} aria-label={t("adminGraphZoomOut")}>
            <Minus size={16} />
          </button>
          <button
            type="button"
            className="jx-btn-ghost"
            onClick={() => {
              userMovedRef.current = false;
              fitView();
            }}
            aria-label={t("adminGraphFit")}
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            className="jx-btn-ghost"
            onClick={() => {
              setCollapsedIds(suggestedCollapsedIds(root));
              setSelectedId(root.userId);
              setQuery("");
              userMovedRef.current = false;
              requestAnimationFrame(() => fitView());
            }}
            aria-label={t("adminGraphReset")}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="referral-graph-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="referral-graph-world"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >
          <svg className="referral-graph-edges" width={layout.width} height={layout.height} aria-hidden="true">
            <defs>
              <marker id={markerId} viewBox="0 0 12 12" refX="6" refY="6" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M 1 1 L 11 6 L 1 11 Z" fill="#b08a4e" />
              </marker>
            </defs>
            {layout.edges.map((edge) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              if (!from || !to) return null;
              const x1 = from.x;
              const y1 = from.y + GRAPH_NODE_HEIGHT;
              const x2 = to.x;
              const y2 = to.y;
              const mid = (y1 + y2) / 2;
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#b08a4e"
                  strokeWidth="1.5"
                  markerEnd={`url(#${markerId})`}
                />
              );
            })}
          </svg>
          {layout.nodes.map((node) => {
            const isRoot = node.id === root.userId;
            const selected = node.id === selectedId;
            const meta = [
              node.directCount ? t("adminGraphDirect", { n: node.directCount }) : "",
              node.teamCount ? t("adminGraphTeam", { n: node.teamCount }) : "",
              node.status === "disabled" ? t("adminReasonInactive") : "",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <article
                key={node.id}
                className={[
                  "referral-graph-node",
                  isRoot ? "is-root" : "",
                  selected ? "is-selected" : "",
                  node.status === "disabled" ? "is-disabled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  width: GRAPH_NODE_WIDTH,
                  height: GRAPH_NODE_HEIGHT,
                  left: node.x - GRAPH_NODE_WIDTH / 2,
                  top: node.y,
                }}
                onClick={(event) => selectNode(node, event)}
              >
                <Link
                  href={`/admin/users/${node.id}`}
                  className="referral-graph-name"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {node.name}
                </Link>
                <p className="referral-graph-code">{node.code || "—"}</p>
                {meta ? <p className="referral-graph-meta">{meta}</p> : null}
                {node.childIds.length > 0 ? (
                  <button
                    type="button"
                    className="referral-graph-toggle"
                    aria-label={node.collapsed ? t("adminGraphExpand") : t("adminGraphCollapse")}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCollapsedIds((prev) => (prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]));
                    }}
                  >
                    {node.collapsed ? `+${node.teamCount}` : "−"}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function zoomFromCenter(
  el: HTMLDivElement | null,
  zoomAt: (x: number, y: number, factor: number) => void,
  factor: number,
) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
}
