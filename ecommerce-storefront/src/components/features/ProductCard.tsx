import Link from 'next/link';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
        <img src={product.images[0]} alt={product.title} className="w-full h-64 object-cover" />
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 truncate">{product.title}</h3>
          <p className="text-gray-600 mt-2">${(product.price / 100).toFixed(2)}</p>
          <div className="flex items-center mt-2">
            <span className="text-yellow-500">{'★'.repeat(Math.round(product.rating))}</span>
            <span className="text-gray-400">{'★'.repeat(5 - Math.round(product.rating))}</span>
            <span className="text-gray-500 text-sm ml-2">({product.reviews} reviews)</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;