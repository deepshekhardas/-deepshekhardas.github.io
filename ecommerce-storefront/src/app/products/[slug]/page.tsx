"use client";

import { useState, useContext } from 'react';
import products from '@/data/products.json';
import type { Product } from '@/lib/types';
import { CartContext } from '@/context/CartContext';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

const ProductPage = ({ params }: ProductPageProps) => {
  const product = products.find((p) => p.slug === params.slug) as Product | undefined;
  const [selectedImage, setSelectedImage] = useState(product?.images[0] || '');
  const [quantity, setQuantity] = useState(1);
  const { dispatch } = useContext(CartContext);

  if (!product) {
    return <div>Product not found</div>;
  }

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: { ...product, quantity } });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={selectedImage} alt={product.title} className="w-full rounded-lg shadow-md" />
          <div className="flex space-x-2 mt-4">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.title} thumbnail ${index + 1}`}
                className={`w-24 h-24 object-cover rounded-lg cursor-pointer border-2 ${selectedImage === image ? 'border-blue-500' : 'border-transparent'}`}
                onClick={() => setSelectedImage(image)}
              />
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
          <div className="flex items-center mb-4">
            <span className="text-yellow-500">{'★'.repeat(Math.round(product.rating))}</span>
            <span className="text-gray-400">{'★'.repeat(5 - Math.round(product.rating))}</span>
            <span className="text-gray-500 text-sm ml-2">({product.reviews} reviews)</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-4">${(product.price / 100).toFixed(2)}</p>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="mb-6">
            <span className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="flex items-center mb-6">
            <label htmlFor="quantity" className="font-bold mr-4">Quantity:</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 p-2 border rounded-md"
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
            disabled={product.stock === 0}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;