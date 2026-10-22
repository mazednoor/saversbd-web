"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface MobileMenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileMenuContext = createContext<MobileMenuState>({
  open: false,
  setOpen: () => {},
});

/** Shares the mobile drawer state between the header button and the bottom bar. */
export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>;
}

export function useMobileMenu() {
  return useContext(MobileMenuContext);
}
