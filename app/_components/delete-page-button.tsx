"use client";

import { useTransition } from "react";
import { deletePage } from "@/app/actions";
import { slugToPath } from "@/lib/slug";

export function DeletePageButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`¿Borrar la página ${slugToPath(slug)}?`)) return;
    startTransition(async () => {
      await deletePage(slug);
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending}>
      {pending ? "Borrando…" : "Borrar"}
    </button>
  );
}
