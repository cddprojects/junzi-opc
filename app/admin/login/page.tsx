import { AdminLoginForm } from "@/components/admin/admin-login-form";
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
      <AdminLoginForm next={next} wrongPassword={wrongPassword} />
    </div>
  );
}
