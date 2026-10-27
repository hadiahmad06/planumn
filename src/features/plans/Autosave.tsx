"use client";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { CloudPlanRepository } from "./clientRepository";
import { LocalPlanRepository } from "./localRepository";
import { useSaveState } from "./saveState";
import { connectAutosave } from "./autosaveController";
/** Written by Michael's Codex. One connection for the active auth identity. */
export function Autosave() {
  const { user, loading } = useAuth();
  const owner = user?.id ?? null;
  useEffect(() => {
    if (loading) return;
    let cleanup: (() => void) | undefined;
    try {
      cleanup = connectAutosave(
        owner,
        owner
          ? new CloudPlanRepository()
          : new LocalPlanRepository(window.localStorage),
      );
    } catch {
      useSaveState.setState({
        status: "error",
        error:
          "Browser storage is unavailable. Keep this page open to preserve your edits.",
      });
    }
    function beforeUnload(event: BeforeUnloadEvent) {
      if (
        ["pending", "saving", "error"].includes(useSaveState.getState().status)
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      cleanup?.();
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [owner, loading]);
  return null;
}
