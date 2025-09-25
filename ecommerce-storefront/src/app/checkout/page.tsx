"use client";

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartContext } from '@/context/CartContext';

const CheckoutPage = () => {
  const { state, dispatch } = useContext(CartContext);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const subtotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this data to your backend
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: state.items, formData }),
    });
    const data = await response.json();
    if (data.success) {
      dispatch({ type: 'SET_CART', payload: [] }); // Clear the cart
      router.push(`/confirmation?orderId=${data.orderId}`);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Your cart is empty.</h1>
        <p>You can't proceed to checkout without any items.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold mb-4">Shipping Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <input type="text" name="name" placeholder="Full Name" aria-label="Full Name" onChange={handleInputChange} className="p-3 border rounded-md" required />
              <input type="email" name="email" placeholder="Email Address" aria-label="Email Address" onChange={handleInputChange} className="p-3 border rounded-md" required />
              <input type="text" name="address" placeholder="Address" aria-label="Address" onChange={handleInputChange} className="p-3 border rounded-md" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="city" placeholder="City" aria-label="City" onChange={handleInputChange} className="p-3 border rounded-md" required />
                <input type="text" name="state" placeholder="State" aria-label="State" onChange={handleInputChange} className="p-3 border rounded-md" required />
              </div>
              <input type="text" name="zip" placeholder="ZIP Code" aria-label="ZIP Code" onChange={handleInputChange} className="p-3 border rounded-md" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 mt-6">
              Place Order
            </button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
          {state.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center mb-2">
              <span>{item.title} x {item.quantity}</span>
              <span>${(item.price * item.quantity / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-xl border-t pt-4 mt-4">
            <span>Total</span>
            <span>${(subtotal / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;