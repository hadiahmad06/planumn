import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/cs-bs.json";
import { pickCurrentVersion, samplePlanUrl, type RawProgram } from "./normalize";

// Real CourseDog response for Computer Science B.S. (it has no sample-plan field; tests add one).
const raw = pickCurrentVersion(fixture as unknown as Record<string, RawProgram>)!;

describe("samplePlanUrl (B17)", () => {
  const link = (html: string): RawProgram => ({ customFields: { cdSamplePlanLink: html } });

  it("reads the catalog's sample-plan link (real CourseDog HTML)", () => {
    const html = '<p><a target="_blank" rel="noopener noreferrer nofollow" class="open_in_new_tab" href="https://sampleplan.umn.edu/node/666">Computer Science B.S. Comp.Sc.</a></p>';
    expect(samplePlanUrl(link(html))).toBe("https://sampleplan.umn.edu/node/666");
  });

  it("drops missing, non-https and non-UMN links", () => {
    expect(samplePlanUrl({})).toBeUndefined();
    expect(samplePlanUrl(link(""))).toBeUndefined();
    expect(samplePlanUrl(link('<a href="http://sampleplan.umn.edu/node/1">x</a>'))).toBeUndefined();
    expect(samplePlanUrl(link('<a href="https://umn.edu.example.com/x">x</a>'))).toBeUndefined();
    expect(samplePlanUrl(link('<a href="javascript:alert(1)">x</a> <a href="https://sampleplan.umn.edu/twin-cities/computer-engineering-bcompe">y</a>'))).toBe(
      "https://sampleplan.umn.edu/twin-cities/computer-engineering-bcompe",
    );
  });

  it("is undefined for the real CS B.S. fixture, which has no sample-plan field", () => {
    expect(samplePlanUrl(raw)).toBeUndefined();
  });
});
