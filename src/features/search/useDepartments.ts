"use client";

import { useEffect, useState } from "react";
import type { Department } from "@/domain/naturalQuery";

let cache: Department[] | null = null;
let request: Promise<Department[]> | null = null;

/** Twin Cities department names for natural-language search (B27); loaded once per page. */
export function useDepartments(): Department[] {
  const [list, setList] = useState<Department[]>(cache ?? []);
  useEffect(() => {
    if (cache) return;
    request ??= fetch("/api/departments")
      .then((r) => (r.ok ? (r.json() as Promise<Department[]>) : []))
      .catch(() => []);
    let alive = true;
    void request.then((d) => {
      cache = d.length ? d : null;
      if (!d.length) request = null;
      if (alive) setList(d);
    });
    return () => {
      alive = false;
    };
  }, []);
  return list;
}
