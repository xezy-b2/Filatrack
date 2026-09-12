"use client";

import { useState, type ReactNode } from "react";

export default function MemberProfileTabs({
  spoolsContent,
  profileContent,
}: {
  spoolsContent: ReactNode;
  profileContent: ReactNode;
}) {
  const [tab, setTab] = useState<"bobines" | "profil">("bobines");

  const tabClass = (active: boolean) =>
    `border-b-2 px-1 pb-3 text-sm font-semibold transition ${
      active
        ? "border-orange-600 text-orange-600"
        : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
    }`;

  return (
    <div>
      <div className="mt-6 flex gap-6 border-b border-slate-200 dark:border-slate-800">
        <button type="button" onClick={() => setTab("bobines")} className={tabClass(tab === "bobines")}>
          Ses bobines
        </button>
        <button type="button" onClick={() => setTab("profil")} className={tabClass(tab === "profil")}>
          Profil
        </button>
      </div>
      <div className="mt-6">{tab === "bobines" ? spoolsContent : profileContent}</div>
    </div>
  );
}
