import Link from "next/link";
import { listCustomers } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const users = listCustomers(q);

  return (
    <div>
      <h1 className="font-serif text-[26px]">学员账号</h1>
      <p className="mt-2 text-[14px] text-[#666]">与后台登录密码分开。可搜索姓名、邮箱或手机号。</p>
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索姓名 / 邮箱 / 手机"
          className="h-9 flex-1 rounded-md border border-input bg-white px-3 text-[13px]"
        />
        <button type="submit" className="h-9 rounded-md bg-[#8a5a20] px-3 text-[13px] text-white">
          搜索
        </button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-xl bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b bg-[#faf6ee] text-[#777]">
            <tr>
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">账号</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">会员</th>
              <th className="px-4 py-3">订单</th>
              <th className="px-4 py-3">注册时间</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#888]">
                  没有匹配的学员
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-[#666]">{user.email || user.phone}</td>
                  <td className="px-4 py-3">{user.status === "disabled" ? "已停用" : "正常"}</td>
                  <td className="px-4 py-3">{user.memberActive ? "已开通" : "未开通"}</td>
                  <td className="px-4 py-3">{user.orderCount}</td>
                  <td className="px-4 py-3 text-[#888]">{new Date(user.createdAt).toLocaleString("zh-CN")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="text-[#8a5a20]">
                      管理
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
