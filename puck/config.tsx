import type { Config } from "@puckeditor/core";
import { Boton, type BotonProps } from "./components/Boton";
import { Contenedor, type ContenedorProps } from "./components/Contenedor";
import { Imagen, type ImagenProps } from "./components/Imagen";
import { Texto, type TextoProps } from "./components/Texto";

type Components = {
  Contenedor: ContenedorProps;
  Texto: TextoProps;
  Imagen: ImagenProps;
  Boton: BotonProps;
};

export const config: Config<Components> = {
  components: {
    Contenedor,
    Texto,
    Imagen,
    Boton,
  },
};

export default config;
