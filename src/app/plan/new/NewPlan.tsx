"use client";

import { useState } from "react";
import { createEmptyPlan } from "@/domain/plan";
import { PlanEditor } from "@/features/plan-editor/PlanEditor";

export function NewPlan() {
  const [plan] = useState(createEmptyPlan);
  return <PlanEditor initialPlan={plan} />;
}
