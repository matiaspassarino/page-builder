import type { Config } from "@puckeditor/core";
import { Contenedor, type ContenedorProps } from "./components/Contenedor";
import { Texto, type TextoProps } from "./components/Texto";

type Components = {
  Contenedor: ContenedorProps;
  Texto: TextoProps;
};

export const config: Config<Components> = {
  components: {
    Contenedor,
    Texto,
  },
};

export default config;
