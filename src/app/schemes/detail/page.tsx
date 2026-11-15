"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { fmtDate, uiLang } from "@/lib/i18n";
import { INCOME_MID, schemeById, SCHEMES } from "@/lib/schemes";
import { Icon } from "@/components/Icon";
import { Badge, Button, Card, ListenButton, Screen, TopBar, cx } from "@/components/ui";

// M/18 Scheme · Detail
export default function SchemeDetail() {
  const { s, t } = useApp();
  const L = uiLang(s.lang);
  const scheme = schemeById(s.viewSchemeId ?? "") ?? SCHEMES[0];
  const [docs, setDocs] = useState<boolean[]>(() => scheme.docs.map((_, i) => i === 0));
  const elig = scheme.eligible({ age: s.profile.age, monthlyIncome: INCOME_MID[s.income], hasBank: s.profile.hasBank, informal: true });
  const spoken = `${scheme.name[L]}. ${scheme.desc[L]} ${t("docsNeeded")}: ${scheme.docs.map((d) => d[L]).join(", ")}. ${t("howToGet")}: ${scheme.steps
    .map((x) => x[L])
    .join(". ")}`;

  return (
    <>
      <TopBar title={scheme.name[L]} />
      <Screen>
        <div className="mt-1 flex items-center justify-between">
          {elig.status === "yes" ? (
            <Badge tone="real" icon="check">
              {t("youQualify")}
            </Badge>
          ) : (
            <Badge tone="caution" icon="alert">
              {t("needsChecking")}
            </Badge>
          )}
          <ListenButton text={spoken} />
        </div>
        <p className="mt-4 text-[18px] leading-relaxed">{scheme.desc[L]}</p>
        <p className="mt-3 text-[13px] text-ink-2">
          {t("source")}: {scheme.site} · {t("lastChecked", { date: fmtDate(Date.now() - 5 * 86400_000, s.lang) }).toLowerCase()}
        </p>

        <Card className="mt-4 p-4">
          <h2 className="text-[16px] font-semibold">{t("docsNeeded")}</h2>
          <ul className="mt-2">
            {scheme.docs.map((d, i) => (
              <li key={i}>
                <label className="flex min-h-[52px] cursor-pointer items-center gap-3 py-2 text-[18px]">
                  <input
                    type="checkbox"
                    checked={docs[i]}
                    onChange={() => setDocs((p) => p.map((x, j) => (j === i ? !x : x)))}
                    className="h-6 w-6 shrink-0 accent-[#3442b8]"
                  />
                  {d[L]}
                </label>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mt-4 p-4">
          <h2 className="text-[16px] font-semibold">{t("howToGet")}</h2>
          <ol className="mt-3 space-y-3">
            {scheme.steps.map((st, i) => (
              <li key={i} className="flex gap-3 text-[16px] leading-relaxed">
                <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-subtle text-[14px] font-semibold text-primary-deep">{i + 1}</span>
                {st[L]}
              </li>
            ))}
          </ol>
        </Card>

        <div className="mt-4 flex gap-3 rounded-md bg-caution-subtle p-4 text-[14px] text-caution">
          <Icon name="alert" size={20} className="shrink-0" />
          {t("freeWarning", { num: scheme.helpline })}
        </div>

        <div className={cx("mt-5 flex flex-col gap-2")}>
          <Button href="/schemes/form" iconRight="arrowRight">
            {t("helpFillForm")}
          </Button>
          <a href={scheme.url} target="_blank" rel="noreferrer" className="flex min-h-[52px] items-center justify-center text-[16px] font-semibold text-primary-deep">
            {t("openGovSite")}
          </a>
        </div>
      </Screen>
    </>
  );
}
