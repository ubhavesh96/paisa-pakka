"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { inr } from "@/lib/i18n";
import { loanCost } from "@/lib/calc";
import { AmountField } from "@/components/AmountField";
import { Icon } from "@/components/Icon";
import { Chip, ListenButton, Screen, TopBar, cx } from "@/components/ui";

// M/11 Loan checker
export default function LoanPage() {
  const { s, t, addActivity } = useApp();
  const [amount, setAmount] = useState("10000");
  const [repay, setRepay] = useState("14800");
  const [weeks, setWeeks] = useState(12);
  const [logged, setLogged] = useState(false);

  const p = Number(amount) || 0;
  const r = Number(repay) || 0;
  const c = p > 0 && r > 0 ? loanCost(p, r, weeks) : null;
  const en = s.lang === "en";

  const explain = c
    ? en
      ? `₹${c.per100} extra on every ₹100 in ${weeks} weeks. That’s about ${c.yearlyPct}% a year. ${
          c.rating === "fair" ? "That’s in line with banks and self-help groups." : "A bank or self-help group may charge far less."
        }`
      : `${weeks} हफ़्ते में हर ₹100 पर ₹${c.per100} ज़्यादा। यह साल का लगभग ${c.yearlyPct}% है। ${
          c.rating === "fair" ? "यह बैंक और स्वयं सहायता समूह जैसा ही है।" : "बैंक या स्वयं सहायता समूह से कम में मिल सकता है।"
        }`
    : "";

  const TXT = { scam: "text-scam", caution: "text-caution", real: "text-real" } as const;
  const tone = c?.rating === "fair" ? "real" : c?.rating === "costly" ? "caution" : "scam";
  const head = c?.rating === "fair" ? t("fairLoan") : c?.rating === "costly" ? t("costlyLoan") : t("expensiveLoan");

  const log = () => {
    if (!c || logged) return;
    setLogged(true);
    addActivity({ type: "loan", title: `Loan check: ₹${inr(p)}`, sub: head, icon: "loan" });
  };

  return (
    <>
      <TopBar title={t("loanCheck")} />
      <Screen nav>
        <p className="mt-1 text-[18px] text-ink-2">{t("loanIntro")}</p>
        <div className="mt-4 space-y-4">
          <AmountField id="amt" label={t("loanAmount")} value={amount} onChange={setAmount} />
          <AmountField id="repay" label={t("loanRepay")} value={repay} onChange={setRepay} hint={t("allInstalments")} />
          <div>
            <p className="text-[16px] font-semibold">{t("loanWeeks")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[4, 8, 12, 26, 52].map((w) => (
                <Chip key={w} selected={weeks === w} onClick={() => setWeeks(w)}>
                  <span className="num">{w}</span>
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {c && (
          <div
            onPointerDown={log}
            className={cx(
              "mt-5 rounded-lg border-[1.5px] p-4",
              tone === "scam" && "border-scam bg-scam-subtle",
              tone === "caution" && "border-caution-line bg-caution-subtle",
              tone === "real" && "border-real bg-real-subtle",
            )}
          >
            <p className={cx("flex items-center gap-2 text-[16px] font-semibold", TXT[tone])}>
              <Icon name={tone === "real" ? "check" : "alert"} size={20} />
              {head}
            </p>
            <p className={cx("num mt-1 text-[32px] font-bold", TXT[tone])}>{t("extra", { amt: inr(c.extra) })}</p>
            <p className="mt-1 text-[15px] leading-relaxed">{explain}</p>
            <ListenButton text={`${head}. ${t("extra", { amt: inr(c.extra) })}. ${explain}`} className="mt-3" />
          </div>
        )}
      </Screen>
    </>
  );
}
