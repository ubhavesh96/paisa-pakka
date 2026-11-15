"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp, type Proposal } from "@/lib/store";
import { LogoMark, Icon } from "./Icon";
import { ConfirmSheet } from "./ConfirmSheet";
import { AssistantSheet } from "./AssistantSheet";

type ChatMsg = { role: "user" | "assistant"; text: string };

type UICtx = {
  proposal: Proposal | null;
  setProposal: (p: Proposal | null) => void;
  assistantOpen: boolean;
  openAssistant: (opts?: { listen?: boolean; text?: string }) => void;
  closeAssistant: () => void;
  assistantOpts: { listen?: boolean; text?: string };
  chat: ChatMsg[];
  setChat: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  toast: string | null;
  showToast: (m: string) => void;
  online: boolean;
};

const Ctx = createContext<UICtx | null>(null);
export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI outside AppShell");
  return c;
};

const PUBLIC = ["/", "/onboarding", "/language"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { s, ready, t } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantOpts, setAssistantOpts] = useState<{ listen?: boolean; text?: string }>({});
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const up = () => setOnline(navigator.onLine);
    up();
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", up);
    };
  }, []);

  // Onboarding gate.
  useEffect(() => {
    if (ready && !s.onboarded && !PUBLIC.includes(path)) router.replace("/onboarding");
  }, [ready, s.onboarded, path, router]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const openAssistant = useCallback((opts: { listen?: boolean; text?: string } = {}) => {
    setAssistantOpts(opts);
    setAssistantOpen(true);
  }, []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);

  // Close overlays on navigation.
  useEffect(() => {
    setAssistantOpen(false);
  }, [path]);

  const value = useMemo<UICtx>(
    () => ({ proposal, setProposal, assistantOpen, openAssistant, closeAssistant, assistantOpts, chat, setChat, toast, showToast, online }),
    [proposal, assistantOpen, openAssistant, closeAssistant, assistantOpts, chat, toast, showToast, online],
  );

  return (
    <Ctx.Provider value={value}>
      <div className="min-h-dvh bg-[#e9e9f0]">
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-canvas sm:shadow-[0_0_40px_#14151a14]">
          {!ready ? (
            <div className="flex min-h-dvh flex-col items-center justify-center bg-primary text-white">
              <LogoMark size={88} tone="white" />
              <p className="title mt-4 text-[22px] font-bold">Paisa Pakka</p>
            </div>
          ) : (
            <>
              {!online && (
                <div className="sticky top-0 z-40 flex items-center gap-2 bg-ink px-4 py-2.5 text-[14px] text-white">
                  <Icon name="wifiOff" size={18} />
                  {t("offlineBanner")}
                </div>
              )}
              {children}
            </>
          )}
          {ready && <AssistantSheet />}
          {ready && proposal && <ConfirmSheet />}
          {toast && (
            <div role="status" className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-32px)] max-w-[388px] -translate-x-1/2 rounded-md bg-ink px-4 py-3 text-[15px] text-white shadow-e1 sheet-in">
              {toast}
            </div>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
