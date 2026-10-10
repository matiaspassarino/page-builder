import type { ComponentConfig, Slot } from "@puckeditor/core";
import type { CSSProperties } from "react";

type Justificar = "start" | "center" | "end" | "space-between";
type Alinear = "stretch" | "start" | "center" | "end";

export type ContenedorProps = {
  contenido: Slot;
  display: "block" | "flex" | "grid";
  direccion: "row" | "column";
  columnas: number;
  gap: number;
  padding: number;
  fondo: string;
  maxWidth: number;
  justificar: Justificar;
  alinear: Alinear;
};

// Estilos del slot según el modo. Puck envuelve cada hijo en un div, y esos
// divs son los que quedan como ítems del flex o del grid.
function layoutStyle(
  props: Omit<ContenedorProps, "contenido">
): CSSProperties {
  const { display, direccion, columnas, gap, justificar, alinear } = props;

  switch (display) {
    case "flex":
      return {
        display: "flex",
        flexDirection: direccion,
        gap,
        justifyContent: justificar,
        alignItems: alinear,
      };
    case "grid":
      return {
        display: "grid",
        gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
        gap,
        // En grid no existe space-between para ítems: se reparte con stretch.
        justifyItems: justificar === "space-between" ? "stretch" : justificar,
        alignItems: alinear,
      };
    default:
      return { display: "block" };
  }
}

export const Contenedor: ComponentConfig<ContenedorProps> = {
  label: "Contenedor",
  fields: {
    contenido: { type: "slot" },
    display: {
      type: "radio",
      label: "Display",
      options: [
        { label: "Block", value: "block" },
        { label: "Flex", value: "flex" },
        { label: "Grid", value: "grid" },
      ],
    },
    direccion: {
      type: "radio",
      label: "Dirección (flex)",
      options: [
        { label: "Fila", value: "row" },
        { label: "Columna", value: "column" },
      ],
    },
    columnas: {
      type: "number",
      label: "Columnas (grid)",
      min: 1,
      max: 6,
    },
    gap: { type: "number", label: "Gap (px)", min: 0 },
    padding: { type: "number", label: "Padding (px)", min: 0 },
    fondo: { type: "text", label: "Fondo", placeholder: "#ffffff" },
    maxWidth: {
      type: "number",
      label: "Ancho máximo (px, 0 = sin límite)",
      min: 0,
    },
    justificar: {
      type: "select",
      label: "Justificar",
      options: [
        { label: "Inicio", value: "start" },
        { label: "Centro", value: "center" },
        { label: "Fin", value: "end" },
        { label: "Espacio entre", value: "space-between" },
      ],
    },
    alinear: {
      type: "select",
      label: "Alinear",
      options: [
        { label: "Estirar", value: "stretch" },
        { label: "Inicio", value: "start" },
        { label: "Centro", value: "center" },
        { label: "Fin", value: "end" },
      ],
    },
  },
  defaultProps: {
    contenido: [],
    display: "flex",
    direccion: "column",
    columnas: 2,
    gap: 16,
    padding: 24,
    fondo: "",
    maxWidth: 0,
    justificar: "start",
    alinear: "stretch",
  },
  render: ({ contenido: Contenido, ...props }) => (
    // El fondo y el padding van afuera; el ancho máximo centra el contenido.
    <div style={{ background: props.fondo || undefined, padding: props.padding }}>
      <Contenido
        minEmptyHeight={64}
        style={{
          ...layoutStyle(props),
          maxWidth: props.maxWidth > 0 ? props.maxWidth : undefined,
          marginInline: "auto",
        }}
      />
    </div>
  ),
};
