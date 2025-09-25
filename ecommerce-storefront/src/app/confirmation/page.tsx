"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const ConfirmationPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">Thank you for your order!</h1>
      <p className="text-xl mb-2">Your order has been placed successfully.</p>
      <p className="text-lg mb-8">
        Your order ID is: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{orderId}</span>
      </p>
      <Link href="/" className="text-blue-600 hover:underline">
        Continue Shopping
      </Link>
    </div>
  );
};

export default ConfirmationPage;