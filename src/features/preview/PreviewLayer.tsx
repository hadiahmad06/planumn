"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { fetchCourses, useCourseCache } from "@/features/catalog/courseCache";
import { courseCode } from "@/domain/course";
import { cn } from "@/components/ui/cn";
import { CloseIcon, GripIcon } from "@/components/ui/icons";
import { CourseDetails, PreviewHeading } from "./CourseDetails";
import { AddToSemesterButton } from "@/features/plan-editor/AddToSemesterButton";
import { previewAnchor, trackPreviewAnchor } from "./anchor";
import { clampPanel, farthestCorner } from "./geometry";
import { usePreviewStore } from "./store";

/** Written by Michael's Codex; 2025-style chrome by Hadi's Claude. Nonmodal panels keep the plan usable while comparing. */
function PreviewPanel({
  id,
  index,
  temporary,
}: {
  id: number;
  index: number;
  temporary: boolean;
}) {
  const course = useCourseCache((s) => s.courses[id]);
  const missing = useCourseCache((s) => s.missing[id]);
  const open = usePreviewStore((s) => s.openPreview);
  const close = usePreviewStore((s) => s.closePreview);
  const hover = usePreviewStore((s) => s.hoverPreview);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [position, setPosition] = useState({ x: 8, y: 8 });
  // Hidden until placed, so it never flashes on top of the course it describes.
  const [placed, setPlaced] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const anchor = useRef<ReturnType<typeof previewAnchor> | null>(null);
  const panel = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    fetchCourses([id]).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [id, retry]);

  // Open in the corner farthest from the course that opened it (Hadi, 2026-10-27). Runs once per
  // panel; after that the student can drag a pinned panel anywhere.
  useLayoutEffect(() => {
    const element = panel.current;
    if (!element || placed) return;
    anchor.current ??= previewAnchor();
    const box = anchor.current;
    // A hover preview that can't fit beside the course at full width narrows to the space beside it
    // (down to 360px) instead of covering it. Measured again after the width applies.
    if (temporary && width === null && !("x" in box)) {
      const beside = Math.max(box.left, window.innerWidth - box.right) - 16;
      const full = element.getBoundingClientRect().width;
      if (beside < full && beside >= 360) {
        setWidth(Math.floor(beside));
        return;
      }
    }
    const rect = element.getBoundingClientRect();
    setPosition(farthestCorner(box, rect.width, rect.height, window.innerWidth, window.innerHeight, temporary ? 0 : index));
    setPlaced(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placement is decided once, when the panel opens
  }, [width]);

  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const clamp = () =>
      setPosition((p) => {
        const rect = element.getBoundingClientRect();
        const next = clampPanel(
          p.x,
          p.y,
          rect.width,
          rect.height,
          window.innerWidth,
          window.innerHeight,
        );
        return p.x === next.x && p.y === next.y ? p : next;
      });
    const observer = new ResizeObserver(clamp);
    observer.observe(element);
    window.addEventListener("resize", clamp);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", clamp);
    };
  }, []);

  function move(x: number, y: number) {
    const rect = panel.current?.getBoundingClientRect();
    if (rect)
      setPosition(
        clampPanel(
          x,
          y,
          rect.width,
          rect.height,
          window.innerWidth,
          window.innerHeight,
        ),
      );
  }
  function start(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    if (!temporary) open(id);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      px: position.x,
      py: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  const status = course ? null : missing ? (
    <p className="p-5" role="status">
      This course is no longer in the catalog.
    </p>
  ) : error ? (
    <div className="p-5" role="alert">
      <p>Course details could not be loaded.</p>
      <button
        type="button"
        className="mt-3 text-accent underline"
        onClick={() => {
          setError(false);
          setRetry((r) => r + 1);
        }}
      >
        Try again
      </button>
    </div>
  ) : (
    <div className="flex animate-pulse flex-col gap-2 p-5 motion-reduce:animate-none" role="status" aria-label="Loading course details">
      <div className="h-6 w-2/5 rounded-row bg-sunken" />
      <div className="h-4 w-3/5 rounded-row bg-sunken" />
      <div className="mt-2 h-14 rounded-row bg-sunken" />
    </div>
  );

  return (
    <aside
      ref={panel}
      role="dialog"
      aria-modal="false"
      aria-label={course ? `${courseCode(course)} preview` : "Course preview"}
      className={cn(
        "pointer-events-auto fixed flex flex-col overflow-hidden rounded-modal border bg-surface shadow-overlay transition-shadow",
        temporary
          ? "w-[min(560px,calc(100vw-16px))] border-border-strong"
          : "w-[min(380px,calc(100vw-16px))] border-accent ring-4 ring-accent/20",
      )}
      style={{
        left: position.x,
        top: position.y,
        zIndex: 100 + index,
        maxHeight: "calc(100dvh - 16px)",
        visibility: placed ? undefined : "hidden",
        ...(width !== null ? { width } : {}),
      }}
      onPointerDown={() => {
        if (!temporary) open(id);
      }}
      onFocus={() => {
        if (!temporary) open(id);
      }}
      onPointerEnter={() => {
        if (temporary) hover(id);
      }}
      onPointerLeave={() => {
        if (temporary) hover(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (temporary) hover(null);
          else close(id);
          event.stopPropagation();
        }
      }}
    >
      {temporary ? (
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {course ? <CourseDetails course={course} variant="hover" /> : status}
          <button
            type="button"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:rounded-row focus:bg-surface focus:px-2 focus:py-1 focus:text-micro focus:text-accent"
            onClick={() => {
              open(id);
              hover(null);
            }}
          >
            Keep open
          </button>
        </div>
      ) : (
        <>
          {/* The heading is the drag handle (2025: the whole card dragged); the grip button moves it by keyboard. */}
          <header
            className="flex shrink-0 cursor-grab touch-none items-start gap-1 px-5 pt-4 pb-2 active:cursor-grabbing"
            onPointerDown={(event) => {
              if ((event.target as Element).closest("button")) return;
              start(event);
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onPointerMove={(event) => {
              const d = drag.current;
              if (d) move(d.px + event.clientX - d.x, d.py + event.clientY - d.y);
            }}
          >
            {course ? <PreviewHeading course={course} className="flex-1" /> : <div className="flex-1" />}
            {/* "+" adds this course to the selected semester (Hadi, 2026-10-27). */}
            {course && <AddToSemesterButton courseId={course.id} code={courseCode(course)} className="-mt-0.5 mr-1" />}
            <button
              type="button"
              className="-mt-1 shrink-0 cursor-grab rounded-row p-1.5 text-text-tertiary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
              aria-label="Move preview panel. Use arrow keys to reposition."
              onKeyDown={(event) => {
                const delta: Record<string, [number, number]> = {
                  ArrowLeft: [-20, 0],
                  ArrowRight: [20, 0],
                  ArrowUp: [0, -20],
                  ArrowDown: [0, 20],
                };
                const d = delta[event.key];
                if (d) {
                  event.preventDefault();
                  move(position.x + d[0], position.y + d[1]);
                }
              }}
            >
              <GripIcon />
            </button>
            <button
              type="button"
              className="-mt-1 -mr-2 shrink-0 rounded-row p-1.5 text-text-secondary hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
              aria-label="Close preview"
              onClick={() => close(id)}
            >
              <CloseIcon />
            </button>
          </header>
          <div className="min-h-0 overflow-y-auto overscroll-contain">{course ? <CourseDetails course={course} /> : status}</div>
        </>
      )}
    </aside>
  );
}

export function PreviewLayer() {
  useEffect(trackPreviewAnchor, []);
  const pinned = usePreviewStore((s) => s.pinned);
  const hovered = usePreviewStore((s) => s.hovered);
  const [temporary, setTemporary] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(
      () => setTemporary(hovered),
      hovered === null ? 180 : 0,
    );
    return () => clearTimeout(timer);
  }, [hovered]);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-label="Course previews"
    >
      {pinned.map((id, index) => (
        <PreviewPanel key={id} id={id} index={index} temporary={false} />
      ))}
      {temporary !== null && !pinned.includes(temporary) && (
        <PreviewPanel
          key={`hover-${temporary}`}
          id={temporary}
          index={pinned.length}
          temporary
        />
      )}
    </div>
  );
}
