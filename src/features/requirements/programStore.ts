"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { CourseSummary } from "@/domain/course";
import type { Program, Rule } from "@/domain/requirements";
import { useCourseCache } from "@/features/catalog/courseCache";

type Entry = { status: "loading" } | { status: "ready"; program: Program } | { status: "error"; message: string };

interface ProgramStore {
  entries: Record<string, Entry>;
}

export const useProgramStore = create<ProgramStore>()(() => ({ entries: {} }));

export async function loadProgram(id: string, force = false) {
  const current = useProgramStore.getState().entries[id];
  if (current && !force && current.status !== "error") return;
  useProgramStore.setState((s) => ({ entries: { ...s.entries, [id]: { status: "loading" } } }));
  try {
    const res = await fetch(`/api/programs/${encodeURIComponent(id)}`);
    const body = await res.json();
    if (res.ok) useCourseCache.getState().putSummaries(listedSummaries(body as Program));
    const entry: Entry = res.ok ? { status: "ready", program: body as Program } : { status: "error", message: body.error ?? `Error ${res.status}` };
    useProgramStore.setState((s) => ({ entries: { ...s.entries, [id]: entry } }));
  } catch {
    useProgramStore.setState((s) => ({ entries: { ...s.entries, [id]: { status: "error", message: "Couldn't reach planu.mn. Check your connection." } } }));
  }
}

/** Load (once) and return the requirement entries for the given program ids. */
export function usePrograms(ids: string[]): Record<string, Entry> {
  const key = ids.join(",");
  useEffect(() => {
    if (key) key.split(",").forEach((id) => void loadProgram(id));
  }, [key]);
  return useProgramStore((s) => s.entries);
}

/** Catalog courses a program lists, as summaries, so drag previews and cards render instantly. */
function listedSummaries(program: Program): CourseSummary[] {
  const out: CourseSummary[] = [];
  const visit = (r: Rule) => {
    if (r.kind === "courses")
      for (const ch of r.choices)
        for (const o of ch.options)
          if (o.courseId != null && o.code && o.credits) {
            const [dept, number] = o.code.split(" ");
            out.push({ id: o.courseId, dept, number, title: o.title ?? "", credits: o.credits });
          }
    if (r.kind === "anyOf" || r.kind === "allOf") r.children.forEach(visit);
  };
  program.requirements.forEach((q) => q.rules.forEach(visit));
  return out;
}
