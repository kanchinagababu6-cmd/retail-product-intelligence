export interface Retailer {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  taxonomyVersion: string;
  status: "ACTIVE" | "INACTIVE";
}