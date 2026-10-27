"use client";

import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AuthForm } from "./AuthForm";
import { Settings } from "./Settings";
import { useAuth } from "./useAuth";
import { browserSupabase } from "./client";
import { useRouter } from "next/navigation";

/** Written by Michael's Codex. Mounted by the editor and site navigation. */
export function UserMenu() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [modal, setModal] = useState<"auth" | "settings" | null>(null);
  const [error, setError] = useState("");
  const item =
    "cursor-pointer rounded-row px-3 py-2 outline-none focus:bg-accent-soft";
  async function signOut() {
    try {
      const { error } = await browserSupabase().auth.signOut();
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch {
      setError("Sign-out failed. Please try again.");
    }
  }
  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger
          className="h-10 max-w-24 truncate rounded-full border border-border-strong bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent"
          disabled={loading}
          aria-label={loading ? "Checking account" : "Open account menu"}
          title={user?.email || "Account"}
        >
          {loading ? "…" : user?.email?.slice(0, 1).toUpperCase() || "Account"}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            align="end"
            sideOffset={8}
            className="z-[190] min-w-48 rounded-card border border-border bg-surface p-1 shadow-overlay"
          >
            {user?.email && (
              <Dropdown.Label className="max-w-64 break-all px-3 py-2 text-xs text-text-secondary">
                {user.email}
              </Dropdown.Label>
            )}
            {!user && (
              <Dropdown.Item className={item} onSelect={() => setModal("auth")}>
                Sign in / Create account
              </Dropdown.Item>
            )}
            <Dropdown.Item asChild className={item}>
              <Link href="/plans">My Plans</Link>
            </Dropdown.Item>
            <Dropdown.Item
              className={item}
              onSelect={() => setModal("settings")}
            >
              Settings
            </Dropdown.Item>
            {user && (
              <Dropdown.Item className={item} onSelect={() => void signOut()}>
                Sign out
              </Dropdown.Item>
            )}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {error && (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      )}
      <Modal
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        title={modal === "auth" ? "Your plans, wherever you study" : "Settings"}
        description={
          modal === "auth"
            ? "Sign in to save plans to your account."
            : "Choose how your plan looks and manage your account."
        }
      >
        {modal === "auth" ? (
          <AuthForm onSuccess={() => setModal(null)} />
        ) : (
          <Settings email={user?.email} />
        )}
      </Modal>
    </>
  );
}
