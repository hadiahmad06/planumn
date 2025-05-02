// "use server";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { promises as fs } from "fs";
// import path from "path";
// import PlansList from "@/components/PlansList";

// interface Plan {
//   id: string;
//   name: string;
//   major: string[];
//   description: string;
//   createdAt: string;
// }

// async function getPlans(): Promise<Plan[]> {
//   const filePath = path.join(process.cwd(), "public", "umn_plans.json");
//   const fileContents = await fs.readFile(filePath, "utf8");
//   return JSON.parse(fileContents);
// }

// export default async function PlansPage() {
//   const plans = await getPlans();

//   return <PlansList plans={plans} />;
// }
