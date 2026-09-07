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