import type { Data } from "@puckeditor/core";

export function emptyPageData(): Data {
  return { content: [], root: { props: { title: "" } } };
}

export function getPageTitle(data: Data): string {
  const title: unknown = data.root.props?.title;
  return typeof title === "string" ? title : "";
}

// Chequeo mínimo de forma: lo que llega a una server action viene del cliente
// y no se puede confiar en el tipo de TypeScript.
export function isPuckData(value: unknown): value is Data {
  if (typeof value !== "object" || value === null) return false;
  const { content, root } = value as Record<string, unknown>;
  return Array.isArray(content) && typeof root === "object" && root !== null;
}
