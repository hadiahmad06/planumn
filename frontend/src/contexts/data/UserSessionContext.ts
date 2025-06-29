"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";

export const UserSessionContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  session: Session | null;
  setSession: (session: Session | null) => void;
}>({
  user: null,
  setUser: () => {},
  session: null,
  setSession: () => {},
});

