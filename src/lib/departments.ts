export const DEPARTMENTS = [
  "Automotive Engineering Department",
  "Civil Engineering Department",
  "Department of Applied Sciences and Social Studies",
  "Electrical Engineering Department",
  "Information And Communication Technology",
  "Mechanical Engineering Department",
  "Transportation Engineering Department",
  "Vocational Education and Training Department",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
