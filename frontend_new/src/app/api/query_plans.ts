"use server";

import { promises as fs } from "fs";
import path from "path";

export async function getPlans() {
  try {
    const filePath = path.join(process.cwd(), "public", "umn_plans.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading plans:", error);
    return [];
  }
} 