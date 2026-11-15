"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import type { AgentStep } from "@/lib/agent/types";
import { Icon } from "./Icon";
import { cx } from "./ui";

export function MicButton({
  listening,
  onClick,
  label,
  size = 112,
}: {
  listening: boolean;
  onClick: () => void;
  label?: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        aria-label={label}
        aria-pressed={listening}
        className={cx("grid place-items-center rounded-full transition", listening ? "bg-scam-subtle" : "bg-primary-subtle")}
        style={{ width: size + 32, height: size + 32 }}
      >
        <span
          className={cx("grid place-items-center rounded-full text-white", listening ? "pulse bg-scam" : "bg-primary active:bg-primary-deep")}
          style={{ width: size, height: size }}
        >
          <Icon name="mic" size={Math.round(size * 0.32)} />
        </span>
      </button>
      {label && <p className="mt-4 text-[16px] font-semibold">{label}</p>}
    </div>
  );
}

/** S/01 Loading · checking — staged progress rows. */
export function CheckProgress({ working, steps }: { working: boolean; steps: AgentStep[] }) {
  const { t } = useApp();
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!working) return;
    setStage(0);
    const a = setTimeout(() => setStage(1), 900);
    const b = setTimeout(() => setStage(2), 2600);
    const c = setTimeout(() => setStage(3), 9000);
    return () => [a, b, c].forEach(clearTimeout);
  }, [working]);

  const rows: { label: string; done: boolean }[] = [
    { label: t("understood"), done: stage >= 1 || !working },
    { label: t("checkedPatterns"), done: stage >= 2 || steps.includes("patterns") },
    { label: stage >= 3 ? t("checkingGovDone") : t("checkingGov"), done: stage >= 3 },
    ...(stage >= 3 ? [{ label: t("writingAnswer"), done: false }] : []),
  ];
  const current = rows.findIndex((r) => !r.done);
  return (
    <div className="rounded-lg bg-surface p-4 shadow-e1" aria-live="polite">
      {rows.slice(0, current === -1 ? rows.length : current + 1).map((r, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          {r.done ? (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-real text-white">
              <Icon name="check" size={14} strokeWidth={3} />
            </span>
          ) : (
            <Icon name="clock" size={20} className="animate-pulse text-primary" />
          )}
          <span className={cx("text-[16px]", r.done ? "text-ink" : "text-ink-2")}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}
