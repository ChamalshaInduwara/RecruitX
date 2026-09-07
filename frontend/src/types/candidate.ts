export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "SELECTED"
  | "REJECTED";

export interface CandidateInterview {
  id: string;
  dateTime: string;
  type: string;
  status: string;
}

export interface CandidateApplication {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;

  vacancy: {
    id: string;
    title: string;
    department: string | null;
    status: string;
  };

  interviews?: CandidateInterview[];
}

export interface CandidateDocument {
  id: string;
  candidateId: string;
  applicationId: string | null;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  createdAt: string;
  updatedAt: string;

  applications?: CandidateApplication[];

  documents?: CandidateDocument[];

  _count?: {
    applications: number;
    documents: number;
  };
}

export interface CandidatesResponse {
  status: "success";
  count: number;
  candidates: Candidate[];
}

export interface CandidateResponse {
  status: "success";
  candidate: Candidate;
}

export interface CreateCandidateResponse {
  status: "success";
  message: string;
  candidate: Candidate;
}

export interface UpdateCandidateResponse {
  status: "success";
  message: string;
  candidate: Candidate;
}

export interface CandidateDocumentsResponse {
  status: "success";
  documents: CandidateDocument[];
}

export interface UploadDocumentResponse {
  status: "success";
  message: string;
  document: CandidateDocument;
}