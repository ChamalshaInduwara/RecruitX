export type InterviewStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export interface Interview {
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

  application: {
    id: string;
    status: string;

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

export interface InterviewsResponse {
  status: "success";
  count: number;
  interviews: Interview[];
}