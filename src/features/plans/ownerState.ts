import type { Plan } from "@/domain/plan";

/** Written by Michael's Codex. All account-specific list UI belongs to the account that loaded it. */
export interface PlanListView {
  plans: Plan[] | null;
  error: string;
  busy: boolean;
  confirm: { title: string; run: () => Promise<void> } | null;
}
export interface OwnedPlanListView extends PlanListView {
  owner: string;
}
const EMPTY: PlanListView = {
  plans: null,
  error: "",
  busy: false,
  confirm: null,
};

export function visiblePlanList(
  state: OwnedPlanListView | null,
  owner: string | null,
): PlanListView {
  if (!owner || state?.owner !== owner) return EMPTY;
  return {
    ...state,
    plans: state.plans?.filter((plan) => plan.user_id === owner) ?? null,
  };
}
/** Ignore work that finished under a different session; a new owner's update starts with empty UI. */
export function updatePlanList(
  state: OwnedPlanListView | null,
  requestedOwner: string | null,
  activeOwner: string | null,
  patch: Partial<PlanListView>,
): OwnedPlanListView | null {
  if (!requestedOwner || requestedOwner !== activeOwner) return state;
  return {
    ...(state?.owner === requestedOwner ? state : EMPTY),
    ...patch,
    owner: requestedOwner,
  };
}
