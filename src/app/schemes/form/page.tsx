"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { uiLang } from "@/lib/i18n";
import { schemeById, SCHEMES } from "@/lib/schemes";
import { Icon } from "@/components/Icon";
import { Button, Card, Screen, TopBar } from "@/components/ui";

type Field = "name" | "age" | "work" | "place";

// M/19 Form Helper · Review
export default function FormReview() {
  const { s, t, set, addActivity } = useApp();
  const router = useRouter();
  const L = uiLang(s.lang);
  const scheme = schemeById(s.viewSchemeId ?? "") ?? SCHEMES[0];
  const p = s.profile;
  const [edit, setEdit] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");

  const hiWork: Record<string, string> = { "Delivery partner": "डिलीवरी पार्टनर" };
  const rows: { key: Field; label: string; value: string }[] = [
    { key: "name", label: t("name"), value: L === "hi" && p.name === "Rahul Kumar" ? "राहुल कुमार" : p.name },
    { key: "age", label: t("age"), value: t("years", { n: p.age }) },
    { key: "work", label: t("work"), value: L === "hi" ? hiWork[p.work] ?? p.work : p.work },
    { key: "place", label: t("stateDistrict"), value: L === "hi" && p.state === "Haryana" && p.district === "Gurugram" ? "हरियाणा / गुरुग्राम" : `${p.state} / ${p.district}` },
  ];

  const save = (k: Field) => {
    const v = draft.trim();
    if (v) {
      if (k === "name") set({ profile: { ...p, name: v } });
      if (k === "age") set({ profile: { ...p, age: Number(v.replace(/\D/g, "")) || p.age } });
      if (k === "work") set({ profile: { ...p, work: v } });
      if (k === "place") {
        const [st, di] = v.split("/").map((x) => x.trim());
        set({ profile: { ...p, state: st || p.state, district: di || p.district } });
      }
    }
    setEdit(null);
  };

  const submit = () => {
    const done = s.applications[scheme.id] ?? 0;
    set({ applications: { ...s.applications, [scheme.id]: Math.max(done, 2) } });
    addActivity({ type: "form", title: `${scheme.name.en} form`, sub: "Sent on government site", icon: "form" });
    window.open(scheme.url, "_blank", "noopener");
    router.push("/schemes/applications");
  };

  return (
    <>
      <TopBar title={t("checkForm")} />
      <Screen footer={<Button className="w-full" onClick={submit}>{t("looksRight")}</Button>}>
        <p className="mt-1 text-[18px] leading-relaxed text-ink-2">{t("formIntro")}</p>
        <Card className="mt-4 divide-y divide-line px-4">
          {rows.map((r) => (
            <div key={r.key} className="py-3">
              <p className="text-[13px] text-ink-2">{r.label}</p>
              {edit === r.key ? (
                <div className="mt-1 flex gap-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && save(r.key)}
                    className="h-11 min-w-0 flex-1 rounded-md border-2 border-primary-deep px-3 text-[17px] outline-none"
                  />
                  <Button className="min-h-[44px] px-4" onClick={() => save(r.key)}>
                    {t("save")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[18px]">{r.value}</p>
                  <button
                    onClick={() => {
                      setDraft(r.key === "age" ? String(p.age) : r.value);
                      setEdit(r.key);
                    }}
                    className="text-[15px] font-medium text-primary-deep"
                  >
                    {t("change")}
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="py-3">
            <p className="text-[13px] text-ink-2">{t("bank")}</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[16px] text-ink-2">{t("bankSelf")}</p>
              <Icon name="lock" size={20} className="shrink-0 text-ink-2" />
            </div>
          </div>
        </Card>
        <div className="mt-4 flex gap-3 rounded-lg bg-primary-subtle p-4 text-[15px] text-primary-deep">
          <Icon name="help" size={22} className="shrink-0" />
          {t("otpNote")}
        </div>
      </Screen>
    </>
  );
}
