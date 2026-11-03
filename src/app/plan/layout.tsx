import { Autosave } from "@/features/plans/Autosave";
/** Written by Michael's Codex. Autosave has one lifetime across plan routes. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Autosave />
      {children}
    </>
  );
}
