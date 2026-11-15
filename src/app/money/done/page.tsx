"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { inr } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { Button, ListenButton, Screen, cx } from "@/components/ui";

// M/14 Payday · Done
export default function DonePage() {
  const { s, t } = useApp();
  const [amt, setAmt] = useState(s.savings.tip);
  useEffect(() => {
    const q = Number(new URLSearchParams(window.location.search).get("amt"));
    if (q > 0) setAmt(q);
  }, []);
  const { streak, balance } = s.savings;
  const title = t("wellDone", { amt: inr(amt) });
  const line = t("streakLine", { n: streak, bal: inr(balance) });

  return (
    <Screen nav footer={<Button className="w-full" href="/home">{t("goHome")}</Button>}>
      <div className="flex flex-1 flex-col items-center pt-20 text-center">
        <div className="relative">
          <span className="grid h-28 w-28 place-items-center rounded-full bg-real-subtle text-real">
            <Icon name="check" size={48} strokeWidth={1.75} />
          </span>
          <span className="stamp title absolute -top-2 -right-20 grid h-24 w-24 place-items-center rounded-full border-[3px] border-real text-[20px] font-bold tracking-wider text-real outline-2 outline-offset-[-8px] outline-real/60 outline-dashed">
            PAKKA
          </span>
        </div>
        <h1 className="title mt-6 text-[26px] font-bold">{title}</h1>
        <p className="mt-3 max-w-[300px] text-[17px] leading-relaxed text-ink-2">{line}</p>
        <ListenButton text={`${title}. ${line}`} className="mt-5" />
        <div className="mt-6 flex gap-2.5" aria-label={`${streak}/7`}>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={cx("h-8 w-8 rounded-full", i < Math.min(streak, 7) ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <p className="mt-4 text-[13px] text-ink-2">{t("staysInAccount")}</p>
      </div>
    </Screen>
  );
}
