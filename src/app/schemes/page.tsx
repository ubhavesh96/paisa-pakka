"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp, type Income } from "@/lib/store";
import { uiLang, type StringKey } from "@/lib/i18n";
import { INCOME_MID, matchSchemes } from "@/lib/schemes";
import { Icon } from "@/components/Icon";
import { Badge, Button, Card, Chip, Screen, StateBlock, TopBar } from "@/components/ui";

const INCOME_LABEL: Record<Income, string> = { under10: "<₹10k", "10to15": "₹10–15k", "15to25": "₹15–25k", over25: ">₹25k" };
const INCOME_KEY: Record<Income, StringKey> = { under10: "under10", "10to15": "r10to15", "15to25": "r15to25", over25: "over25" };

// M/17 Schemes · For you, S/07 No results
export default function SchemesPage() {
  const { s, t, set } = useApp();
  const router = useRouter();
  const L = uiLang(s.lang);
  const [editing, setEditing] = useState(false);
  const { profile } = s;
  const list = matchSchemes({ age: profile.age, monthlyIncome: INCOME_MID[s.income], hasBank: profile.hasBank, informal: true });
  const yes = list.filter((m) => m.status === "yes").length;
  const check = list.length - yes;

  const open = (id: string) => {
    set({ viewSchemeId: id });
    router.push("/schemes/detail");
  };

  return (
    <>
      <TopBar title={t("schemesForYou")} />
      <Screen nav>
        {editing ? (
          <Card className="mt-2 space-y-4 p-4">
            <div>
              <p className="text-[16px] font-semibold">{t("age")}</p>
              <div className="mt-2 flex items-center gap-3">
                <button className="grid h-12 w-12 place-items-center rounded-full bg-muted text-[22px]" onClick={() => set({ profile: { ...profile, age: Math.max(14, profile.age - 1) } })}>
                  −
                </button>
                <span className="num w-16 text-center text-[22px] font-semibold">{profile.age}</span>
                <button className="grid h-12 w-12 place-items-center rounded-full bg-muted text-[22px]" onClick={() => set({ profile: { ...profile, age: Math.min(80, profile.age + 1) } })}>
                  +
                </button>
              </div>
            </div>
            <div>
              <p className="text-[16px] font-semibold">{t("howMuchEarn")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(INCOME_KEY) as Income[]).map((k) => (
                  <Chip key={k} selected={s.income === k} onClick={() => set({ income: k })}>
                    <span className="num text-[14px]">{t(INCOME_KEY[k])}</span>
                  </Chip>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => setEditing(false)}>
              {t("done")}
            </Button>
          </Card>
        ) : list.length === 0 ? (
          <StateBlock icon="file" title={t("noSchemesTitle")} body={t("noSchemesBody")}>
            <Button onClick={() => setEditing(true)}>{t("changeDetails")}</Button>
            <Button variant="secondary" href="/me/help">
              {t("getHelp")}
            </Button>
          </StateBlock>
        ) : (
          <>
            <h1 className="title mt-1 text-[22px] font-bold">{check ? t("schemesCount", { n: yes, m: check }) : t("schemesCount", { n: yes, m: 0 }).split(",")[0]}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[t("years", { n: profile.age }), L === "en" ? "Delivery" : "डिलीवरी", INCOME_LABEL[s.income], L === "en" ? profile.state : "हरियाणा"].map((c) => (
                <span key={c} className="num rounded-full border border-line-strong bg-surface px-3 py-1 text-[14px]">
                  {c}
                </span>
              ))}
              <button onClick={() => setEditing(true)} className="px-1 text-[15px] font-medium text-primary-deep">
                {t("change")}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {list.map(({ scheme, status, why }) => (
                <button key={scheme.id} onClick={() => open(scheme.id)} className="block w-full text-left">
                  <Card className="p-4 active:bg-muted">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-[17px] font-semibold leading-snug">{scheme.name[L]}</h2>
                      {status === "yes" ? (
                        <Badge tone="real" icon="check">
                          {t("youQualify")}
                        </Badge>
                      ) : (
                        <Badge tone="caution" icon="alert">
                          {t("needsChecking")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{scheme.short[L]}</p>
                    <p className="mt-2 flex items-start gap-2 text-[14px] text-primary-deep">
                      <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                      {t("whyYou")}: {why[L]}
                    </p>
                  </Card>
                </button>
              ))}
            </div>
            <Link href="/schemes/applications" className="mt-4 flex items-center justify-between rounded-lg bg-surface p-4 shadow-e1">
              <span className="flex items-center gap-3 text-[16px] font-semibold">
                <Icon name="file" className="text-primary-deep" />
                {t("myApplications")}
              </span>
              <Icon name="chevronRight" className="text-ink-2" />
            </Link>
          </>
        )}
      </Screen>
    </>
  );
}
