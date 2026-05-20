"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Box, TextInput, Text } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { CourseStub } from "@/types/plan";
import { PlanContext } from "@/contexts/data/PlanContext";
import { PreviewContext } from "@/contexts/visual/PreviewContext";

const DROPDOWN_MAX_ROWS = 8;
const ROW_HEIGHT = 48;

export default function SearchDropdown() {
  const { cachedCourses, setCachedSearchResults } = useContext(PlanContext);
  const { addPersistPreview } = useContext(PreviewContext);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseStub[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputBoxRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // Track input rect for portal positioning.
  const updateAnchor = useCallback(() => {
    if (inputBoxRef.current) {
      setAnchorRect(inputBoxRef.current.getBoundingClientRect());
    }
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateAnchor();
    const onScrollOrResize = () => updateAnchor();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [isOpen, updateAnchor]);

  // Click outside / Esc → close (but stay open during a drag).
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (isDragging) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (inputBoxRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDragging) setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isDragging]);

  // Listen for drag lifecycle to keep dropdown alive mid-drag and close after drop.
  useEffect(() => {
    const onStart = () => setIsDragging(true);
    const onEnd = () => {
      setIsDragging(false);
      // Close after a tick so the drop handler reads the dropdown's draggable id first.
      setTimeout(() => setIsOpen(false), 0);
    };
    window.addEventListener("planumn:dragstart", onStart);
    window.addEventListener("planumn:dragend", onEnd);
    return () => {
      window.removeEventListener("planumn:dragstart", onStart);
      window.removeEventListener("planumn:dragend", onEnd);
    };
  }, []);

  // Debounced fetch.
  useEffect(() => {
    if (query.length === 0) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const excludeKeys = Object.keys(cachedCourses);
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&exclude=${encodeURIComponent(
          JSON.stringify(excludeKeys)
        )}`
      );
      const data = (await res.json()) as CourseStub[];
      setResults(data);
      setCachedSearchResults(
        Object.fromEntries(data.map((c) => [c.id, c]))
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [query, cachedCourses, setCachedSearchResults]);

  const shouldShowDropdown = isOpen && query.length > 0 && results.length > 0;

  return (
    <Box style={{ width: "100%", maxWidth: 520 }} ref={inputBoxRef}>
      <TextInput
        placeholder="Search courses…"
        leftSection={<IconSearch size={16} />}
        radius="xl"
        size="md"
        value={query}
        onChange={(e) => {
          setQuery(e.currentTarget.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query.length > 0) setIsOpen(true);
        }}
        styles={{
          root: { width: "100%" },
          input: {
            background: "var(--bg-canvas)",
            borderColor: "var(--border-subtle)",
          },
        }}
        aria-label="Search courses"
      />

      {shouldShowDropdown &&
        anchorRect &&
        createPortal(
          <Box
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: anchorRect.bottom + 6,
              left: anchorRect.left,
              width: anchorRect.width,
              maxHeight: DROPDOWN_MAX_ROWS * ROW_HEIGHT,
              overflowY: "auto",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-overlay)",
              zIndex: 1500,
            }}
          >
            <Droppable droppableId="search" isDropDisabled>
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps}>
                  {results.map((course, index) => (
                    <Draggable
                      key={`search-${course.id}`}
                      draggableId={JSON.stringify(course)}
                      index={index}
                    >
                      {(p) => (
                        <Box
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          onClick={() => {
                            addPersistPreview(course, "right");
                          }}
                          style={{
                            ...p.draggableProps.style,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            height: ROW_HEIGHT,
                            padding: "0 14px",
                            borderBottom: "1px solid var(--border-subtle)",
                            background: "var(--bg-surface)",
                            cursor: "pointer",
                          }}
                        >
                          <Box
                            style={{
                              minWidth: 0,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Text size="sm" fw={600} c="var(--text-primary)">
                              {course.dept_abbr} {course.course_num}
                            </Text>
                            <Text
                              size="xs"
                              c="var(--text-secondary)"
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {(course as any).class_desc ??
                                (course as any).title ??
                                ""}
                            </Text>
                          </Box>
                          <Text
                            size="xs"
                            c="var(--text-tertiary)"
                            style={{ flexShrink: 0 }}
                          >
                            {(course as any).cred_min != null
                              ? `${(course as any).cred_min} cr`
                              : ""}
                          </Text>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Box>,
          document.body
        )}
    </Box>
  );
}
