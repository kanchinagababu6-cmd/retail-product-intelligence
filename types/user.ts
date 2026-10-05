export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: "AGENT" | "REVIEWER" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
}