import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth/session";
import { AuthCard } from "@/components/app/AuthCard";
import { LoginForm } from "@/components/app/AuthForms";

export const metadata = { title: "Log masuk" };

export default async function Login({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const u = await currentUser();
  if (u) redirect(next && /^\/(?![\/\\])/.test(next) ? next : homeFor(u));
  return (
    <AuthCard title="Log masuk" lead="Portal pelanggan, rakan niaga dan staf HUZA MAJU.">
      <LoginForm next={next} />
    </AuthCard>
  );
}
