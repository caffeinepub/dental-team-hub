import type { Principal } from "@icp-sdk/core/principal";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface AppContextValue {
  // Map: principal string -> display name
  knownPrincipals: Map<string, string>;
  // Map: display name -> principal (reverse lookup)
  principalByName: Map<string, string>;
  registerPrincipal: (principal: Principal, name: string) => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

export type AppView =
  | { type: "chat" }
  | { type: "tasks" }
  | { type: "directory" }
  | { type: "admin" }
  | { type: "private"; partnerPrincipal: string; partnerName: string };

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [knownPrincipals, setKnownPrincipals] = useState<Map<string, string>>(
    new Map(),
  );
  const [principalByName, setPrincipalByName] = useState<Map<string, string>>(
    new Map(),
  );
  const [activeView, setActiveView] = useState<AppView>({ type: "chat" });

  const registerPrincipal = useCallback(
    (principal: Principal, name: string) => {
      const pStr = principal.toString();
      setKnownPrincipals((prev) => {
        if (prev.get(pStr) === name) return prev;
        const next = new Map(prev);
        next.set(pStr, name);
        return next;
      });
      setPrincipalByName((prev) => {
        if (prev.get(name) === pStr) return prev;
        const next = new Map(prev);
        next.set(name, pStr);
        return next;
      });
    },
    [],
  );

  return (
    <AppContext.Provider
      value={{
        knownPrincipals,
        principalByName,
        registerPrincipal,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
