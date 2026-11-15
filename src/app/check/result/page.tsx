"use client";

import { useRouter } from "next/navigation";
import { useApp, type VerdictKind } from "@/lib/store";
import { fmtDate } from "@/lib/i18n";
import { Icon, type IconName } from "@/components/Icon";
import { Button, Card, ListenButton, Screen, StateBlock, TopBar, cx } from "@/components/ui";

const STYLE: Record<VerdictKind, { card: string; title: string; icon: IconName; num: string; onDark: boolean }> = {
  scam: { card: "bg-scam text-white", title: "text-white", icon: "shieldX", num: "text-scam", onDark: true },
  real: { card: "bg-real text-white", title: "text-white", icon: "shieldCheck", num: "text-primary-deep", onDark: true },
  unsure: { card: "border-2 border-caution-line bg-caution-subtle text-ink", title: "text-caution", icon: "help", num: "text-primary-deep", onDark: false },
};

// M/08 Fake · M/09 Real · M/10 Unsure
export default function ResultPage() {
  const { s, t, set } = useApp();
  const router = useRouter();
  const v = s.verdicts.find((x) => x.id === s.viewVerdictId) ?? s.verdicts[0];

  if (!v)
    return (
      <>
        <TopBar title={t("result")} />
        <Screen>
          <StateBlock icon="shieldCheck" title={t("emptyTitle")} body={t("emptyBody")}>
            <Button href="/check">{t("checkSomething")}</Button>
          </StateBlock>
        </Screen>
      </>
    );

  const st = STYLE[v.kind];
  const spoken = `${v.title}. ${v.summary} ${t("whatToDo")}: ${v.steps.join(". ")}`;

  const footer = (
    <div className="flex gap-3">
      {v.kind === "scam" && (
        <Button variant="danger" className="flex-1" href="tel:1930">
          {t("call1930")}
        </Button>
      )}
      {v.kind === "real" &&
        (v.schemeId ? (
          <Button
            className="flex-1"
            onClick={() => {
              set({ viewSchemeId: v.schemeId! });
              router.push("/schemes/detail");
            }}
          >
            {t("viewScheme")}
          </Button>
        ) : (
          <Button className="flex-1" href="/schemes">
            {t("viewScheme")}
          </Button>
        ))}
      {v.kind === "unsure" && (
        <Button className="flex-1" href="/me/help">
          {t("helpline")}
        </Button>
      )}
      <Button variant="secondary" className="flex-1" href="/check/share">
        {t("tellFriends")}
      </Button>
    </div>
  );

  return (
    <>
      <TopBar title={t("result")} />
      <Screen footer={footer}>
        <div className="mt-1 rounded-lg bg-muted p-4">
          <p className="text-[13px] text-ink-2">{t("youAsked")}</p>
          <p className="mt-1 text-[16px] leading-relaxed">“{v.question}”</p>
        </div>

        <div className={cx("mt-3 rounded-lg p-6", st.card)}>
          <h2 className={cx("title flex items-center gap-3 text-[26px] font-bold", st.title)}>
            <Icon name={st.icon} size={30} />
            {v.title}
          </h2>
          <p className="mt-3 text-[18px] leading-relaxed">{v.summary}</p>
          <ListenButton text={spoken} tone={st.onDark ? "onDark" : "default"} className="mt-4" />
        </div>

        <Card className="mt-3 p-4">
          <h3 className="text-[16px] font-semibold">{t("whatToDo")}</h3>
          <ol className="mt-3 space-y-3">
            {v.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-[16px] leading-relaxed">
                <span className={cx("num w-4 shrink-0 text-[18px] font-semibold", st.num)}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <p className="mt-4 flex items-start gap-2 text-[14px] text-primary-deep">
          <Icon name="arrowUpRight" size={18} className="mt-0.5 shrink-0" />
          {v.sources.length ? (
            <span>
              {t("source")}:{" "}
              {v.sources.map((d, i) => (
                <span key={d}>
                  {i > 0 && " · "}
                  <a href={`https://${d}`} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                    {d}
                  </a>
                </span>
              ))}
            </span>
          ) : (
            t("noSource")
          )}
        </p>
        <p className="mt-2 text-[13px] text-ink-2">{t("lastChecked", { date: fmtDate(v.checkedAt, s.lang) })}</p>
      </Screen>
    </>
  );
}
