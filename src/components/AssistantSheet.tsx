"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { speechLang } from "@/lib/i18n";
import { useSpeechInput } from "@/lib/speech";
import { useAgent } from "@/lib/useAgent";
import { Icon } from "./Icon";
import { CheckProgress } from "./Agent";
import { ListenButton, cx } from "./ui";
import { useUI } from "./AppShell";

/** "Tap and ask anything": the general agent, available from every screen. */
export function AssistantSheet() {
  const { s, t } = useApp();
  const ui = useUI();
  const { run, phase, steps } = useAgent();
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || phase === "working") return;
    setText("");
    const next = [...ui.chat, { role: "user" as const, text: question }];
    ui.setChat(next);
    const res = await run(next, "chat");
    if (res) ui.setChat([...next, { role: "assistant", text: res.reply || "✓" }]);
  };

  const mic = useSpeechInput(speechLang(s.lang), (final) => send(final));

  useEffect(() => {
    if (!ui.assistantOpen) return;
    if (ui.assistantOpts.text) send(ui.assistantOpts.text);
    else if (ui.assistantOpts.listen && s.micAllowed !== false) mic.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.assistantOpen]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [ui.chat, phase, mic.transcript]);

  if (!ui.assistantOpen) return null;

  const empty = ui.chat.length === 0 && phase !== "working";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/45" onClick={ui.closeAssistant}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("askTitle")}
        onClick={(e) => e.stopPropagation()}
        className="sheet-in flex h-[88dvh] w-full max-w-[420px] flex-col rounded-t-[24px] bg-canvas"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="title text-[20px] font-bold">{t("askTitle")}</h2>
          <button aria-label="Close" onClick={ui.closeAssistant} className="grid h-11 w-11 place-items-center rounded-full active:bg-muted">
            <Icon name="x" />
          </button>
        </div>

        <div ref={scroller} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {empty && (
            <div className="pt-2">
              <p className="mb-3 text-[14px] font-medium text-ink-2">{t("suggestions")}</p>
              {(["goalPrompt", "sugg1", "sugg2", "sugg3"] as const).map((k) => (
                <button key={k} onClick={() => send(t(k))} className="mb-2 block w-full rounded-lg bg-surface p-4 text-left text-[16px] shadow-e1 active:bg-muted">
                  {t(k)}
                </button>
              ))}
            </div>
          )}
          {ui.chat.map((m, i) => (
            <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cx(
                  "max-w-[85%] rounded-lg px-4 py-3 text-[16px] leading-relaxed",
                  m.role === "user" ? "bg-primary text-white" : "bg-surface shadow-e1",
                )}
              >
                {m.text}
                {m.role === "assistant" && m.text.length > 2 && (
                  <div className="mt-2">
                    <ListenButton text={m.text} className="h-9 px-3 text-[14px]" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {mic.listening && (
            <div className="rounded-lg bg-surface p-4 shadow-e1">
              <p className="text-[13px] text-ink-2">{t("youreSaying")}</p>
              <p className="mt-1 text-[18px]">{mic.transcript || "…"}</p>
            </div>
          )}
          {(phase === "working" || phase === "slow") && <CheckProgress working steps={steps} />}
          {phase === "slow" && <p className="text-[14px] text-caution">{t("slowBody")}</p>}
          {phase === "error" && <p className="rounded-md bg-scam-subtle p-3 text-[15px] text-scam">{t("errorBody")}</p>}
          {phase === "no_key" && <p className="rounded-md bg-caution-subtle p-3 text-[15px] text-caution">{t("apiKeyMissing")}</p>}
          {phase === "offline" && <p className="rounded-md bg-muted p-3 text-[15px]">{t("offlineBody")}</p>}
          {mic.error === "denied" && <p className="rounded-md bg-caution-subtle p-3 text-[15px] text-caution">{t("micDenied")}</p>}
        </div>

        <form
          className="flex items-center gap-2 border-t border-line bg-surface px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <button
            type="button"
            onClick={() => (mic.listening ? mic.stop() : mic.start())}
            aria-label={mic.listening ? t("stop") : t("tapSpeak")}
            className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-full text-white", mic.listening ? "pulse bg-scam" : "bg-primary")}
          >
            <Icon name={mic.listening ? "x" : "mic"} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("askPlaceholder")}
            className="h-12 min-w-0 flex-1 rounded-full border border-line-strong bg-canvas px-4 text-[16px] outline-none focus:border-primary"
          />
          <button type="submit" aria-label={t("send")} disabled={!text.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-primary-deep disabled:text-line-strong">
            <Icon name="send" />
          </button>
        </form>
      </div>
    </div>
  );
}
