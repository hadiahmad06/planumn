import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptyPlan } from "@/domain/plan";
import { SupabasePlanRepository } from "./serverRepository";
function setup() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    not: vi.fn(),
    gt: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { ...createEmptyPlan(), id: "stored", user_id: "owner" },
      error: null,
    }),
  };
  for (const method of [
    query.select,
    query.eq,
    query.is,
    query.not,
    query.gt,
    query.insert,
    query.update,
    query.delete,
  ])
    method.mockReturnValue(query);
  const client = {
    from: vi.fn().mockReturnValue(query),
    rpc: vi
      .fn()
      .mockResolvedValue({ data: "2026-11-26T00:00:00Z", error: null }),
  };
  return {
    query,
    client,
    repo: new SupabasePlanRepository(
      client as unknown as SupabaseClient,
      "owner",
    ),
  };
}
describe("cloud plan ownership", () => {
  it("ignores supplied owner and access metadata on insert", async () => {
    const { repo, query } = setup();
    await repo.save({
      ...createEmptyPlan(),
      user_id: "spoofed",
      can_view: ["other"],
      deletion_scheduled_at: "2030-01-01T00:00:00Z",
    });
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "owner", can_view: [] }),
    );
    expect(query.insert.mock.calls[0][0]).not.toHaveProperty(
      "deletion_scheduled_at",
    );
  });
  it("normalizes nullable 2025 arrays before an old plan is edited", async () => {
    const { repo, query } = setup();
    query.maybeSingle.mockResolvedValueOnce({
      data: {
        ...createEmptyPlan(),
        id: "old",
        user_id: "owner",
        programs: null,
        can_view: null,
      },
      error: null,
    });
    const plan = await repo.get("old");
    expect(plan).toMatchObject({ programs: [], can_view: [] });
    await expect(repo.save(plan!)).resolves.toBeDefined();
  });
  it("scopes updates by id and owner, without changing sharing or timestamps owned by the database", async () => {
    const { repo, query } = setup();
    await repo.save({
      ...createEmptyPlan(),
      id: "target",
      user_id: "spoofed",
      can_view: ["other"],
    });
    expect(query.eq).toHaveBeenCalledWith("id", "target");
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(query.is).toHaveBeenCalledWith("deletion_scheduled_at", null);
    expect(query.update.mock.calls[0][0]).not.toHaveProperty("user_id");
    expect(query.update.mock.calls[0][0]).not.toHaveProperty("can_view");
    expect(query.update.mock.calls[0][0]).not.toHaveProperty("created_at");
  });
  it("uses server-time RPC for soft deletion and scopes it to the current owner", async () => {
    const { repo, query, client } = setup();
    await repo.softDelete("target");
    expect(client.rpc).toHaveBeenCalledWith("now_plus_30_days");
    expect(query.update).toHaveBeenCalledWith({
      deletion_scheduled_at: "2026-11-26T00:00:00Z",
    });
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("only permanently removes owner-scoped rows already in the recycle bin", async () => {
    const { repo, query } = setup();
    await repo.hardDelete("target");
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(query.not).toHaveBeenCalledWith("deletion_scheduled_at", "is", null);
  });
});
