import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="px-4 py-12 md:px-0">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
