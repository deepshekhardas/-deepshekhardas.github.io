import { NextResponse } from 'next/server';
import products from '@/data/products.json';

export async function GET() {
  const categories = [...new Set(products.map((p) => p.category.split(' > ')[0]))];
  return NextResponse.json(categories);
}