import Link from "next/link";
import { pagesRepo } from "@/lib/pages-repo";
import { slugToPath } from "@/lib/slug";
import { DeletePageButton } from "./_components/delete-page-button";
import { NewPageForm } from "./_components/new-page-form";

// Se lee el repo en cada request para que el listado esté siempre al día.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function Home() {
  const pages = await pagesRepo.list();

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <h1>Páginas</h1>

      <NewPageForm />

      {pages.length === 0 ? (
        <p>Todavía no hay páginas.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Ruta</th>
              <th style={{ padding: 8 }}>Título</th>
              <th style={{ padding: 8 }}>Actualizada</th>
              <th style={{ padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const path = slugToPath(page.slug);
              return (
                <tr key={page.slug} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>
                    <code>{path}</code>
                  </td>
                  <td style={{ padding: 8 }}>{page.title || "—"}</td>
                  <td style={{ padding: 8 }}>{dateFormat.format(new Date(page.updatedAt))}</td>
                  <td style={{ padding: 8, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <Link href={path}>Ver</Link>
                    <Link href={`${path}/edit`}>Editar</Link>
                    <DeletePageButton slug={page.slug} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
