import type { Field } from "@/lib/admin/resources";
import { fieldValue } from "@/lib/admin/resources";

/** Renders inputs for a resource form; values are serialised strings, coerced on the server. */
export function ResourceFields({ fields, row, prefix }: { fields: Field[]; row?: Record<string, unknown>; prefix: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((f) => {
        const id = `${prefix}-${f.name}`;
        const v = row ? fieldValue(f, row[f.name]) : f.type === "bool" ? "true" : "";
        const wide = f.wide || f.type === "textarea" || f.type === "lines" || f.type === "json";
        if (f.type === "bool")
          return (
            <label key={f.name} className="flex items-start gap-2 text-sm md:col-span-2">
              <input type="checkbox" name={f.name} defaultChecked={row ? row[f.name] === true : f.name !== "consentToPublish"} className="mt-1" />
              <span>{f.label}{f.help && <span className="block text-xs text-mute">{f.help}</span>}</span>
            </label>
          );
        return (
          <div key={f.name} className={wide ? "md:col-span-2" : ""}>
            <label className="label" htmlFor={id}>{f.label}{f.required && " *"}</label>
            {f.type === "select" ? (
              <select id={id} name={f.name} defaultValue={v} required={f.required} className="field">
                {!f.required && <option value="">-</option>}
                {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === "textarea" || f.type === "lines" || f.type === "json" ? (
              <textarea id={id} name={f.name} defaultValue={v} required={f.required} rows={f.name === "body" ? 14 : 3} className="field font-mono text-sm" />
            ) : (
              <input id={id} name={f.name} defaultValue={v} required={f.required} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} step={f.type === "number" ? "any" : undefined} className="field" />
            )}
            {f.help && <p className="mt-1 text-xs text-mute">{f.help}</p>}
          </div>
        );
      })}
    </div>
  );
}
