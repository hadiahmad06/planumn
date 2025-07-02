export type ProgramId = {
  rawId: string
  label: string
}

export interface ProgramDetails extends ProgramId {
  _id: string;
  id: string;
  name: string;
  longName: string;
  code: string;
  campus: string;
  campuses: string[];
  type: string;                     // Major | Minor - check for undergraduate programs
  career: string;                   // Undergraduate | Graduate - check first for grouping
  college: string;
  degreeDesignation: string;
  departmentOwnership: Array<{      // quantified department ownership
    department: string;
    percentage: number;
  }>;
  departments: string[];            // department ownership
  description: string;
  diplomaDescription: string;
  effectiveStartDate: string;
  effectiveEndDate: string | null;  
  fieldOfStudy: string;
  cipCode: string;
  hegisCode: string;
  institution: string;              //
  level: string;
  programGroupId: string;
  status: string;
  startTerm: {
    year: string;
    id: string;
    semester: number;
  };
  requirementLevels: any[]; // replace with actual type if known
  requisites: Record<string, ReqGroup[]>;
  customFields: {
    [key: string]: any;
  };
  specializations: Array<{
    id: string;
    name: string;
  }>;
  [key: string]: any; // to handle any unexpected fields
}


export type ReqValue = {
  value: string[];
  logic?: "or" | "and" | string; // Optional, based on UI
  [key: string]: any; // to handle any unexpected fields
}

export type ReqCondition = {
  condition: string;
  values?: ReqValue[];
  number?: number;
  subSelections?: ReqCondition[];
  logic?: "or" | "and" | string; // Optional, based on UI logic
  [key: string]: any;
}
export type ReqRule = {
  id: string;
  name: string;
  condition: "minimumCredits" | "minimumCourses" | "completeCourses" | string;
  minCourses?: number;
  maxCourses?: number;
  minCredits?: number;
  maxCredits?: number;
  credits?: number;
  courses?: number;
  subRules?: ReqRule[];
  notes?: string;
  value: ReqCondition;
  [key: string]: any;
}

export type ReqGroup = {
  id: string;
  name: string;
  type: string;
  requirementLevel: string;
  notes?: string;
  showInCatalog: boolean;
  rules: ReqRule[];
}

export type ProgramGroup = {
  group: string
  items: ProgramId
}