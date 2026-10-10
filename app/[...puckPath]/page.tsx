/**
 * Página pública: busca la página en el repo y la renderiza con <Render>.
 *
 * Se genera estática en la primera visita y queda en caché. Al publicar,
 * savePage (app/actions.ts) invalida la caché con revalidatePath.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageTitle } from "@/lib/page-data";
import { pagesRepo } from "@/lib/pages-repo";
import { Client } from "./client";

type Props = { params: Promise<{ puckPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { puckPath } = await params;
  const page = await pagesRepo.get(puckPath.join("/"));

  return { title: page ? getPageTitle(page.data) : undefined };
}

export default async function Page({ params }: Props) {
  const { puckPath } = await params;
  const page = await pagesRepo.get(puckPath.join("/"));

  if (!page) notFound();

  return <Client data={page.data} />;
}

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "force-static";
