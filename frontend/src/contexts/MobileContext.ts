import { createContext } from "react";

interface MobileContextType {
  isMobile: boolean;
}

export const MobileContext = createContext<MobileContextType>({ isMobile: false });
