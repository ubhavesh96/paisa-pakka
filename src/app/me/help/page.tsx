"use client";

import { useApp } from "@/lib/store";
import { Icon, type IconName } from "@/components/Icon";
import { Card, Screen, TopBar } from "@/components/ui";
import { useUI } from "@/components/AppShell";

// M/24 Help
export default function HelpPage() {
  const { t } = useApp();
  const ui = useUI();
  const people: [IconName, string, string, string, string][] = [
    ["phone", t("cyberFraud"), t("callAtOnce"), t("call"), "tel:1930"],
    ["phone", t("eshramHelp"), t("helpSchemes"), t("call"), "tel:14434"],
    ["user", t("helpNearby"), t("ngo"), t("find"), "https://www.google.com/maps/search/Common+Service+Centre+near+me"],
  ];

  return (
    <>
      <TopBar title={t("help")} />
      <Screen nav>
        <h1 className="title mt-1 text-[22px] font-bold">{t("talkPerson")}</h1>
        <Card className="mt-3 px-4">
          {people.map(([icon, a, b, cta, href]) => (
            <a key={a} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex min-h-[68px] items-center gap-4">
              <Icon name={icon} size={22} className="text-primary-deep" />
              <span className="flex-1">
                <span className="block text-[16px] font-semibold">{a}</span>
                <span className="block text-[13px] text-ink-2">{b}</span>
              </span>
              <span className="text-[15px] font-medium text-primary-deep">{cta}</span>
            </a>
          ))}
        </Card>
        <h2 className="mt-5 text-[16px] font-semibold">{t("howAppWorks")}</h2>
        <Card className="mt-3 px-4">
          <button onClick={() => ui.showToast("🎬 " + t("watchVideo"))} className="flex min-h-[56px] w-full items-center gap-4 text-left">
            <Icon name="speaker" size={22} className="text-primary-deep" />
            <span className="flex-1 text-[16px] font-semibold">{t("watchVideo")}</span>
            <Icon name="chevronRight" className="text-ink-2" />
          </button>
          <button onClick={() => ui.openAssistant()} className="flex min-h-[56px] w-full items-center gap-4 text-left">
            <Icon name="help" size={22} className="text-primary-deep" />
            <span className="flex-1 text-[16px] font-semibold">{t("commonQs")}</span>
            <Icon name="chevronRight" className="text-ink-2" />
          </button>
        </Card>
        <div className="mt-4 flex gap-3 rounded-md bg-caution-subtle p-4 text-[15px] text-caution">
          <Icon name="alert" size={20} className="shrink-0" />
          {t("neverCall")}
        </div>
        <div className="mt-3 flex gap-3 rounded-md bg-muted p-4 text-[14px] text-ink-2">
          <Icon name="help" size={20} className="shrink-0" />
          {t("independent")}
        </div>
      </Screen>
    </>
  );
}
