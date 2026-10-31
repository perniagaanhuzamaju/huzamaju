"use client";

import { useState } from "react";

export function CopyBox({ value, label = "Salin" }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      <input readOnly value={value} className="field flex-1 font-mono text-sm" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="btn btn-dark btn-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(value).catch(() => {});
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }}
      >
        {ok ? "Disalin" : label}
      </button>
    </div>
  );
}
