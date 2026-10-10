/**
 * Editor de Puck. Esta ruta (/puck/<slug>) no se visita directo: proxy.ts
 * reescribe /<slug>/edit hacia acá y redirige cualquier acceso a /puck.
 *
 * Es dinámica para leer siempre la última versión guardada.
 * NB: no tiene autenticación.
 */

import "@puckeditor/core/puck.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { emptyPageData } from "@/lib/page-data";
import { pagesRepo } from "@/lib/pages-repo";
import { slugToPath, validateSlug } from "@/lib/slug";
import { Client } from "./client";

type Props = { params: Promise<{ puckPath: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { puckPath } = await params;
  return { title: `Editando ${slugToPath(puckPath.join("/"))}` };
}

export default async function Page({ params }: Props) {
  const { puckPath } = await params;
  const slug = puckPath.join("/");

  if (validateSlug(slug) !== null) notFound();

  const page = await pagesRepo.get(slug);

  return <Client slug={slug} data={page?.data ?? emptyPageData()} />;
}

export const dynamic = "force-dynamic";
