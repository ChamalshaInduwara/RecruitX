export type UserRole =
  | "ADMIN"
  | "RECRUITER";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;

  _count: {
    createdVacancies: number;
    interviews: number;
  };
}

export interface UsersResponse {
  status: "success";
  count: number;
  users: SystemUser[];
}

export interface UserActionResponse {
  status: "success";
  message: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
  };
}