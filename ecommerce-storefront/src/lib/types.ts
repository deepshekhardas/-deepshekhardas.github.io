export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  stock: number;
  images: string[];
  description: string;
  tags: string[];
  createdAt: string;
}