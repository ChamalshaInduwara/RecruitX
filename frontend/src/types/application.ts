export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "SELECTED"
  | "REJECTED";

export interface Application {
  id: string;
  candidateId: string;
  vacancyId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;

  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    skills?: string | null;
  };

  vacancy: {
    id: string;
    title: string;
    department: string | null;
    status?: string;
  };

  _count?: {
    interviews: number;
    statusHistory: number;
  };
}

export interface ApplicationsResponse {
  status: "success";
  count: number;
  applications: Application[];
}

export interface CreateApplicationResponse {
  status: "success";
  message: string;
  application: Application;
}