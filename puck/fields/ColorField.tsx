import { FieldLabel, type CustomField } from "@puckeditor/core";
import { useState } from "react";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

// <input type="color"> solo acepta #rrggbb: se expande #rgb y se usa negro si
// no hay valor.
function toColorInputValue(hex: string): string {
  if (!HEX.test(hex)) return "#000000";
  if (hex.length === 4) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return hex.toLowerCase();
}

type ColorInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

function ColorInput({ label, value, onChange, readOnly }: ColorInputProps) {
  // El texto se guarda aparte para poder escribir valores incompletos
  // ("#12") sin que se publiquen hasta que sean un hex válido.
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Si el valor cambia desde afuera (el picker, deshacer/rehacer), se
  // sincroniza el texto durante el render, sin un efecto.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  function handleTextChange(text: string) {
    setDraft(text);
    // Vacío significa "sin color".
    if (text === "" || HEX.test(text)) onChange(text);
  }

  return (
    <FieldLabel label={label} el="div" readOnly={readOnly}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="color"
          aria-label={`${label}: selector`}
          value={toColorInputValue(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          style={{ width: 40, height: 32, padding: 0, border: "none", background: "none", cursor: "pointer" }}
        />
        <input
          type="text"
          aria-label={`${label}: hex`}
          value={draft}
          placeholder="sin color"
          maxLength={7}
          spellCheck={false}
          onChange={(e) => handleTextChange(e.target.value.trim())}
          // Al salir del campo, un valor inválido vuelve al último válido.
          onBlur={() => setDraft(value)}
          readOnly={readOnly}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "6px 8px",
            fontFamily: "monospace",
            border: `1px solid ${draft === "" || HEX.test(draft) ? "#ccc" : "#d33"}`,
            borderRadius: 4,
          }}
        />
      </div>
    </FieldLabel>
  );
}

export function colorField(label: string): CustomField<string> {
  return {
    type: "custom",
    label,
    render: ({ field, value, onChange, readOnly }) => (
      <ColorInput
        label={field.label ?? label}
        value={value ?? ""}
        onChange={onChange}
        readOnly={readOnly}
      />
    ),
  };
}
