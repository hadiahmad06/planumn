/**
 * Where planu.mn's course and grade data comes from, and how far it runs. Written by Hadi's Claude
 * (D2, #98).
 *
 * `data/catalog.db` is a GopherGrades build. Social Coding at UMN, who maintain GopherGrades, let
 * planu.mn use it; the site credits them in the footer and on the info pages (Hadi, 2026-11-22).
 */

/**
 * The last term with grade records in `data/catalog.db`. Every "data through …" sentence in the UI
 * reads this, so a catalog refresh (ticket D1) changes this one line.
 */
export const CATALOG_DATA_THROUGH = "Fall 2024";

/** The course and grade data source, for credit lines and links. */
export const GOPHERGRADES = {
  name: "GopherGrades",
  url: "https://umn.lol",
  sourceUrl: "https://github.com/samyok/gophergrades",
  maintainer: "Social Coding at UMN",
} as const;
