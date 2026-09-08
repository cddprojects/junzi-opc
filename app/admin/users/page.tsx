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
      <h1>学员账号</h1>
      <p className="jx-lede">与后台登录密码分开。可搜索姓名、邮箱或手机号。</p>
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索姓名 / 邮箱 / 手机"
          className="h-9 flex-1 rounded-md px-3 text-[13px]"
        />
        <button type="submit" className="jx-btn">
          搜索
        </button>
      </form>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>账号</th>
              <th>状态</th>
              <th>会员</th>
              <th>订单</th>
              <th>注册时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7}>没有匹配的学员</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email || user.phone}</td>
                  <td>
                    <span className={user.status === "disabled" ? "jx-chip jx-chip-wait" : "jx-chip jx-chip-ok"}>
                      {user.status === "disabled" ? "已停用" : "正常"}
                    </span>
                  </td>
                  <td>{user.memberActive ? "已开通" : "未开通"}</td>
                  <td>{user.orderCount}</td>
                  <td>{new Date(user.createdAt).toLocaleString("zh-CN")}</td>
                  <td>
                    <Link href={`/admin/users/${user.id}`} className="jx-link">
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
