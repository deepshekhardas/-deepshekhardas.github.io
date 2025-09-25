import Link from 'next/link';
import products from '@/data/products.json';

const FeaturedProducts = () => {
  const featured = products.slice(0, 4);

  return (
    <div className="my-12">
      <h2 className="text-3xl font-bold text-center mb-8">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {featured.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
              <img src={product.images[0]} alt={product.title} className="w-full h-64 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800">{product.title}</h3>
                <p className="text-gray-600 mt-2">${(product.price / 100).toFixed(2)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts;