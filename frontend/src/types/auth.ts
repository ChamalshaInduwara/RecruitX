export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "RECRUITER";
  status: "ACTIVE" | "INACTIVE";
}

export interface LoginResponse {
  status: "success";
  message: string;
  token: string;
  user: User;
}