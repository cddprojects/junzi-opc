export const GRAPH_NODE_WIDTH = 176;
export const GRAPH_NODE_HEIGHT = 72;
export const GRAPH_H_GAP = 32;
export const GRAPH_V_GAP = 96;
export const GRAPH_PAD = 28;
export const GRAPH_COLLAPSE_AFTER = 80;
export const GRAPH_COLLAPSE_DEPTH = 2;

export type ReferralGraphInput = {
  userId: string;
  name: string;
  code?: string;
  status?: string;
  children?: ReferralGraphInput[];
};

export type ReferralGraphLaidNode = {
  id: string;
  name: string;
  code: string;
  status?: string;
  depth: number;
  x: number;
  y: number;
  parentId?: string;
  childIds: string[];
  visibleChildIds: string[];
  directCount: number;
  teamCount: number;
  collapsed: boolean;
};

export type ReferralGraphEdge = {
  from: string;
  to: string;
};

export type ReferralGraphLayout = {
  nodes: ReferralGraphLaidNode[];
  edges: ReferralGraphEdge[];
  width: number;
  height: number;
};

type MeasureBox = {
  input: ReferralGraphInput;
  depth: number;
  parentId?: string;
  children: MeasureBox[];
  width: number;
  cx: number;
};

export function countReferralTeam(node: ReferralGraphInput): number {
  let total = 0;
  for (const child of node.children || []) {
    total += 1 + countReferralTeam(child);
  }
  return total;
}

export function suggestedCollapsedIds(root: ReferralGraphInput, limit = GRAPH_COLLAPSE_AFTER): string[] {
  const total = 1 + countReferralTeam(root);
  if (total <= limit) return [];
  const ids: string[] = [];
  function walk(node: ReferralGraphInput, depth: number) {
    const kids = node.children || [];
    if (depth >= GRAPH_COLLAPSE_DEPTH && kids.length > 0) ids.push(node.userId);
    for (const child of kids) walk(child, depth + 1);
  }
  walk(root, 0);
  return ids;
}

function measure(input: ReferralGraphInput, depth: number, parentId: string | undefined, collapsed: Set<string>): MeasureBox {
  const collapsedHere = collapsed.has(input.userId);
  const kids = collapsedHere ? [] : (input.children || []).map((child) => measure(child, depth + 1, input.userId, collapsed));
  const kidsWidth = kids.length
    ? kids.reduce((sum, child) => sum + child.width, 0) + GRAPH_H_GAP * (kids.length - 1)
    : 0;
  return {
    input,
    depth,
    parentId,
    children: kids,
    width: Math.max(GRAPH_NODE_WIDTH, kidsWidth),
    cx: 0,
  };
}

function place(box: MeasureBox, left: number) {
  box.cx = left + box.width / 2;
  if (!box.children.length) return;
  const kidsWidth = box.children.reduce((sum, child) => sum + child.width, 0) + GRAPH_H_GAP * (box.children.length - 1);
  let cursor = left + (box.width - kidsWidth) / 2;
  for (const child of box.children) {
    place(child, cursor);
    cursor += child.width + GRAPH_H_GAP;
  }
}

export function layoutReferralGraph(
  root: ReferralGraphInput,
  options?: { collapsedIds?: Iterable<string> },
): ReferralGraphLayout {
  const collapsed = new Set(options?.collapsedIds);
  const tree = measure(root, 0, undefined, collapsed);
  place(tree, 0);

  const flat: MeasureBox[] = [];
  function collect(box: MeasureBox) {
    flat.push(box);
    for (const child of box.children) collect(child);
  }
  collect(tree);

  const maxDepth = flat.reduce((max, box) => Math.max(max, box.depth), 0);
  const raw: ReferralGraphLaidNode[] = flat.map((box) => {
    const allChildren = box.input.children || [];
    return {
      id: box.input.userId,
      name: box.input.name,
      code: box.input.code || "",
      status: box.input.status,
      depth: box.depth,
      x: box.cx,
      y: (maxDepth - box.depth) * (GRAPH_NODE_HEIGHT + GRAPH_V_GAP),
      parentId: box.parentId,
      childIds: allChildren.map((child) => child.userId),
      visibleChildIds: box.children.map((child) => child.input.userId),
      directCount: allChildren.length,
      teamCount: countReferralTeam(box.input),
      collapsed: collapsed.has(box.input.userId) && allChildren.length > 0,
    };
  });

  const minX = Math.min(...raw.map((node) => node.x - GRAPH_NODE_WIDTH / 2));
  const shift = GRAPH_PAD - minX;
  const nodes = raw.map((node) => ({ ...node, x: node.x + shift }));
  const maxX = Math.max(...nodes.map((node) => node.x + GRAPH_NODE_WIDTH / 2));
  const edges: ReferralGraphEdge[] = nodes.flatMap((node) =>
    node.visibleChildIds.map((childId) => ({ from: childId, to: node.id })),
  );

  return {
    nodes,
    edges,
    width: Math.ceil(maxX + GRAPH_PAD),
    height: Math.ceil(maxDepth * (GRAPH_NODE_HEIGHT + GRAPH_V_GAP) + GRAPH_NODE_HEIGHT + GRAPH_PAD),
  };
}

export function layoutReferralForest(
  roots: ReferralGraphInput[],
  options?: { collapsedIds?: Iterable<string> },
): ReferralGraphLayout {
  if (roots.length === 0) {
    return { nodes: [], edges: [], width: GRAPH_NODE_WIDTH + GRAPH_PAD * 2, height: GRAPH_NODE_HEIGHT + GRAPH_PAD * 2 };
  }
  if (roots.length === 1) return layoutReferralGraph(roots[0], options);

  const laid = roots.map((root) => layoutReferralGraph(root, options));
  const maxHeight = Math.max(...laid.map((item) => item.height));
  let cursor = 0;
  const nodes: ReferralGraphLaidNode[] = [];
  const edges: ReferralGraphEdge[] = [];
  for (const item of laid) {
    const lift = maxHeight - item.height;
    for (const node of item.nodes) {
      nodes.push({ ...node, x: node.x + cursor, y: node.y + lift });
    }
    edges.push(...item.edges);
    cursor += item.width + GRAPH_H_GAP;
  }
  return {
    nodes,
    edges,
    width: Math.ceil(cursor - GRAPH_H_GAP),
    height: maxHeight,
  };
}
