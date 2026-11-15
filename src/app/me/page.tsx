"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { fmtDate, type StringKey } from "@/lib/i18n";
import { Icon, type IconName } from "@/components/Icon";
import { Card, Screen, TopBar } from "@/components/ui";

// M/22 Profile & Settings
export default function MePage() {
  const { s, t, set } = useApp();
  const langLabel = { hi: "हिन्दी", hinglish: "Hinglish", en: "English" }[s.lang];
  const freqKey: Record<string, StringKey> = { daily: "daily", weekly: "weekly", monthly: "monthly", sometimes: "sometimes" };

  const rows: { icon: IconName; label: string; value: string; href?: string; onClick?: () => void }[] = [
    { icon: "globe", label: t("language"), value: langLabel, href: "/language" },
    { icon: "clock", label: t("whenPaid"), value: t(freqKey[s.payFreq]), onClick: () => {
      const order = ["daily", "weekly", "monthly", "sometimes"] as const;
      set({ payFreq: order[(order.indexOf(s.payFreq) + 1) % order.length] });
    } },
    { icon: "bell", label: t("reminders"), value: s.reminders.on ? t("onceADay", { time: s.reminders.time }) : t("remindersOff"), href: "/me/reminders" },
    { icon: "speaker", label: t("readAloud"), value: s.readAloud ? t("on") : t("off"), onClick: () => set({ readAloud: !s.readAloud }) },
  ];

  return (
    <>
      <TopBar title={t("me")} />
      <Screen nav>
        <div className="mt-1 flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-subtle text-primary-deep">
            <Icon name="user" />
          </span>
          <div>
            <h1 className="title text-[22px] font-bold">{t("yourSettings")}</h1>
            <p className="text-[14px] text-ink-2">{t("noNameNeeded")}</p>
          </div>
        </div>

        <Card className="mt-4 px-4">
          {rows.map((r) => {
            const inner = (
              <>
                <Icon name={r.icon} size={22} className="shrink-0 text-primary-deep" />
                <span className="flex-1">
                  <span className="block text-[16px] font-semibold">{r.label}</span>
                  <span className="block text-[13px] text-ink-2">{r.value}</span>
                </span>
                <span className="text-[15px] font-medium text-primary-deep">{t("change")}</span>
              </>
            );
            const cls = "flex min-h-[68px] w-full items-center gap-4 py-2 text-left";
            return r.href ? (
              <Link key={r.label} href={r.href} className={cls}>{inner}</Link>
            ) : (
              <button key={r.label} onClick={r.onClick} className={cls}>{inner}</button>
            );
          })}
        </Card>

        <Card className="mt-3 px-4">
          {([
            ["clock", "activity", "/me/activity"],
            ["lock", "privacyData", "/me/privacy"],
            ["help", "helpHelplines", "/me/help"],
          ] as [IconName, StringKey, string][]).map(([icon, key, href]) => (
            <Link key={key} href={href} className="flex min-h-[56px] items-center gap-4">
              <Icon name={icon} size={22} className="text-primary-deep" />
              <span className="flex-1 text-[16px] font-semibold">{t(key)}</span>
              <Icon name="chevronRight" className="text-ink-2" />
            </Link>
          ))}
        </Card>

        {s.audit.length > 0 && (
          <>
            <h2 className="mt-5 text-[16px] font-semibold">{t("auditLog")}</h2>
            <Card className="mt-2 divide-y divide-line px-4">
              {s.audit.slice(0, 8).map((a) => (
                <div key={a.id} className="flex gap-3 py-3">
                  <Icon name="lock" size={18} className="mt-0.5 shrink-0 text-real" />
                  <div>
                    <p className="text-[15px]">{a.summary}</p>
                    <p className="text-[12px] text-ink-2">{fmtDate(a.at, s.lang)}</p>
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}
