import type { Config } from "@puckeditor/core";
import { Boton, type BotonProps } from "./components/Boton";
import { Contenedor, type ContenedorProps } from "./components/Contenedor";
import { Imagen, type ImagenProps } from "./components/Imagen";
import { Texto, type TextoProps } from "./components/Texto";
import { colorField } from "./fields/ColorField";

type Components = {
  Contenedor: ContenedorProps;
  Texto: TextoProps;
  Imagen: ImagenProps;
  Boton: BotonProps;
};

// "title" es el nombre que Puck usa por defecto para el título de la página.
type RootProps = {
  title: string;
  fondo: string;
};

export const config: Config<Components, RootProps> = {
  root: {
    fields: {
      title: { type: "text", label: "Título de la página" },
      fondo: colorField("Fondo de la página"),
    },
    defaultProps: {
      title: "",
      fondo: "#ffffff",
    },
    render: ({ children, fondo }) => (
      <div style={{ background: fondo || undefined, minHeight: "100vh" }}>
        {children}
      </div>
    ),
  },
  components: {
    Contenedor,
    Texto,
    Imagen,
    Boton,
  },
};

export default config;
