// components/AuthButton.tsx
"use client";
import { Button } from "@mantine/core";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabase";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: prompt("Enter your email:") || "",
      password: prompt("Enter your password:") || "",
    });

    if (error) {
      console.error("Login error:", error.message);
    } else {
      console.log("Logged in user:", data.user);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Button
      onClick={user ? handleLogout : handleLogin}
      color="red"
      size="lg"
      variant="filled"
      radius="xl"
      style={{ boxShadow: "sm" }}
    >
      {user ? "LOGOUT" : "LOGIN"}
    </Button>
  );
}