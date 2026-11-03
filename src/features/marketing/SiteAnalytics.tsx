"use client";
import { Analytics } from "@vercel/analytics/react";
import { analyticsUrl } from "./analytics";
/** Written by Michael's Codex. */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => ({ ...event, url: analyticsUrl(event.url) })}
    />
  );
}
