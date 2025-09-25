import { useState, useEffect } from 'react';

interface FiltersProps {
  onFilterChange: (filters: any) => void;
}

const Filters = ({ onFilterChange }: FiltersProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState(20000);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (category: string) => {
    const newSelectedCategories = new Set(selectedCategories);
    if (newSelectedCategories.has(category)) {
      newSelectedCategories.delete(category);
    } else {
      newSelectedCategories.add(category);
    }
    setSelectedCategories(newSelectedCategories);
    onFilterChange({ category: newSelectedCategories, price, rating });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = Number(e.target.value);
    setPrice(newPrice);
    onFilterChange({ category: selectedCategories, price: newPrice, rating });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRating = Number(e.target.value);
    setRating(newRating);
    onFilterChange({ category: selectedCategories, price, rating: newRating });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Filters</h3>
      <div>
        <h4 className="font-bold mb-2">Category</h4>
        {categories.map((category) => (
          <div key={category} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={category}
              name={category}
              onChange={() => handleCategoryChange(category)}
              checked={selectedCategories.has(category)}
            />
            <label htmlFor={category} className="ml-2">{category}</label>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h4 className="font-bold mb-2">Price Range</h4>
        <input type="range" min="0" max="20000" value={price} onChange={handlePriceChange} className="w-full" />
        <div className="text-right">${(price / 100).toFixed(2)}</div>
      </div>
      <div className="mt-6">
        <h4 className="font-bold mb-2">Rating</h4>
        <div className="flex items-center">
          <input type="radio" id="rating-any" name="rating" value="0" onChange={handleRatingChange} checked={rating === 0} />
          <label htmlFor="rating-any" className="ml-2">Any</label>
        </div>
        <div className="flex items-center">
          <input type="radio" id="rating-4" name="rating" value="4" onChange={handleRatingChange} checked={rating === 4} />
          <label htmlFor="rating-4" className="ml-2">4+ Stars</label>
        </div>
        <div className="flex items-center">
          <input type="radio" id="rating-3" name="rating" value="3" onChange={handleRatingChange} checked={rating === 3} />
          <label htmlFor="rating-3" className="ml-2">3+ Stars</label>
        </div>
      </div>
    </div>
  );
};

export default Filters;