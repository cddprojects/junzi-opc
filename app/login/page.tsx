import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="px-4 py-8 md:px-0">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
