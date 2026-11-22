/**
 * A1 (Hadi's Claude, #99): synthetic `plans` rows in every shape the 2025 app could have stored.
 * No real user data: ids, owners and titles are made up. Course ids are real `data/catalog.db` ids
 * (the same file 2025 shipped as `ProcessedData.db`), so the course codes can be checked.
 *
 * Evidence is 2025 code on `origin/main` (86288c3, 2025-06-25) and older commits, read-only:
 * `git show <commit>:frontend/src/<path>`.
 */
import type { Status } from "../check2025.ts";

export const OWNER = "00000000-0000-4000-8000-0000000000aa";
const planId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** Catalog ids used below. */
export const C = {
  CSCI1133: 87,
  CSCI1933: 94,
  CSCI2011: 77,
  CSCI2021: 1004,
  CSCI2041: 1473,
  CSCI4041: 1607,
  MATH1271: 114,
  MATH1272: 196,
  PHYS1301W: 1403,
  WRIT1301: 328,
  CHEM1061: 166,
  STAT3021: 70,
  ECON1101: 297,
  /** ECON 1101 at Morris (campus UMNMO): 2025 search had no campus filter. */
  ECON1101_MORRIS: 8382,
} as const;

export interface Fixture2025 {
  name: string;
  /** What 2025 code wrote this shape. */
  evidence: string;
  row: Record<string, unknown>;
  /** Term → course ids, in card order, once v2 has loaded the row. */
  expected: Record<string, number[]>;
  /** What `checkPlanRow` reports (with the catalog lookup). */
  status: Status;
}

type Lock = "locked" | "unlocked" | "autofilled";
/** Transcript import (`api/parseTranscript/route.ts`): `{ id, lock: "locked" }`. */
const t = (id: number) => ({ id, lock: "locked" as Lock });
/**
 * Dragged from 2025 search (`PlanDisplay.tsx`: `courses.splice(i, 0, { ...courseData, lock: "unlocked" })`,
 * where `courseData` is a search row from `api/search/route.ts`: `id, dept_abbr, course_num, priority`).
 */
const s = (id: number, code: string, priority: number, lock: Lock = "unlocked") => {
  const [dept_abbr, course_num] = code.split(" ");
  return { id, dept_abbr, course_num, priority, lock };
};
const empty = (...terms: string[]) => terms.map((index) => ({ index, courses: [] as unknown[] }));

/** Columns of a 2025 row as Supabase returns them (TIMESTAMPTZ since d4bcf97, 2025-06-18). */
function row(n: number, fields: Record<string, unknown>) {
  return {
    id: planId(n),
    user_id: OWNER,
    title: "",
    programs: [],
    can_view: [],
    created_at: "2025-06-20 14:03:11.123456+00",
    last_updated: "2025-06-21T09:15:42.654321+00:00",
    deletion_scheduled_at: null,
    ...fields,
  };
}

