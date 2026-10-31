import Link from "next/link";
import { TopBar } from "@/components/app/TopBar";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Tidak dijumpai</h1>
        <p className="mt-3 text-mute">Pautan ini tidak sah atau telah tamat.</p>
        <Link href="/" className="btn btn-dark mt-8">Laman utama</Link>
      </main>
    </>
  );
}
