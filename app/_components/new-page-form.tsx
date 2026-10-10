"use client";

import { useActionState } from "react";
import { createPage, type CreatePageState } from "@/app/actions";

const initialState: CreatePageState = { error: null, slug: "" };

export function NewPageForm() {
  const [state, formAction, pending] = useActionState(createPage, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <label htmlFor="slug">Slug</label>
      <input
        id="slug"
        name="slug"
        required
        placeholder="mi-pagina"
        // Después de un error, React resetea el form a este valor.
        defaultValue={state.slug}
        style={{ padding: 6 }}
      />
      <button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Nueva página"}
      </button>
      {state.error && (
        <p role="alert" style={{ width: "100%", margin: 0, color: "#b00020" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
