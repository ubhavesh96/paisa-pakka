"use client";

import { useApp } from "@/lib/store";
import type { Lang } from "@/lib/i18n";
import { speak } from "@/lib/speech";
import { Icon } from "./Icon";
import { cx } from "./ui";

const OPTIONS: { id: Lang; label: string; sub: string; say: [string, string] }[] = [
  { id: "hi", label: "हिन्दी", sub: "Hindi", say: ["हिन्दी", "hi-IN"] },
  { id: "hinglish", label: "Hinglish", sub: "Roman Hindi", say: ["Hinglish, Roman Hindi", "hi-IN"] },
  { id: "en", label: "English", sub: "English", say: ["English", "en-IN"] },
];

/** M/02 + M/02b */
export function LanguagePicker() {
  const { s, set, t } = useApp();
  const hearAll = async () => {
    for (const o of OPTIONS) {
      await new Promise<void>((r) => speak(o.say[0], o.say[1], r));
    }
  };
  return (
    <div>
      <h1 className="title text-[28px] font-bold leading-tight">{t("chooseLanguage")}</h1>
      <p className="mt-2 text-[16px] text-ink-2">{t("sayLanguage")}</p>
      <div className="mt-6 flex flex-col gap-3" role="radiogroup">
        {OPTIONS.map((o) => {
          const sel = s.lang === o.id;
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={sel}
              onClick={() => set({ lang: o.id })}
              className={cx(
                "flex min-h-[64px] items-center justify-between rounded-md border-[1.5px] px-5 text-left",
                sel ? "border-primary-deep bg-primary-subtle" : "border-line bg-surface",
              )}
            >
              <span>
                <span className="block text-[17px] font-semibold">{o.label}</span>
                <span className="block text-[13px] text-ink-2">{o.sub}</span>
              </span>
              {sel && <Icon name="check" className="text-primary-deep" />}
            </button>
          );
        })}
      </div>
      <button onClick={hearAll} className="mt-6 flex h-14 w-full items-center gap-3 rounded-md bg-muted px-4 text-[15px] font-medium text-primary-deep">
        <Icon name="speaker" size={20} />
        {t("tapToHear")}
      </button>
    </div>
  );
}
