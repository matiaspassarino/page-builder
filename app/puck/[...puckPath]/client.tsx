"use client";

import type { Data } from "@puckeditor/core";
import { Puck } from "@puckeditor/core";
import { savePage } from "@/app/actions";
import config from "@/puck/config";

export function Client({ slug, data }: { slug: string; data: Data }) {
  return (
    <Puck
      config={config}
      data={data}
      onPublish={async (data) => {
        try {
          await savePage(slug, data);
        } catch {
          window.alert("No se pudo publicar la página.");
        }
      }}
    />
  );
}