export const FIXTURES_2025: Fixture2025[] = [
  {
    name: "transcript import",
    evidence:
      "main 86288c3 `app/api/parseTranscript/route.ts`: `{ index, courses: ids.map((id) => ({ id, lock: \"locked\" })) }`, " +
      "terms filled from the earliest Fall to the latest Summer by `normalizeSemesters` in `types/planHandlers.ts`; inserted by `app/api/plan/route.ts` (ca069d2, 2025-06-10 on)",
    row: row(1, {
      title: "Imported",
      semesters: [
        { index: "1239", courses: [t(C.CSCI1133), t(C.MATH1271), t(C.WRIT1301)] },
        { index: "1243", courses: [t(C.CSCI1933), t(C.MATH1272)] },
        { index: "1245", courses: [] },
        { index: "1249", courses: [t(C.CSCI2011), t(C.CSCI2021), t(C.PHYS1301W)] },
        { index: "1253", courses: [t(C.CSCI2041)] },
        { index: "1255", courses: [] },
      ],
    }),
    expected: { "1239": [87, 114, 328], "1243": [94, 196], "1245": [], "1249": [77, 1004, 1403], "1253": [1473], "1255": [] },
    status: "ok",
  },
  {
    name: "new plan with courses dragged from search, locked and autofilled",
    evidence:
      "main `app/plan/new/page.tsx` (12 terms from this year's Fall); `PlanDisplay.tsx` search drop keeps the search row's fields; " +
      "`types/planHandlers.ts` `updateLock` toggles locked/unlocked; the AUTOFILL message sets \"autofilled\"",
    row: row(2, {
      title: "CS plan",
      semesters: [
        { index: "1259", courses: [s(C.CSCI1133, "CSCI 1133", 1, "locked"), s(C.MATH1271, "MATH 1271", 1)] },
        { index: "1263", courses: [s(C.CSCI1933, "CSCI 1933", 1, "autofilled")] },
        ...empty("1265", "1269", "1273", "1275", "1279", "1283", "1285", "1289", "1293", "1295"),
      ],
    }),
    expected: { "1259": [87, 114], "1263": [94] },
    status: "ok",
  },
  {
    name: "transcript plus later edits, with a retake",
    evidence:
      "transcript rows (`lock: \"locked\"`) edited in `PlanDisplay.tsx`: search drops are appended and moved cards keep their object " +
      "(`const [moved] = sourceSem.courses.splice(...)`); a retaken course appears in two terms",
    row: row(3, {
      semesters: [
        { index: "1249", courses: [t(C.MATH1271), t(C.CHEM1061)] },
        { index: "1253", courses: [t(C.MATH1271), s(C.STAT3021, "STAT 3021", 3)] },
        { index: "1255", courses: [] },
        { index: "1259", courses: [s(C.CSCI4041, "CSCI 4041", 1), t(C.CSCI2021)] },
        { index: "1263", courses: [] },
        { index: "1265", courses: [] },
      ],
    }),
    expected: { "1249": [114, 166], "1253": [114, 70], "1259": [1607, 1004] },
    status: "ok",
  },
  {
    name: "years removed and re-added: terms out of order",
    evidence:
      "main `lib/ManipulateYear.tsx`: removing the last year of a 3-term plan leaves `[]`; adding a year then calls `generateCurrentYear`, " +
      "which returns Fall, **Summer**, Spring (`1249`, `1255`, `1253` in 2025); \"AddLatestYear\" appends after the largest code",
    row: row(4, {
      semesters: [
        { index: "1249", courses: [s(C.CSCI1133, "CSCI 1133", 1)] },
        { index: "1255", courses: [s(C.WRIT1301, "WRIT 1301", 1)] },
        { index: "1253", courses: [s(C.CSCI1933, "CSCI 1933", 1)] },
        { index: "1259", courses: [] },
        { index: "1263", courses: [s(C.CSCI2041, "CSCI 2041", 1)] },
        { index: "1265", courses: [] },
      ],
    }),
    expected: { "1249": [87], "1253": [94], "1255": [328], "1263": [1473] },
    status: "changes",
  },
  {
    name: "no semesters",
    evidence: "main `lib/ManipulateYear.tsx`: \"RemoveLatestYear\" / \"RemovePrecedingYear\" on a 3-term plan set `updated = []`",
    row: row(5, { title: "Empty", semesters: [] }),
    expected: {},
    status: "ok",
  },
  {
    name: "in the recycle bin",
    evidence:
      "d4bcf97 (2025-06-18) added `deletion_scheduled_at`; main `app/api/plan/delete/route.ts` sets it from the `now_plus_30_days` RPC",
    row: row(6, {
      title: "Old",
      deletion_scheduled_at: "2030-01-01 00:00:00+00",
      semesters: [{ index: "1259", courses: [t(C.ECON1101)] }],
    }),
    expected: { "1259": [297] },
    status: "ok",
  },
  {
    name: "June 2025 row: whole course details, `major`, null newer columns",
    evidence:
      "e0ec876 (2025-06-01) to 49f54ce (2025-06-07): `app/plan/[planId]/page.tsx` wrote `update({ major, semesters: planState.semesters })` " +
      "where semesters hold `CourseDetails` from `getPlanDetails` (`types/planHandlers.ts`); rows had `major`/`createdAt` and no title. " +
      "49f54ce switched to `title`, `programs`, `can_view`, `last_updated`. The table migration isn't in the repo, so this assumes the worst: " +
      "the new columns were added nullable and `major` was kept. Timestamps are TIMESTAMP (no zone) before d4bcf97",
    row: {
      id: planId(7),
      user_id: OWNER,
      created_at: "2025-06-02 03:12:45.123456",
      major: [],
      title: null,
      programs: null,
      can_view: null,
      last_updated: null,
      deletion_scheduled_at: null,
      semesters: [
        {
          index: "1259",
          courses: [
            {
              id: C.CSCI1133,
              campus: "UMNTC",
              dept_abbr: "CSCI",
              course_num: "1133",
              class_desc: "Introduction to Computing and Programming Concepts",
              total_students: 9000,
              total_grades: "{\"A\": 1}",
              onestop: "https://umtc.catalog.prod.coursedog.com/courses/8096661",
              onestop_desc: "",
              cred_min: 4,
              cred_max: 4,
              srt_vals: "{}",
              lock: "unlocked",
            },
          ],
        },
        { index: "1263", courses: [] },
      ],
    },
    expected: { "1259": [87], "1263": [] },
    status: "changes",
  },
  {
    name: "missing or unknown lock",
    evidence:
      "every 2025 loader (`app/plan/[planId]/page.tsx` from e0ec876 to main) maps a lock outside locked/unlocked/autofilled to \"unlocked\"; " +
      "`getPlanDetails` / `fetchCourseDetails` default it too. Rows only keep such a value if 2025 never saved them again (hand-made rows)",
    row: row(8, {
      semesters: [{ index: "1259", courses: [{ id: C.CSCI1133 }, { id: C.MATH1271, lock: null }, { id: C.WRIT1301, lock: "pinned" }, t(C.CHEM1061)] }],
    }),
    expected: { "1259": [87, 114, 328, 166] },
    status: "changes",
  },
  {
    name: "other-campus course from 2025 search",
    evidence: "main `app/api/search/route.ts` queries `classdistribution` with no campus filter, so Morris/Duluth rows could be dragged in",
    row: row(9, { semesters: [{ index: "1259", courses: [s(C.ECON1101_MORRIS, "ECON 1101", 1), s(C.ECON1101, "ECON 1101", 1)] }] }),
    expected: { "1259": [8382, 297] },
    status: "warnings",
  },
  {
    name: "same course twice in one term",
    evidence:
      "main `app/api/parseTranscript/route.ts` pushes every course-code match in a term's text block with no de-duplication, and a term " +
      "header repeated on a new page adds a second block for the same term",
    row: row(10, { semesters: [{ index: "1249", courses: [t(C.MATH1271), t(C.MATH1271), t(C.CHEM1061)] }] }),
    expected: { "1249": [114, 114, 166] },
    status: "warnings",
  },
  {
    name: "repeated term code (defensive)",
    evidence: "no 2025 writer found; v2's `normalizeSemesters` merges repeats, so the check covers it",
    row: row(11, {
      semesters: [
        { index: "1259", courses: [t(C.CSCI1133)] },
        { index: "1263", courses: [] },
        { index: "1259", courses: [s(C.MATH1271, "MATH 1271", 1)] },
      ],
    }),
    expected: { "1259": [87, 114], "1263": [] },
    status: "changes",
  },
];

