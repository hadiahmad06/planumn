"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  major: string[];
  description: string;
  createdAt: string;
}

interface PlansListProps {
  plans: Plan[];
}

export default function PlansList({ plans }: PlansListProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Graduation Plans</h1>
          <button
            onClick={() => router.push("/plan/new")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Create New Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plan/${plan.id}`}
              className="block p-6 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {plan.name}
              </h2>
              <p className="text-secondary mb-4">{plan.description}</p>
              <div className="flex justify-between items-center text-sm text-secondary">
                <span>Major: {plan.major.join(", ")}</span>
                <span>
                  Created: {new Date(plan.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 