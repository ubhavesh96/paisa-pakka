"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { speechLang } from "@/lib/i18n";
import { useSpeaker } from "@/lib/speech";
import { Icon, LogoMark, type IconName } from "./Icon";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type BtnVariant = "primary" | "secondary" | "danger" | "link" | "subtle";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-primary text-white active:bg-primary-deep disabled:bg-line-strong",
  secondary: "bg-surface text-ink border-[1.5px] border-control active:bg-muted",
  danger: "bg-scam text-white active:brightness-90",
  link: "bg-transparent text-primary-deep",
  subtle: "bg-primary-subtle text-primary-deep active:brightness-95",
};

export function Button({
  variant = "primary",
  icon,
  iconRight,
  className,
  children,
  href,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  icon?: IconName;
  iconRight?: IconName;
  href?: string;
}) {
  const cls = cx(
    "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md px-5 text-[16px] font-semibold transition select-none",
    BTN[variant],
    className,
  );
  const inner = (
    <>
      {icon && <Icon name={icon} size={20} />}
      <span className="truncate">{children}</span>
      {iconRight && <Icon name={iconRight} size={20} />}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls} onClick={rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
        {inner}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-lg bg-surface shadow-e1", className)} {...rest}>
      {children}
    </div>
  );
}

export function LangPill() {
  const { t } = useApp();
  return (
    <Link
      href="/language"
      className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 text-[14px] font-medium text-ink shadow-e1"
    >
      <Icon name="globe" size={20} />
      {t("langSwitch")}
    </Link>
  );
}

export function TopBar({ title, back = true, onBack, brand }: { title?: string; back?: boolean; onBack?: () => void; brand?: boolean }) {
  const router = useRouter();
  const { t } = useApp();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-1 bg-canvas/95 px-2 backdrop-blur">
      {brand ? (
        <div className="flex items-center gap-2.5 pl-2">
          <LogoMark size={32} />
          <span className="title text-[18px] font-semibold">Paisa Pakka</span>
        </div>
      ) : back ? (
        <button aria-label={t("back")} onClick={onBack ?? (() => router.back())} className="grid h-11 w-11 place-items-center rounded-full active:bg-muted">
          <Icon name="back" />
        </button>
      ) : (
        <span className="w-3" />
      )}
      {title && <h1 className="title flex-1 truncate text-[18px] font-semibold">{title}</h1>}
      <div className="ml-auto pr-1">
        <LangPill />
      </div>
    </header>
  );
}

const NAV: { href: string; icon: IconName; key: "navHome" | "navCheck" | "navMoney" | "navSchemes" | "navMe"; match: string }[] = [
  { href: "/home", icon: "home", key: "navHome", match: "/home" },
  { href: "/check", icon: "shieldCheck", key: "navCheck", match: "/check" },
  { href: "/money", icon: "wallet", key: "navMoney", match: "/money" },
  { href: "/schemes", icon: "file", key: "navSchemes", match: "/schemes" },
  { href: "/me", icon: "user", key: "navMe", match: "/me" },
];

export function BottomNav() {
  const path = usePathname();
  const { t } = useApp();
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 flex h-20 w-full max-w-[420px] -translate-x-1/2 border-t border-line bg-surface px-1 pb-[env(safe-area-inset-bottom)]">
      {NAV.map((n) => {
        const active = path.startsWith(n.match);
        return (
          <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center justify-center gap-1" aria-current={active ? "page" : undefined}>
            <span className={cx("grid h-8 w-14 place-items-center rounded-full", active ? "bg-primary-subtle text-primary-deep" : "text-ink-2")}>
              <Icon name={n.icon} size={22} />
            </span>
            <span className={cx("text-[13px]", active ? "font-semibold text-primary-deep" : "text-ink-2")}>{t(n.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Page container. `nav` reserves space for the bottom nav; `footer` pins actions to the bottom. */
export function Screen({
  children,
  nav,
  footer,
  className,
}: {
  children: React.ReactNode;
  nav?: boolean;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <main className={cx("flex flex-1 flex-col px-4", nav ? "pb-28" : footer ? "pb-36" : "pb-8", className)}>{children}</main>
      {footer && (
        <div className={cx("fixed left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 bg-gradient-to-t from-canvas via-canvas to-canvas/0 px-4 pt-6 pb-4", nav ? "bottom-20" : "bottom-0")}>
          {footer}
        </div>
      )}
      {nav && <BottomNav />}
    </>
  );
}

export function ListenButton({ text, className, tone = "default" }: { text: string; className?: string; tone?: "default" | "onDark" }) {
  const { s, t } = useApp();
  const { speaking, toggle } = useSpeaker();
  return (
    <button
      onClick={() => toggle(text, speechLang(s.lang))}
      className={cx(
        "inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-[16px] font-semibold",
        tone === "onDark" ? "border-white/90 text-white" : "border-primary-deep bg-surface text-primary-deep",
        className,
      )}
    >
      <Icon name={speaking ? "x" : "speaker"} size={20} />
      {speaking ? t("stop") : t("listen")}
    </button>
  );
}

export function OptionPill({ selected, children, onClick }: { selected?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] px-4 text-[16px] font-semibold",
        selected ? "border-primary-deep bg-primary-subtle text-primary-deep" : "border-line-strong bg-surface text-ink",
      )}
    >
      {selected && <Icon name="check" size={18} />}
      {children}
    </button>
  );
}

export function Chip({ selected, children, onClick }: { selected?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "inline-flex h-12 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[16px] font-semibold",
        selected ? "border-primary-deep bg-primary-subtle text-primary-deep" : "border-line-strong bg-surface text-ink",
      )}
    >
      {selected && <Icon name="check" size={18} />}
      {children}
    </button>
  );
}

export function IconBubble({ name, tone = "brand", size = 40 }: { name: IconName; tone?: "brand" | "marigold" | "scam" | "real" | "caution"; size?: number }) {
  const tones = {
    brand: "bg-primary-subtle text-primary-deep",
    marigold: "bg-caution-subtle text-caution",
    scam: "bg-scam-subtle text-scam",
    real: "bg-real-subtle text-real",
    caution: "bg-caution-subtle text-caution",
  };
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full", tones[tone])} style={{ width: size, height: size }}>
      <Icon name={name} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-3 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={Math.round(value * 100)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(2, value * 100))}%` }} />
    </div>
  );
}

export function Badge({ tone, icon, children }: { tone: "real" | "caution" | "neutral"; icon?: IconName; children: React.ReactNode }) {
  const tones = { real: "bg-real-subtle text-real", caution: "bg-caution-subtle text-caution", neutral: "bg-muted text-ink-2" };
  return (
    <span className={cx("inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[14px] font-medium", tones[tone])}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </span>
  );
}

export function StateBlock({
  icon,
  tone = "brand",
  title,
  body,
  children,
}: {
  icon: IconName;
  tone?: "brand" | "scam" | "caution";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <IconBubble name={icon} tone={tone} size={96} />
      <h2 className="title mt-4 text-[22px] font-bold">{title}</h2>
      <p className="mt-3 max-w-[328px] text-[16px] leading-relaxed text-ink-2">{body}</p>
      <div className="mt-4 flex w-full flex-col gap-4">{children}</div>
    </div>
  );
}

export { cx };
