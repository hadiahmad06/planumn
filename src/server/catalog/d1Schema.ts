/**
 * The catalog's shape on D1 (Hadi's Claude). Kept free of `server-only` and path aliases so
 * `scripts/export-d1.ts` can import it in plain Node.
 */

/** Source tables the app reads; the D1 export copies only these. */
export const CATALOG_TABLES = [
  "classdistribution",
  "distribution",
  "termdistribution",
  "professor",
  "libed",
  "libedAssociationTable",
  "departmentdistribution",
] as const;

/**
 * Derived data built from the source tables, so D1 reads stay small: `course_terms` (one row per
 * course with its offered terms) and the indexes the app's lookups need. The 2025 catalog has no
 * secondary indexes, so without these every join would scan whole tables (and count against D1's
 * daily rows-read allowance). Run by the D1 export and, against an in-memory copy, by the Node path.
 */
export const DERIVED_SQL = [
  `CREATE TABLE course_terms (class_id INTEGER PRIMARY KEY, terms TEXT NOT NULL)`,
  `INSERT INTO course_terms (class_id, terms)
     SELECT class_id, group_concat(term, ',') FROM (
       SELECT DISTINCT d.class_id AS class_id, t.term AS term FROM distribution d
       JOIN termdistribution t ON t.dist_id = d.id ORDER BY d.class_id, t.term)
     GROUP BY class_id`,
  `CREATE INDEX idx_class_code ON classdistribution (campus, dept_abbr, course_num)`,
  `CREATE INDEX idx_class_group ON classdistribution (courseGroupId)`,
  `CREATE INDEX idx_dist_class ON distribution (class_id)`,
  `CREATE INDEX idx_termdist_dist ON termdistribution (dist_id)`,
  `CREATE INDEX idx_libed_assoc_course ON libedAssociationTable (right_id)`,
];
