export interface ClassificationResult {
  expandedProductName: string;
  department: string;
  category: string;
  subCategory: string;
  closestLeafNode: {
    id: string;
    name: string;
    path: string;
  };
  productAttributes: Record<string, string>;
  tags: string[];
  confidenceScore: number;
  reason: string;
  alternatives: {
    leafNodeId: string;
    name: string;
    path: string;
    confidenceScore: number;
    reason: string;
  }[];
  requiresHumanReview: boolean;
}