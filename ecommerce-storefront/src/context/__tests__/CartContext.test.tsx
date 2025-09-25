import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider, CartContext } from '../CartContext';
import { useContext } from 'react';
import type { Product } from '@/lib/types';

const mockProduct: Product = {
  id: 'p001',
  title: 'Test Product',
  slug: 'test-product',
  price: 1000,
  category: 'Test',
  rating: 5,
  reviews: 10,
  stock: 10,
  images: [''],
  description: 'Test description',
  tags: ['test'],
  createdAt: '2025-01-01',
};

const TestComponent = () => {
  const { state, dispatch } = useContext(CartContext);
  return (
    <div>
      <div data-testid="cart-count">{state.items.length}</div>
      <button onClick={() => dispatch({ type: 'ADD_ITEM', payload: mockProduct })}>
        Add Item
      </button>
      <button onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: 'p001' } })}>
        Remove Item
      </button>
    </div>
  );
};

describe('CartContext', () => {
  it('adds an item to the cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Item'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
  });

  it('removes an item from the cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Remove Item'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });
});