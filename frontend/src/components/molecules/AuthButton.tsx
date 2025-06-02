// components/AuthButton.tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@chakra-ui/react";
import { supabase } from "@/lib/supabase";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: prompt("Enter your email:") || "",
    password: prompt("Enter your password:") || ""
  });

  if (error) {
    console.error("Login error:", error.message);
    // Optionally show Chakra toast or error message
  } else {
    console.log("Logged in user:", data.user);
    // Optionally close modal or redirect
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Button
      onClick={user ? handleLogout : handleLogin}
      colorScheme="red"
      size="lg"
      variant="solid"
      borderRadius="full"
      boxShadow="sm"
      _hover={{ boxShadow: "xl", transform: "scale(1.05)" }}
    >
      {user ? "LOGOUT" : "LOGIN"}
    </Button>
  );
}