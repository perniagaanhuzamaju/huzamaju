"use client";

import { useState } from "react";

/** Shows a full bank account number on demand; every reveal is written to the audit log. */
export function RevealBank({ partnerId, last4 }: { partnerId: number; last4: string }) {
  const [acct, setAcct] = useState<string | null>(null);
  return acct ? (
    <span className="font-mono">{acct}</span>
  ) : (
    <button
      type="button"
      className="underline"
      onClick={async () => {
        const r = await fetch(`/api/admin/partners/${partnerId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reveal" }) });
        const j = await r.json().catch(() => ({}));
        setAcct(r.ok ? j.account : j.error || "Ralat");
      }}
    >
      ****{last4} (papar)
    </button>
  );
}
