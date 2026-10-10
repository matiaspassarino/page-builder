// Un slug es la ruta de la página sin "/" inicial: "contacto", "blog/post-1".
const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Primeros segmentos que ya usa la app.
const RESERVED_ROOTS = new Set(["puck", "api", "_next"]);

export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

// Devuelve el mensaje de error, o null si el slug es válido.
export function validateSlug(slug: string): string | null {
  if (!slug) return "El slug no puede estar vacío.";

  const segments = slug.split("/");

  if (!segments.every((segment) => SEGMENT.test(segment))) {
    return "Usá solo minúsculas, números y guiones. Las subpáginas se separan con /.";
  }
  if (RESERVED_ROOTS.has(segments[0])) {
    return `"${segments[0]}" es una ruta reservada.`;
  }
  // proxy.ts trata cualquier URL terminada en /edit como el editor.
  if (segments.includes("edit")) {
    return `"edit" está reservado para el editor.`;
  }
  return null;
}

export const slugToPath = (slug: string) => `/${slug}`;
