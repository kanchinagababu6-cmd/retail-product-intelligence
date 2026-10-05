export async function classifyProduct(productName: string, retailerId: string) {
  return {
    productName,
    retailerId,
    status: "PENDING"
  };
}