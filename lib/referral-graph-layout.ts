export const GRAPH_NODE_R = 16;
export const GRAPH_NODE_SIZE = GRAPH_NODE_R * 2;
export const GRAPH_LABEL_W = 96;
export const GRAPH_LABEL_H = 34;
export const GRAPH_COL_W = 118;
export const GRAPH_ROW_H = 72;
export const GRAPH_ROW_GAP = 18;
export const GRAPH_PAD = 40;
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
  height: number;
  cy: number;
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
  const kidsHeight = kids.length
    ? kids.reduce((sum, child) => sum + child.height, 0) + GRAPH_ROW_GAP * (kids.length - 1)
    : 0;
  return {
    input,
    depth,
    parentId,
    children: kids,
    height: Math.max(GRAPH_ROW_H, kidsHeight),
    cy: 0,
  };
}

function place(box: MeasureBox, top: number) {
  box.cy = top + box.height / 2;
  if (!box.children.length) return;
  const kidsHeight = box.children.reduce((sum, child) => sum + child.height, 0) + GRAPH_ROW_GAP * (box.children.length - 1);
  let cursor = top + (box.height - kidsHeight) / 2;
  for (const child of box.children) {
    place(child, cursor);
    cursor += child.height + GRAPH_ROW_GAP;
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

  const raw: ReferralGraphLaidNode[] = flat.map((box) => {
    const allChildren = box.input.children || [];
    return {
      id: box.input.userId,
      name: box.input.name,
      code: box.input.code || "",
      status: box.input.status,
      depth: box.depth,
      x: GRAPH_PAD + GRAPH_NODE_R + box.depth * GRAPH_COL_W,
      y: GRAPH_PAD + box.cy,
      parentId: box.parentId,
      childIds: allChildren.map((child) => child.userId),
      visibleChildIds: box.children.map((child) => child.input.userId),
      directCount: allChildren.length,
      teamCount: countReferralTeam(box.input),
      collapsed: collapsed.has(box.input.userId) && allChildren.length > 0,
    };
  });

  const minX = Math.min(...raw.map((node) => node.x - GRAPH_LABEL_W / 2));
  const minY = Math.min(...raw.map((node) => node.y - GRAPH_NODE_R));
  const shiftX = GRAPH_PAD - minX;
  const shiftY = GRAPH_PAD - minY;
  const nodes = raw.map((node) => ({ ...node, x: node.x + shiftX, y: node.y + shiftY }));
  const maxX = Math.max(...nodes.map((node) => node.x + GRAPH_LABEL_W / 2));
  const maxY = Math.max(...nodes.map((node) => node.y + GRAPH_NODE_R + GRAPH_LABEL_H));
  const edges: ReferralGraphEdge[] = nodes.flatMap((node) =>
    node.visibleChildIds.map((childId) => ({ from: node.id, to: childId })),
  );

  return {
    nodes,
    edges,
    width: Math.ceil(maxX + GRAPH_PAD),
    height: Math.ceil(maxY + GRAPH_PAD),
  };
}

export function layoutReferralForest(
  roots: ReferralGraphInput[],
  options?: { collapsedIds?: Iterable<string> },
): ReferralGraphLayout {
  if (roots.length === 0) {
    return { nodes: [], edges: [], width: GRAPH_COL_W + GRAPH_PAD * 2, height: GRAPH_ROW_H + GRAPH_PAD * 2 };
  }
  if (roots.length === 1) return layoutReferralGraph(roots[0], options);

  const laid = roots.map((root) => layoutReferralGraph(root, options));
  const maxWidth = Math.max(...laid.map((item) => item.width));
  let cursor = 0;
  const nodes: ReferralGraphLaidNode[] = [];
  const edges: ReferralGraphEdge[] = [];
  for (const item of laid) {
    for (const node of item.nodes) {
      nodes.push({ ...node, y: node.y + cursor });
    }
    edges.push(...item.edges);
    cursor += item.height + GRAPH_ROW_GAP;
  }
  return {
    nodes,
    edges,
    width: maxWidth,
    height: Math.ceil(cursor - GRAPH_ROW_GAP),
  };
}
