/** A touch/keyboard choice group used by the mission workbenches. */
export function WorkbenchChoices({
  field,
  label,
  options,
  fields,
  set,
  disabled,
  className = "iva",
}: {
  field: string;
  label: string;
  options: [string, string][];
  fields: Record<string, string>;
  set: (key: string, value: string) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <fieldset className={`${className}-choices`} disabled={disabled}>
      <legend>{label}</legend>
      {options.map(([value, text]) => (
        <button
          type="button"
          key={value}
          className={`${className}-token ${fields[field] === value ? "selected" : ""}`}
          aria-pressed={fields[field] === value}
          onClick={() => set(field, value)}
        >
          {text}
        </button>
      ))}
    </fieldset>
  );
}
