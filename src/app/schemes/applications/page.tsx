"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { uiLang } from "@/lib/i18n";
import { schemeById } from "@/lib/schemes";
import { Icon } from "@/components/Icon";
import { Badge, Button, Card, IconBubble, Screen, StateBlock, TopBar, cx } from "@/components/ui";
import { useUI } from "@/components/AppShell";

// M/20 Application tracker
export default function Applications() {
  const { s, t, set } = useApp();
  const ui = useUI();
  const L = uiLang(s.lang);
  const [tipDone, setTipDone] = useState(false);
  const apps = Object.entries(s.applications)
    .map(([id, done]) => ({ scheme: schemeById(id), done }))
    .filter((a): a is { scheme: NonNullable<ReturnType<typeof schemeById>>; done: number } => !!a.scheme);
  const hasPension = apps.some((a) => a.scheme.id === "pmsym" && a.done < a.scheme.trackerSteps.length);

  return (
    <>
      <TopBar title={t("myApplications")} />
      <Screen nav>
        {apps.length === 0 ? (
          <StateBlock icon="file" title={t("myApplications")} body={t("noApplications")}>
            <Button href="/schemes">{t("schemesForYou")}</Button>
          </StateBlock>
        ) : (
          <div className="mt-1 space-y-3">
            {apps.map(({ scheme, done }) => {
              const total = scheme.trackerSteps.length;
              const complete = done >= total;
              return (
                <Card key={scheme.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[17px] font-semibold leading-snug">{scheme.name[L]}</h2>
                    {complete ? (
                      <Badge tone="real" icon="check">
                        {t("youQualify")}
                      </Badge>
                    ) : (
                      <Badge tone="neutral" icon="clock">
                        {t("inProgress")}
                      </Badge>
                    )}
                  </div>
                  <ul className="mt-2">
                    {scheme.trackerSteps.map((st, i) => {
                      const isDone = i < done;
                      const isNext = i === done;
                      return (
                        <li key={i}>
                          <button
                            disabled={!isNext}
                            onClick={() => set({ applications: { ...s.applications, [scheme.id]: i + 1 } })}
                            className="flex min-h-[44px] w-full items-center gap-3 text-left text-[16px]"
                          >
                            <span
                              className={cx(
                                "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                                isDone ? "bg-primary text-white" : isNext ? "bg-primary-subtle" : "bg-muted",
                              )}
                            >
                              {isDone && <Icon name="check" size={14} strokeWidth={3} />}
                            </span>
                            <span className={cx(isNext && "font-semibold", !isDone && !isNext && "text-ink-2")}>{st[L]}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
            {hasPension && !tipDone && (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <IconBubble name="coins" tone="marigold" size={44} />
                  <div>
                    <p className="text-[14px] text-caution">{t("todaysTip")}</p>
                    <p className="text-[16px] font-semibold leading-snug">{t("remindInstalment")}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="subtle"
                    className="min-h-[48px] px-6"
                    onClick={() => {
                      setTipDone(true);
                      ui.showToast("✓ " + t("reminders"));
                    }}
                  >
                    {t("done")}
                  </Button>
                  <Button variant="secondary" className="min-h-[48px] px-6" onClick={() => setTipDone(true)}>
                    {t("notToday")}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </Screen>
    </>
  );
}
