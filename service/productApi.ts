import axiosInstance from "../lib/axiosInstance"

export interface Product {
	id?: number;
	clubId: number;
	name: string;
	description: string;
	pricePoints: number;
	stockQuantity: number;
}

export async function getProduct({ page = 0, size = 10, sort = "name" } = {}): Promise<Product[]> {
	const res = await axiosInstance.get("/api/products", {
		params: { page, size, sort },
	});
	const data = res.data as { content?: Product[] };
	return Array.isArray(data.content) ? data.content : [];
}

// POST /api/products - add a new product
export async function addProduct(productData: Product): Promise<any> {
	const res = await axiosInstance.post("/api/products", productData);
	return res.data;
}
