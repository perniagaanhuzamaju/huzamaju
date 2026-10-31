import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap py-28 text-center">
      <p className="eyebrow justify-center">404</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Halaman tidak dijumpai</h1>
      <p className="mt-3 text-mute">Page not found. Halaman yang anda cari mungkin telah dipindahkan.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn btn-dark">Laman utama</Link>
        <Link href="/quotation" className="btn btn-line">Sebut harga AI</Link>
      </div>
    </section>
  );
}
