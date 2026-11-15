"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { speechLang } from "@/lib/i18n";
import { speak, stopSpeaking } from "@/lib/speech";
import { Icon } from "./Icon";
import { Button, ListenButton } from "./ui";
import { useUI } from "./AppShell";

const SILENCE_MS = 45_000;

/** Flow D: spoken + written summary → yes / no → silence = no → audit log. */
export function ConfirmSheet() {
  const { s, t, applyProposal } = useApp();
  const { proposal, setProposal, showToast } = useUI();
  const [left, setLeft] = useState(SILENCE_MS / 1000);
  const decided = useRef(false);

  useEffect(() => {
    if (!proposal) return;
    decided.current = false;
    setLeft(SILENCE_MS / 1000);
    if (s.readAloud) speak(proposal.summary, speechLang(s.lang));
    const tick = setInterval(() => setLeft((x) => x - 1), 1000);
    const timer = setTimeout(() => {
      if (!decided.current) {
        decided.current = true;
        setProposal(null);
        showToast(t("changeCancelled"));
      }
    }, SILENCE_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(timer);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal]);

  if (!proposal) return null;

  const decide = (yes: boolean) => {
    decided.current = true;
    if (yes) {
      applyProposal(proposal);
      showToast(t("changeSaved"));
    } else showToast(t("changeCancelled"));
    setProposal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="sheet-in w-full max-w-[420px] rounded-t-[24px] bg-surface px-6 pt-6 pb-6">
        <div className="flex items-center gap-2">
          <Icon name="lock" className="text-primary-deep" />
          <h2 id="confirm-title" className="title text-[20px] font-bold">
            {t("confirm")}
          </h2>
        </div>
        <p className="mt-3 text-[18px] leading-relaxed">{proposal.summary}</p>
        <ListenButton text={proposal.summary} className="mt-4" />
        <div className="mt-5 flex flex-col gap-3">
          <Button onClick={() => decide(true)}>{t("yesConfirm")}</Button>
          <Button variant="secondary" onClick={() => decide(false)}>
            {t("no")}
          </Button>
        </div>
        <p className="mt-3 text-center text-[13px] text-ink-2">
          {t("silenceNo")} <span className="num">({left}s)</span>
        </p>
      </div>
    </div>
  );
}
