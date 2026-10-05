export interface TaxonomyLeaf {
  id: string;
  retailerId: string;
  departmentId: string;
  categoryId: string;
  subCategoryId: string;
  name: string;
  fullPath: string;
  keywords: string[];
  synonyms: string[];
  attributes: Record<string, string>;
  status: "ACTIVE" | "INACTIVE";
}