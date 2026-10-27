import type { Plan } from "@/domain/plan";
import type { PlanRepository } from "@/contracts/plan-repository";
/** Written by Michael's Codex. The browser never sends a trusted owner id. */
export class PlanRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/plans${path}`, {
    method,
    cache: "no-store",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new PlanRequestError(
      result.error || "Your plans could not be loaded.",
      response.status,
    );
  return result as T;
}
export class CloudPlanRepository implements PlanRepository {
  list() {
    return request<Plan[]>("");
  }
  async get(id: string) {
    try {
      return await request<Plan>(`/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof PlanRequestError && error.status === 404)
        return null;
      throw error;
    }
  }
  save(plan: Plan) {
    return request<Plan>("", "POST", plan);
  }
  async softDelete(id: string) {
    await request(`/${encodeURIComponent(id)}`, "PATCH", { action: "delete" });
  }
  async recover(id: string) {
    await request(`/${encodeURIComponent(id)}`, "PATCH", { action: "recover" });
  }
  async hardDelete(id: string) {
    await request(`/${encodeURIComponent(id)}`, "DELETE");
  }
}
