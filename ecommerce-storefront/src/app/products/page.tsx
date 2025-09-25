"use client";

import { useState, useEffect } from 'react';
import ProductCard from '@/components/features/ProductCard';
import Filters from '@/components/features/Filters';
import allProducts from '@/data/products.json';
import type { Product } from '@/lib/types';

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    category: new Set<string>(),
    price: 20000,
    rating: 0,
  });
  const [sortOrder, setSortOrder] = useState('popular');

  useEffect(() => {
    setProducts(allProducts as Product[]);
    setFilteredProducts(allProducts as Product[]);
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    let filtered = [...products];

    if (newFilters.category.size > 0) {
      filtered = filtered.filter((p) => newFilters.category.has(p.category.split(' > ')[0]));
    }

    if (newFilters.price < 20000) {
      filtered = filtered.filter((p) => p.price <= newFilters.price);
    }

    if (newFilters.rating > 0) {
      filtered = filtered.filter((p) => p.rating >= newFilters.rating);
    }

    setFilteredProducts(filtered);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOrder) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default: // popular
        return b.reviews - a.reviews;
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center my-8">
        <h1 className="text-3xl font-bold">All Products</h1>
        <select onChange={handleSortChange} value={sortOrder} className="p-2 border rounded-md">
          <option value="popular">Most Popular</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Filters onFilterChange={handleFilterChange} />
        </div>
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;