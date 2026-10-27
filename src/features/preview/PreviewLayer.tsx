"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { fetchCourses, useCourseCache } from "@/features/catalog/courseCache";
import { courseCode } from "@/domain/course";
import { CourseDetails } from "./CourseDetails";
import { clampPanel } from "./geometry";
import { usePreviewStore } from "./store";

/** Written by Michael's Codex. Nonmodal panels keep the plan usable while comparing. */
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
  const [position, setPosition] = useState({
    x: 24 + index * 28,
    y: 88 + index * 24,
  });
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
  function start(event: PointerEvent<HTMLButtonElement>) {
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

  return (
    <aside
      ref={panel}
      role="dialog"
      aria-modal="false"
      aria-label={course ? `${courseCode(course)} preview` : "Course preview"}
      className="pointer-events-auto fixed flex w-[min(360px,calc(100vw-16px))] flex-col overflow-hidden rounded-modal border border-border-strong bg-surface shadow-overlay"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 100 + index,
        maxHeight: "calc(100dvh - 16px)",
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
      <header className="flex shrink-0 items-center border-b border-border bg-sunken px-2 py-1.5">
        <button
          type="button"
          className="min-w-0 flex-1 cursor-grab touch-none rounded-row p-2 text-left text-xs font-medium focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Move preview panel. Use arrow keys to reposition."
          onPointerDown={start}
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
          {temporary ? "Quick preview" : "Course comparison"}
        </button>
        {temporary && (
          <button
            type="button"
            className="rounded-row px-3 py-2 text-xs font-semibold text-accent"
            onClick={() => {
              open(id);
              hover(null);
            }}
          >
            Keep open
          </button>
        )}
        <button
          type="button"
          className="rounded-row px-3 py-2 text-lg hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Close preview"
          onClick={() => {
            if (temporary) hover(null);
            else close(id);
          }}
        >
          ×
        </button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        {course ? (
          <CourseDetails course={course} />
        ) : missing ? (
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
          <p
            className="animate-pulse p-5 motion-reduce:animate-none"
            role="status"
          >
            Loading course details…
          </p>
        )}
      </div>
    </aside>
  );
}

export function PreviewLayer() {
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
