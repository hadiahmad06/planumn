import { GOPHERGRADES } from "@/domain/dataSources";
/**
 * Credit for the course and grade data (D2, #98). Written by Hadi's Claude.
 * Inline links; the caller sets the size and color of the surrounding text.
 */
export function DataCredit({ linkClassName }: { linkClassName?: string }) {
  return (
    <>
      Course and grade data from{" "}
      <a href={GOPHERGRADES.url} className={linkClassName}>
        {GOPHERGRADES.name}
      </a>{" "}
      by {GOPHERGRADES.maintainer} (
      <a href={GOPHERGRADES.sourceUrl} className={linkClassName}>
        source on GitHub
      </a>
      ).
    </>
  );
}
