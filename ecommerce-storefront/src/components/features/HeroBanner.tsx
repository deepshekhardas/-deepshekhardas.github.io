import Link from 'next/link';

const HeroBanner = () => {
  return (
    <div className="relative bg-cover bg-center h-96 rounded-lg overflow-hidden" style={{ backgroundImage: "url('https://picsum.photos/seed/hero/1600/900')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">New Season Arrivals</h1>
          <p className="text-lg md:text-2xl mb-8">Check out all the new trends</p>
          <Link href="/products" className="bg-white text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition duration-300">
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;