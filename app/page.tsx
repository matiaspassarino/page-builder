import Link from "next/link";

// Listado de páginas. Se implementa en la Fase 2, sobre lib/pages-repo.ts.
export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <h1>Páginas</h1>
      <p>
        Para editar una página, entrá a <code>/&lt;slug&gt;/edit</code> (por
        ejemplo <Link href="/prueba/edit">/prueba/edit</Link>).
      </p>
    </main>
  );
}
