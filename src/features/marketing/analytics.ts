/** Written by Michael's Codex. Strip identifiers and queries before page-view collection. */
export function analyticsUrl(raw: string) {
  const url = new URL(raw);
  url.search = "";
  url.hash = "";
  if (
    /^\/plan\/[^/]+/.test(url.pathname) &&
    !["/plan/new", "/plan/autosave", "/plan/import", "/plan/apas"].includes(
      url.pathname,
    )
  )
    url.pathname = "/plan/saved";
  return url.toString();
}
