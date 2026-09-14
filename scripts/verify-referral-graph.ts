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
assert.ok(byId.mai.y < byId.zhi.y, "newest downline stays above");
assert.ok(byId.zhi.y < byId.zhong.y);
assert.ok(byId.zhong.y < byId.ding.y);
assert.ok(byId.ding.y < byId.yi.y, "root/upline stays at the bottom");
assert.ok(Math.abs(byId.mai.x - byId.yi.x) < 1, "a single chain stays vertically aligned");
assert.equal(byId.yi.depth, 0);
assert.equal(byId.mai.depth, 4);
assert.equal(countReferralTeam(chain), 4);

const downArrow = laid.edges.find((edge) => edge.from === "mai" && edge.to === "zhi");
assert.ok(downArrow, "arrow points from downline toward the referrer");
assert.deepEqual(
  [...laid.edges.map((edge) => `${edge.from}->${edge.to}`)].sort(),
  ["ding->yi", "mai->zhi", "zhi->zhong", "zhong->ding"],
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
assert.ok(map.c.y < map.b.y);
assert.ok(map.d.y < map.b.y);
assert.ok(map.b.y < map.a.y);
assert.ok(map.c.x < map.d.x, "siblings branch left to right above the referrer");
assert.ok(map.b.x > map.c.x && map.b.x < map.d.x);

const forest = layoutReferralForest([
  person({ userId: "r1", name: "根一", children: [person({ userId: "c1", name: "子一" })] }),
  person({ userId: "r2", name: "根二" }),
]);
const forestMap = Object.fromEntries(forest.nodes.map((node) => [node.id, node]));
assert.ok(forestMap.c1.y < forestMap.r1.y);
assert.ok(Math.abs(forestMap.r1.y - forestMap.r2.y) < 1, "independent roots share the bottom row");
assert.ok(forestMap.r1.x < forestMap.r2.x);

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
