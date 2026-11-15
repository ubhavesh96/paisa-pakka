"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { speechLang } from "@/lib/i18n";
import { useSpeechInput } from "@/lib/speech";
import { useAgent } from "@/lib/useAgent";
import { CheckProgress, MicButton } from "@/components/Agent";
import { Icon } from "@/components/Icon";
import { Button, Card, Screen, StateBlock, TopBar } from "@/components/ui";
import { useUI } from "@/components/AppShell";

// M/07 Check · Ask, M/07b Listening, S/01–S/05
export default function CheckPage() {
  const { s, t, set } = useApp();
  const ui = useUI();
  const agent = useAgent();
  const [text, setText] = useState("");
  const [lastQ, setLastQ] = useState("");

  const check = (q: string) => {
    const question = q.trim();
    if (!question) return;
    setLastQ(question);
    agent.run([{ role: "user", text: question }], "check");
  };

  const mic = useSpeechInput(speechLang(s.lang), (final) => check(final));
  const micDenied = mic.error === "denied" || mic.error === "unsupported" || s.micAllowed === false;

  // Retry a question saved while offline (S/03) once we're back online.
  useEffect(() => {
    if (ui.online && s.pendingQuestion && agent.phase !== "working") {
      const q = s.pendingQuestion;
      set({ pendingQuestion: null });
      check(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.online]);

  if (mic.listening)
    return (
      <>
        <TopBar title={t("isItReal")} onBack={mic.stop} />
        <Screen footer={<Button variant="secondary" className="w-full" onClick={mic.stop}>{t("stop")}</Button>}>
          <div className="mt-6">
            <MicButton listening onClick={mic.stop} label={t("listening")} />
          </div>
          <Card className="mt-6 p-4">
            <p className="text-[14px] text-ink-2">{t("youreSaying")}</p>
            <p className="mt-2 text-[18px] leading-relaxed">“{mic.transcript || "…"}”</p>
          </Card>
        </Screen>
      </>
    );

  const p = agent.phase;

  if (p === "slow")
    return (
      <>
        <TopBar title={t("isItReal")} />
        <Screen>
          <StateBlock icon="clock" title={t("slowTitle")} body={t("slowBody")}>
            <Button onClick={() => check(lastQ)}>{t("tryAgain")}</Button>
            <Button variant="secondary" onClick={() => agent.setPhase("working")}>
              {t("keepWaiting")}
            </Button>
          </StateBlock>
        </Screen>
      </>
    );

  if (p === "offline")
    return (
      <>
        <TopBar title={t("isItReal")} />
        <Screen>
          <StateBlock icon="wifiOff" title={t("offlineTitle")} body={t("offlineBody")}>
            <Button variant="secondary" href="/me/activity">
              {t("seePastChecks")}
            </Button>
          </StateBlock>
        </Screen>
      </>
    );

  if (p === "error" || p === "no_key")
    return (
      <>
        <TopBar title={t("isItReal")} />
        <Screen>
          <StateBlock icon="alert" tone="scam" title={t("errorTitle")} body={p === "no_key" ? t("apiKeyMissing") : t("errorBody")}>
            <Button onClick={() => check(lastQ)}>{t("tryAgain")}</Button>
            <Button variant="secondary" href="/me/help">
              {t("helpline")}
            </Button>
          </StateBlock>
        </Screen>
      </>
    );

  if (p === "working")
    return (
      <>
        <TopBar title={t("isItReal")} onBack={agent.cancel} />
        <Screen>
          <div className="mt-8 opacity-90">
            <MicButton listening={false} onClick={() => {}} />
          </div>
          <div className="mt-6">
            <CheckProgress working steps={agent.steps} />
          </div>
          <p className="mt-4 px-3 text-center text-[13px] text-ink-2">{t("over10s")}</p>
        </Screen>
      </>
    );

  return (
    <>
      <TopBar title={t("isItReal")} />
      <Screen
        nav
        footer={
          <Button className="w-full" iconRight="arrowRight" disabled={!text.trim()} onClick={() => check(text)}>
            {t("checkIt")}
          </Button>
        }
      >
        {micDenied ? (
          <div className="mt-2 flex gap-3 rounded-md bg-caution-subtle p-4 text-[15px] text-caution">
            <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
            {t("micDenied")}
          </div>
        ) : (
          <>
            <p className="mt-1 text-[18px] leading-relaxed text-ink-2">{t("checkIntro")}</p>
            <div className="mt-6">
              <MicButton listening={false} onClick={mic.start} label={t("tapSpeak")} />
            </div>
          </>
        )}
        <Card className="mt-6 p-4">
          <label htmlFor="msg" className="text-[14px] text-ink-2">
            {micDenied ? t("typeQuestion") : t("orPaste")}
          </label>
          <textarea
            id="msg"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={micDenied ? 4 : 2}
            placeholder={t("pastePlaceholder")}
            className="mt-2 w-full resize-none bg-transparent text-[18px] leading-relaxed outline-none placeholder:text-control"
          />
          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={async () => {
              try {
                const clip = await navigator.clipboard.readText();
                if (clip) setText(clip);
              } catch {
                document.getElementById("msg")?.focus();
              }
            }}
          >
            {t("paste")}
          </Button>
        </Card>
        <Link href="/check/loan" className="mt-4 flex items-center justify-between rounded-lg bg-surface p-4 shadow-e1">
          <span className="flex items-center gap-3 text-[16px] font-semibold">
            <Icon name="rupee" className="text-primary-deep" />
            {t("loanCheck")}
          </span>
          <Icon name="chevronRight" className="text-ink-2" />
        </Link>
      </Screen>
    </>
  );
}
