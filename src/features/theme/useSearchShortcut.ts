"use client";
import { useEffect, type RefObject } from "react";
import { isSearchShortcut } from "./searchShortcut";
/** Written by Michael's Codex. One top-bar listener; leave focus-trapped dialogs alone. */
export function useSearchShortcut(input: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = input.current;
      if (
        !isSearchShortcut(event) ||
        !target ||
        target.disabled ||
        target.closest('[aria-hidden="true"], [inert]')
      )
        return;
      event.preventDefault();
      target.focus();
      target.select();
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [input]);
}
