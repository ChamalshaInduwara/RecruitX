export type VacancyStatus =
  | "DRAFT"
  | "ACTIVE"
  | "CLOSED";

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

  _count?: {
    applications: number;
  };
}

export interface VacanciesResponse {
  status: "success";
  count: number;
  vacancies: Vacancy[];
}

export interface CreateVacancyResponse {
  status: "success";
  message: string;
  vacancy: Vacancy;
}