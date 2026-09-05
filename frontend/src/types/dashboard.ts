export interface ApplicationStatusCounts {
  APPLIED: number;
  SCREENING: number;
  INTERVIEW_SCHEDULED: number;
  INTERVIEW_COMPLETED: number;
  SELECTED: number;
  REJECTED: number;
}

export interface DashboardSummary {
  activeVacancies: number;
  totalApplications: number;
  applicationsByStatus: ApplicationStatusCounts;
  selectedCandidates: number;
  rejectedCandidates: number;
  upcomingInterviews: number;
}

export interface UpcomingInterview {
  id: string;
  dateTime: string;
  type: string;
  locationOrLink: string | null;
  status: string;
  notes: string | null;

  interviewer: {
    id: string;
    name: string;
    email: string;
  };

  application: {
    candidate: {
      id: string;
      fullName: string;
      email: string;
    };

    vacancy: {
      id: string;
      title: string;
      department: string | null;
    };
  };
}

export interface DashboardResponse {
  status: "success";
  summary: DashboardSummary;
  upcomingInterviews: UpcomingInterview[];
}