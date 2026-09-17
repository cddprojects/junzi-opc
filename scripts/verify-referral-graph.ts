import assert from "node:assert/strict";
import {
  countReferralTeam,
  layoutReferralForest,
  layoutReferralGraph,
  suggestedCollapsedIds,
  type ReferralGraphInput,
} from "../lib/referral-graph-layout";

function person(partial: ReferralGraphInput): ReferralGraphInput {
  return { children: [], ...partial };
}

const chain: ReferralGraphInput = person({
  userId: "yi",
  name: "学员乙-已编辑",
  code: "R9FFEB33",
  children: [
    person({
      userId: "ding",
      name: "顶mttiajmn",
      code: "REDB3248",
      children: [
        person({
          userId: "zhong",
          name: "中mttiajmn",
          code: "R445E3D5",
          children: [
            person({
              userId: "zhi",
              name: "直mttiajmn",
              code: "R5FB5928",
              children: [person({ userId: "mai", name: "买mttiajmn", code: "R578E85F" })],
            }),
          ],
        }),
      ],
    }),
  ],
});

const laid = layoutReferralGraph(chain);
const byId = Object.fromEntries(laid.nodes.map((node) => [node.id, node]));

assert.equal(laid.nodes.length, 5);
assert.ok(byId.yi.x < byId.ding.x, "root/upline stays on the left");
assert.ok(byId.ding.x < byId.zhong.x);
assert.ok(byId.zhong.x < byId.zhi.x);
assert.ok(byId.zhi.x < byId.mai.x, "newest downline stays on the right");
assert.ok(Math.abs(byId.mai.y - byId.yi.y) < 2, "a single chain stays horizontally aligned");
assert.equal(byId.yi.depth, 0);
assert.equal(byId.mai.depth, 4);
assert.equal(countReferralTeam(chain), 4);

assert.ok(
  laid.edges.find((edge) => edge.from === "yi" && edge.to === "ding"),
  "line grows from referrer toward the downline",
);
assert.deepEqual(
  [...laid.edges.map((edge) => `${edge.from}->${edge.to}`)].sort(),
  ["ding->zhong", "yi->ding", "zhi->mai", "zhong->zhi"],
);

const branch: ReferralGraphInput = person({
  userId: "a",
  name: "用户A",
  children: [
    person({
      userId: "b",
      name: "用户B",
      children: [person({ userId: "c", name: "用户C" }), person({ userId: "d", name: "用户D" })],
    }),
  ],
});
const branched = layoutReferralGraph(branch);
const map = Object.fromEntries(branched.nodes.map((node) => [node.id, node]));
assert.ok(map.a.x < map.b.x);
assert.ok(map.b.x < map.c.x);
assert.ok(map.b.x < map.d.x);
assert.ok(map.c.y < map.d.y, "siblings stack above and below to the right of the referrer");
assert.ok(map.b.y > map.c.y && map.b.y < map.d.y);

const forest = layoutReferralForest([
  person({ userId: "r1", name: "根一", children: [person({ userId: "c1", name: "子一" })] }),
  person({ userId: "r2", name: "根二" }),
]);
const forestMap = Object.fromEntries(forest.nodes.map((node) => [node.id, node]));
assert.ok(forestMap.c1.x > forestMap.r1.x);
assert.ok(Math.abs(forestMap.r1.x - forestMap.r2.x) < 1, "independent roots share the left column");
assert.ok(forestMap.r1.y < forestMap.r2.y);

const wide: ReferralGraphInput = person({
  userId: "root",
  name: "根",
  children: Array.from({ length: 3 }, (_, index) =>
    person({
      userId: `l1-${index}`,
      name: `一层${index}`,
      children: [
        person({
          userId: `l2-${index}`,
          name: `二层${index}`,
          children: [person({ userId: `l3-${index}`, name: `三层${index}` })],
        }),
      ],
    }),
  ),
});
assert.equal(1 + countReferralTeam(wide), 10);
assert.deepEqual(suggestedCollapsedIds(wide, 80), []);
assert.ok(suggestedCollapsedIds(wide, 4).includes("l2-0"));

console.log("referral graph layout ok");
