import type { ComponentConfig } from "@puckeditor/core";

export type ImagenProps = {
  src: string;
  alt: string;
  ancho: number;
  radio: number;
};

export const Imagen: ComponentConfig<ImagenProps> = {
  label: "Imagen",
  fields: {
    src: { type: "text", label: "URL de la imagen", placeholder: "https://…" },
    alt: { type: "text", label: "Texto alternativo" },
    ancho: { type: "number", label: "Ancho (%)", min: 1, max: 100 },
    radio: { type: "number", label: "Radio del borde (px)", min: 0 },
  },
  defaultProps: {
    src: "",
    alt: "",
    ancho: 100,
    radio: 0,
  },
  render: ({ src, alt, ancho, radio }) => {
    const style = { display: "block", width: `${ancho}%`, borderRadius: radio };

    // Sin URL se muestra un recuadro, así el componente se ve en el editor.
    if (!src) {
      return (
        <div
          style={{
            ...style,
            aspectRatio: "16 / 9",
            display: "grid",
            placeItems: "center",
            background: "#e5e7eb",
            color: "#6b7280",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Sin imagen
        </div>
      );
    }

    // next/image necesita declarar cada dominio remoto en next.config.js, y acá
    // las URLs son arbitrarias. Por eso se usa <img> común.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} style={{ ...style, height: "auto" }} />;
  },
};
