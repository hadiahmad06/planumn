"use client";

import { useEffect, useState } from "react";
import { UserSessionContext } from "@/contexts/UserSessionContext";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export const UserSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  return (
    <UserSessionContext.Provider value={{ user, setUser, session, setSession }}>
      {children}
    </UserSessionContext.Provider>
  );
};