/** Rows no 2025 code writes; the check must report them as failing, not crash. */
export const BROKEN_ROWS: { name: string; row: Record<string, unknown>; fails: RegExp }[] = [
  { name: "invalid term code", row: row(90, { semesters: [{ index: "1267", courses: [] }] }), fails: /term code "1267"/ },
  { name: "numeric term code", row: row(91, { semesters: [{ index: 1259, courses: [] }] }), fails: /term code 1259/ },
  { name: "string course id", row: row(92, { semesters: [{ index: "1259", courses: [{ id: "87", lock: "locked" }] }] }), fails: /course id "87"/ },
  { name: "null semesters", row: row(93, { semesters: null }), fails: /semesters is not an array/ },
  { name: "missing created_at", row: row(94, { created_at: null, semesters: [] }), fails: /created_at/ },
];

/**
 * 2025 browser autosaves (`localStorage` key "plan", `contexts/PlanProvider.tsx`): kept for signed-out users and for
 * signed-in users' unsaved changes; `Date` fields are ISO strings after `JSON.stringify`.
 */
export const LOCAL_AUTOSAVES_2025: { name: string; evidence: string; value: Record<string, unknown>; expected: Record<string, number[]> }[] = [
  {
    name: "main autosave of a cloud plan",
    evidence: "main `contexts/PlanProvider.tsx`: `localStorage.setItem(\"plan\", JSON.stringify(plan))` with the remote id and owner",
    value: {
      id: planId(20),
      user_id: OWNER,
      created_at: "2025-06-20T14:03:11.123Z",
      last_updated: "2025-06-21T09:15:42.654Z",
      deletion_scheduled_at: null,
      can_view: [],
      title: "Draft",
      programs: [],
      semesters: [{ index: "1259", courses: [s(C.CSCI1133, "CSCI 1133", 1)] }, { index: "1263", courses: [] }],
    },
    expected: { "1259": [87], "1263": [] },
  },
  {
    name: "autosave from before deletion_scheduled_at (June 10–17, 2025)",
    evidence: "ca069d2 (2025-06-10) to d4bcf97 (2025-06-18): `PlanNullable` had no `deletion_scheduled_at`; `app/plan/new/page.tsx` didn't set it",
    value: {
      id: null,
      user_id: null,
      created_at: "2025-06-12T10:00:00.000Z",
      last_updated: "2025-06-12T10:00:00.000Z",
      can_view: [],
      title: "",
      programs: [],
      semesters: [{ index: "1259", courses: [t(C.MATH1271)] }],
    },
    expected: { "1259": [114] },
  },
];
