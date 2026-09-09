export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "SELECTED"
  | "REJECTED";

export type InterviewStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export type CVRecommendation =
  | "EXCELLENT_MATCH"
  | "GOOD_MATCH"
  | "MODERATE_MATCH"
  | "LOW_MATCH";

export interface CVAnalysis {
  id: string;
  applicationId: string;

  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  semanticScore: number;

  recommendation: CVRecommendation;

  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  strengths: string[] | null;

  summary: string | null;

  analyzedAt: string;
  updatedAt: string;
}

export interface CVAnalysisDetails {
  ruleBasedPercentage: number;
  semanticPercentage: number;
  semanticModel: string;

  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface AnalyzeCVResponse {
  status: "success";
  message: string;

  analysis: CVAnalysis;

  details: CVAnalysisDetails;

  notice: string;
}

export interface ApplicationInterview {
  id: string;
  applicationId: string;
  interviewerId: string;
  dateTime: string;
  type: string;
  locationOrLink: string | null;
  status: InterviewStatus;
  notes: string | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;

  interviewer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface StatusHistoryItem {
  id: string;
  applicationId: string;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedBy: string;
  note: string | null;
  changedAt: string;

  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApplicationDocument {
  id: string;
  candidateId: string;
  applicationId: string | null;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
}

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
    location?: string | null;
    education?: string | null;
    experience?: string | null;
    skills?: string | null;
  };

  vacancy: {
    id: string;
    title: string;
    department: string | null;
    status?: string;
  };

  cvAnalysis?: CVAnalysis | null;

  _count?: {
    interviews: number;
    statusHistory: number;
  };
}

export interface ApplicationDetails extends Application {
  candidate: Application["candidate"] & {
    documents?: ApplicationDocument[];
  };

  interviews: ApplicationInterview[];

  statusHistory: StatusHistoryItem[];
}

export interface ApplicationsResponse {
  status: "success";
  count: number;
  applications: Application[];
}

export interface ApplicationResponse {
  status: "success";
  application: ApplicationDetails;
}

export interface CreateApplicationResponse {
  status: "success";
  message: string;
  application: Application;
}
