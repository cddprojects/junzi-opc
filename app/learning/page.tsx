import Link from "next/link";
import { getCurrentUser } from "@/lib/user-auth";
import { ordersForUser } from "@/lib/user-store";
import { getStoreProduct } from "@/lib/store";
import { LoginPrompt } from "@/components/login-prompt";
import { CopyCode } from "@/components/copy-code";
import { CoverArt } from "@/components/covers";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <LoginPrompt
        title="我的学习"
        body="登录后才能进入已购课程。购买时会生成一枚加密课程码，可随时在此查看。"
        next="/learning"
      />
    );
  }
  const orders = ordersForUser(user.id);
  const bySlug = new Map<string, (typeof orders)[number]>();
  for (const order of orders) {
    if (!bySlug.has(order.productSlug)) bySlug.set(order.productSlug, order);
  }
  const items = [...bySlug.values()];

  return (
    <div className="px-4 py-6 md:px-0">
      <h1 className="font-serif text-[24px]">我的学习</h1>
      <p className="mt-2 text-[13px] text-[#777]">这里只列出你买过的课，不会看到其他学员的记录。</p>
      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white px-4 py-8 text-center text-[14px] text-[#666]">
          <p>还没有已购课程。</p>
          <Link href="/product/qihang" className="mt-3 inline-block text-[#8a5a20]">
            查看启航营
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((order) => {
            const product = getStoreProduct(order.productSlug);
            return (
              <article key={order.productSlug} className="flex gap-3 rounded-2xl bg-white p-3">
                <Link href={product?.href || `/product/${order.productSlug}`} className="w-20 overflow-hidden rounded-md">
                  <CoverArt
                    theme={product?.cover || "qihang"}
                    image={product?.coverImage}
                    compact
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={product?.href || `/product/${order.productSlug}`} className="block text-[15px] font-medium">
                    {order.productTitle}
                  </Link>
                  {product?.detail?.lessons?.length ? (
                    <Link
                      href={`/courses/recorded/${order.productSlug}`}
                      className="mt-2 inline-block text-[13px] text-[#8a5a20]"
                    >
                      进入正课
                    </Link>
                  ) : null}
                  <p className="mt-1 text-[12px] text-[#888]">课程码</p>
                  <CopyCode code={order.verifyCode} className="font-mono text-[13px] text-[#8a5a20]" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
