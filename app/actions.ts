"use server";

import type { Data } from "@puckeditor/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { emptyPageData, isPuckData } from "@/lib/page-data";
import { pagesRepo } from "@/lib/pages-repo";
import { normalizeSlug, slugToPath, validateSlug } from "@/lib/slug";

// Cada función exportada acá es un endpoint POST que Next genera solo.
// Cualquiera puede llamarlo con cualquier argumento, por eso se validan.

export async function savePage(slug: string, data: Data): Promise<void> {
  assertValidSlug(slug);
  if (!isPuckData(data)) throw new Error("Datos de página inválidos.");

  await pagesRepo.save(slug, data);
  // La página pública es estática: hay que invalidar su caché.
  revalidatePath(slugToPath(slug));
}

export type CreatePageState = { error: string | null; slug: string };

export async function createPage(
  _prev: CreatePageState,
  formData: FormData
): Promise<CreatePageState> {
  const input = formData.get("slug");
  const slug = normalizeSlug(typeof input === "string" ? input : "");

  const error = validateSlug(slug);
  if (error) return { error, slug };

  if (await pagesRepo.get(slug)) {
    return { error: `Ya existe una página "${slugToPath(slug)}".`, slug };
  }

  await pagesRepo.save(slug, emptyPageData());
  revalidatePath(slugToPath(slug));
  redirect(`${slugToPath(slug)}/edit`);
}

export async function deletePage(slug: string): Promise<void> {
  assertValidSlug(slug);

  await pagesRepo.remove(slug);
  revalidatePath(slugToPath(slug));
  revalidatePath("/");
}

function assertValidSlug(slug: unknown): asserts slug is string {
  if (typeof slug !== "string" || validateSlug(slug) !== null) {
    throw new Error("Slug inválido.");
  }
}
