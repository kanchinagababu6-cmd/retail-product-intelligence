export interface Product {
  id: string;
  retailerId: string;
  inputName: string;
  expandedName?: string;
  brand?: string | null;
  productType?: string | null;
  departmentId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  leafNodeId?: string | null;
  tags: string[];
  confidenceScore?: number;
}