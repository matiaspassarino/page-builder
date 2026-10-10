import type { Data } from "@puckeditor/core";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getPageTitle } from "./page-data";

export type Page = { slug: string; data: Data; updatedAt: string };
export type PageSummary = { slug: string; title: string; updatedAt: string };

export interface PagesRepo {
  list(): Promise<PageSummary[]>;
  get(slug: string): Promise<Page | null>;
  save(slug: string, data: Data): Promise<void>;
  remove(slug: string): Promise<void>;
}

// Guarda todas las páginas como un array en un único archivo JSON.
// Cada elemento tiene la misma forma que tendría una fila en una tabla.
class FilePagesRepo implements PagesRepo {
  // Cola de escrituras: cada save/remove lee, modifica y reescribe el archivo
  // completo. Encadenarlos evita que dos escrituras simultáneas se pisen.
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async list(): Promise<PageSummary[]> {
    const pages = await this.readAll();
    return pages
      .map(({ slug, data, updatedAt }) => ({
        slug,
        title: getPageTitle(data),
        updatedAt,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(slug: string): Promise<Page | null> {
    const pages = await this.readAll();
    return pages.find((page) => page.slug === slug) ?? null;
  }

  save(slug: string, data: Data): Promise<void> {
    return this.mutate((pages) => {
      const page: Page = { slug, data, updatedAt: new Date().toISOString() };
      const exists = pages.some((p) => p.slug === slug);
      return exists
        ? pages.map((p) => (p.slug === slug ? page : p))
        : [...pages, page];
    });
  }

  remove(slug: string): Promise<void> {
    return this.mutate((pages) => pages.filter((p) => p.slug !== slug));
  }

  private mutate(change: (pages: Page[]) => Page[]): Promise<void> {
    const run = this.queue.then(async () => {
      const pages = await this.readAll();
      await this.writeAll(change(pages));
    });
    // Si una escritura falla, la cola sigue disponible para las siguientes.
    this.queue = run.catch(() => {});
    return run;
  }

  private async readAll(): Promise<Page[]> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as Page[];
    } catch (error) {
      if (isFileNotFound(error)) return [];
      throw error;
    }
  }

  // Escritura atómica: se escribe a un temporal y se renombra. rename reemplaza
  // el archivo de una vez, así que nunca queda un JSON a medio escribir.
  private async writeAll(pages: Page[]): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(pages, null, 2));
    await fs.rename(tmpPath, this.filePath);
  }
}

function isFileNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// Único punto donde se elige la implementación. Para pasar a Supabase alcanza
// con cambiar esta línea.
export const pagesRepo: PagesRepo = new FilePagesRepo(
  path.join(process.cwd(), "data", "pages.json")
);
