"use client";

import { useApp } from "@/lib/store";
import { speechLang } from "@/lib/i18n";
import { useSpeechInput } from "@/lib/speech";
import { Icon } from "./Icon";
import { cx } from "./ui";

const HI_NUM: Record<string, string> = { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" };

/** Parse spoken amounts: "650", "६५०", "10 हज़ार", "2 lakh", "fourteen thousand eight hundred" (digits only). */
export function parseAmount(text: string): number | null {
  const s = text.replace(/[०-९]/g, (d) => HI_NUM[d]).replace(/,/g, "").toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*(lakh|लाख|hazaar|hazar|हज़ार|हजार|thousand|k)?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (m[2]) n *= /lakh|लाख/.test(m[2]) ? 100000 : 1000;
  return Math.round(n);
}

/** Rupee input with a mic button ("You can also say it"). */
export function AmountField({
  id,
  label,
  value,
  onChange,
  hint,
  suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  suffix?: string;
}) {
  const { s, t } = useApp();
  const mic = useSpeechInput(speechLang(s.lang), (txt) => {
    const n = parseAmount(txt);
    if (n) onChange(String(n));
  });
  return (
    <div>
      <label htmlFor={id} className="text-[16px] font-semibold">
        {label}
      </label>
      <div className="mt-2 flex h-14 items-center gap-2 rounded-md border-2 border-primary-deep bg-surface pr-1.5 pl-4">
        <span className="num text-[18px]">₹</span>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          className="num min-w-0 flex-1 bg-transparent text-[18px] outline-none"
        />
        {suffix && <span className="text-[16px] text-ink-2">{suffix}</span>}
        <button
          type="button"
          onClick={() => (mic.listening ? mic.stop() : mic.start())}
          aria-label={t("canSay")}
          className={cx("grid h-11 w-11 place-items-center rounded-full", mic.listening ? "pulse bg-scam text-white" : "bg-primary-subtle text-primary-deep")}
        >
          <Icon name="mic" size={20} />
        </button>
      </div>
      <p className="mt-1 text-[13px] text-ink-2">{mic.listening ? mic.transcript || t("listening") : hint ?? t("canSay")}</p>
    </div>
  );
}
