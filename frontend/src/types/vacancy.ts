export type VacancyStatus =
  | "DRAFT"
  | "ACTIVE"
  | "CLOSED";

export interface VacancyApplication {
  id: string;
  status: string;
  appliedAt: string;

  candidate: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface Vacancy {
  id: string;
  title: string;
  department: string | null;
  description: string;
  requiredSkills: string | null;
  employmentType: string | null;
  deadline: string | null;
  status: VacancyStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  creator?: {
    id: string;
    name: string;
    email: string;
  };

  applications?: VacancyApplication[];

  _count?: {
    applications: number;
  };
}

export interface VacanciesResponse {
  status: "success";
  count: number;
  vacancies: Vacancy[];
}

export interface VacancyResponse {
  status: "success";
  vacancy: Vacancy;
}

export interface CreateVacancyResponse {
  status: "success";
  message: string;
  vacancy: Vacancy;
}

export interface UpdateVacancyResponse {
  status: "success";
  message: string;
  vacancy: Vacancy;
}