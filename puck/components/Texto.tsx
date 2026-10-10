import type { ComponentConfig } from "@puckeditor/core";

export type TextoProps = {
  texto: string;
  tag: "p" | "h1" | "h2" | "h3";
  tamano: number;
  color: string;
  alineacion: "left" | "center" | "right";
};

export const Texto: ComponentConfig<TextoProps> = {
  label: "Texto",
  fields: {
    texto: { type: "textarea", label: "Texto" },
    tag: {
      type: "select",
      label: "Etiqueta",
      options: [
        { label: "Párrafo (p)", value: "p" },
        { label: "Título 1 (h1)", value: "h1" },
        { label: "Título 2 (h2)", value: "h2" },
        { label: "Título 3 (h3)", value: "h3" },
      ],
    },
    tamano: { type: "number", label: "Tamaño (px)", min: 8, max: 160 },
    color: { type: "text", label: "Color", placeholder: "#111111" },
    alineacion: {
      type: "radio",
      label: "Alineación",
      options: [
        { label: "Izquierda", value: "left" },
        { label: "Centro", value: "center" },
        { label: "Derecha", value: "right" },
      ],
    },
  },
  defaultProps: {
    texto: "Escribí tu texto",
    tag: "p",
    tamano: 16,
    color: "#111111",
    alineacion: "left",
  },
  render: ({ texto, tag: Tag, tamano, color, alineacion }) => (
    <Tag
      style={{
        margin: 0,
        fontSize: tamano,
        color: color || undefined,
        textAlign: alineacion,
        // Respeta los saltos de línea del textarea.
        whiteSpace: "pre-wrap",
      }}
    >
      {texto}
    </Tag>
  ),
};
