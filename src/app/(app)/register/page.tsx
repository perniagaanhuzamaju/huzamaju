import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth/session";
import { AuthCard } from "@/components/app/AuthCard";
import { RegisterForm } from "@/components/app/AuthForms";

export const metadata = { title: "Daftar akaun pelanggan" };

export default async function Register() {
  const u = await currentUser();
  if (u) redirect(homeFor(u));
  return (
    <AuthCard title="Daftar akaun pelanggan" lead="Jejak pertanyaan, sebut harga, lawatan tapak dan kemajuan projek anda.">
      <RegisterForm />
    </AuthCard>
  );
}
