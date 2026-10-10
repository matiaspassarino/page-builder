import type { ComponentConfig } from "@puckeditor/core";
import type { CSSProperties } from "react";
import { colorField } from "../fields/ColorField";

export type BotonProps = {
  texto: string;
  href: string;
  variante: "primario" | "secundario";
  colorFondo: string;
  colorTexto: string;
};

// Solo se aceptan links http(s), mailto, tel, rutas internas y anclas. Evita
// que un href "javascript:…" ejecute código en la página pública.
function safeHref(href: string): string | undefined {
  const value = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  return undefined;
}

export const Boton: ComponentConfig<BotonProps> = {
  label: "Botón",
  fields: {
    texto: { type: "text", label: "Texto" },
    href: { type: "text", label: "Link", placeholder: "/contacto o https://…" },
    variante: {
      type: "radio",
      label: "Variante",
      options: [
        { label: "Primario", value: "primario" },
        { label: "Secundario", value: "secundario" },
      ],
    },
    colorFondo: colorField("Color principal"),
    colorTexto: colorField("Color de texto (primario)"),
  },
  defaultProps: {
    texto: "Botón",
    href: "#",
    variante: "primario",
    colorFondo: "#2563eb",
    colorTexto: "#ffffff",
  },
  render: ({ texto, href, variante, colorFondo, colorTexto, puck }) => {
    const base: CSSProperties = {
      display: "inline-block",
      padding: "10px 20px",
      borderRadius: 6,
      border: `2px solid ${colorFondo || "currentColor"}`,
      fontFamily: "system-ui, sans-serif",
      fontWeight: 600,
      textDecoration: "none",
      cursor: "pointer",
    };
    // Primario: relleno con el color principal. Secundario: solo borde, y el
    // texto toma el color principal.
    const style: CSSProperties =
      variante === "primario"
        ? { ...base, background: colorFondo || undefined, color: colorTexto || undefined }
        : { ...base, background: "transparent", color: colorFondo || undefined };

    return (
      // En el editor se quita el href para que un click no navegue.
      <a href={puck.isEditing ? undefined : safeHref(href)} style={style}>
        {texto}
      </a>
    );
  },
};
