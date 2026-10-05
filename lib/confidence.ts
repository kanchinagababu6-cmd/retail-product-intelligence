export function calculateConfidence(values: {
  semantic: number;
  taxonomy: number;
  attributes: number;
  keywords: number;
  historical: number;
}) {
  return Math.round(
    values.semantic * 0.4 +
      values.taxonomy * 0.25 +
      values.attributes * 0.15 +
      values.keywords * 0.1 +
      values.historical * 0.1
  );
}