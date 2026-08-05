import { apiGet } from "./api";

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  description: string | null;
  is_free: boolean;
}

export interface University {
  id: string;
  name: string;
  short_name: string | null;
}

export interface Course {
  id: string;
  name: string;
  total_semesters: number;
  university_id: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string | null;
  course_id: string;
}

export interface Scheme {
  id: string;
  name: string;
  year: number | null;
  branch_id: string;
}

export const hierarchyApi = {
  getUniversities: () => apiGet<University[]>("/universities"),
  getCourses: (universityId: string) => apiGet<Course[]>(`/courses?universityId=${encodeURIComponent(universityId)}`),
  getBranches: (courseId: string) => apiGet<Branch[]>(`/branches?courseId=${encodeURIComponent(courseId)}`),
  getSchemes: (branchId: string) => apiGet<Scheme[]>(`/schemes?branchId=${encodeURIComponent(branchId)}`),
  getSemesters: (schemeId: string) => apiGet<number[]>(`/semesters?schemeId=${encodeURIComponent(schemeId)}`),
  getSubjects: (schemeId: string, semester: number) =>
    apiGet<Subject[]>(`/subjects?schemeId=${encodeURIComponent(schemeId)}&semester=${semester}`),
};


