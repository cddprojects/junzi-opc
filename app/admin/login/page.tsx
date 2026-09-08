import { safeAdminNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeAdminNext(params.next ?? null);
  const wrongPassword = params.error === "1" || params.error === "password";

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        method="POST"
        action="/api/admin/login"
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm"
      >
        <h1 className="font-serif text-[22px]">管理后台登录</h1>
        <p className="mt-2 text-[13px] text-[#777]">
          只需密码，无需用户名。未设置环境变量时默认密码为 junzi-admin。
        </p>
        <input type="hidden" name="next" value={next} />
        <label className="mt-5 block text-[13px]">
          后台密码
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="junzi-admin"
            className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-[14px] outline-none focus:border-[#8a5a20]"
          />
        </label>
        {wrongPassword ? <p className="mt-2 text-[13px] text-[#fa3534]">密码不正确</p> : null}
        <button
          type="submit"
          className="mt-4 h-10 w-full rounded-md bg-[#8a5a20] text-[14px] text-white hover:bg-[#6f4818]"
        >
          进入后台
        </button>
      </form>
    </div>
  );
}
