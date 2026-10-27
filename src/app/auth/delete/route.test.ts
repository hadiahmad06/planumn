import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  verify: vi.fn(),
  plans: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock("@/server/supabase/server", () => ({
  serverSupabase: async () => ({
    auth: { getUser: mocks.getUser, signOut: mocks.signOut },
  }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mocks.verify,
      admin: { deleteUser: mocks.deleteUser },
    },
    from: () => ({ delete: () => ({ eq: mocks.plans }) }),
  }),
}));
import { POST } from "./route";
function request(
  body = { password: "Example1!", confirmation: "Delete all my data" },
  origin = "http://localhost",
) {
  return new Request("http://localhost/auth/delete", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server");
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "owner", email: "owner@example.com" } },
    error: null,
  });
  mocks.verify.mockResolvedValue({
    data: { user: { id: "owner" } },
    error: null,
  });
  mocks.plans.mockResolvedValue({ error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("account deletion boundaries", () => {
  it("rejects cross-origin requests before accessing account data", async () => {
    expect(
      (await POST(request(undefined, "https://external.example"))).status,
    ).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("does not delete when reauthentication belongs to a different user", async () => {
    mocks.verify.mockResolvedValueOnce({
      data: { user: { id: "other" } },
      error: null,
    });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.plans).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("uses only the verified session owner for plans and account deletion", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.plans).toHaveBeenCalledWith("user_id", "owner");
    expect(mocks.deleteUser).toHaveBeenCalledWith("owner");
  });
  it("leaves the account intact when plan deletion fails", async () => {
    mocks.plans.mockResolvedValueOnce({ error: { message: "failed" } });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
