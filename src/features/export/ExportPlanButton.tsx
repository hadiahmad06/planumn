"use client";
import { useState } from "react";
import { plannedCourseIds } from "@/domain/plan";
import { evaluateProgram } from "@/domain/requirements";
import type { CourseDetails } from "@/domain/course";
import { usePlanStore } from "@/features/plan-editor/store";
import { useCourseCache } from "@/features/catalog/courseCache";
import { useProgramStore } from "@/features/requirements/programStore";
import { programName } from "@/features/requirements/programOptions";

/** Written by Michael's Codex. Generate locally from the clicked snapshot; lazy-load the PDF engine. */
export function ExportPlanButton() {
  const plan = usePlanStore((state) => state.plan);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function download() {
    if (!plan) return;
    const snapshot = structuredClone(plan);
    setPending(true);
    setMessage("");
    setError("");
    try {
      const engine = import("./advisorPdf");
      const courses = { ...useCourseCache.getState().courses };
      const missing = plannedCourseIds(snapshot).filter((id) => !courses[id]);
      // Await our own requests: the shared cache can already have an unrelated fetch in flight.
      for (let start = 0; start < missing.length; start += 200) {
        const response = await fetch(
          `/api/courses?ids=${missing.slice(start, start + 200).join(",")}`,
        );
        if (!response.ok)
          throw new Error(
            "Course details could not be loaded. Check your connection and try again.",
          );
        const found = (await response.json()) as CourseDetails[];
        for (const course of found) courses[course.id] = course;
        useCourseCache.getState().put(found);
      }
      const entries = useProgramStore.getState().entries;
      const planned = plannedCourseIds(snapshot).map((id) => ({
        courseId: id,
        credits: courses[id]?.credits.min ?? 0,
      }));
      const audits = snapshot.programs.flatMap((id) => {
        const entry = entries[id];
        if (entry?.status !== "ready") return [];
        const result = evaluateProgram(entry.program, planned);
        return [
          {
            name: entry.program.name,
            filled: result.filled,
            units: result.units,
          },
        ];
      });
      const { createAdvisorPdf, advisorFileName } = await engine;
      const result = await createAdvisorPdf(snapshot, courses, {
        programNames: snapshot.programs.map(programName),
        audits,
      });
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(result.bytes)], { type: "application/pdf" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = advisorFileName(snapshot.title);
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(
        `PDF exported${result.pages > 1 ? ` across ${result.pages} pages to keep every course readable` : " on one page"}. Open it to print.${result.missingCourses ? ` ${result.missingCourses} entries have unavailable catalog details.` : ""}`,
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The PDF could not be exported. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        disabled={pending || !plan}
        onClick={() => void download()}
        className="rounded-row border border-border-strong bg-surface px-2.5 py-1 text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {pending ? "Preparing PDF…" : "Export PDF"}
      </button>
      {message && (
        <span role="status" className="max-w-sm text-text-secondary">
          {message}
        </span>
      )}
      {error && (
        <span role="alert" className="max-w-sm text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
