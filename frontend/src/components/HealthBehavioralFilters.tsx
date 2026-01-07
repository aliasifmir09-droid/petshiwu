import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface HealthBehavioralFiltersProps {
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

/**
 * Health & Behavioral Filters Component
 * Allows filtering products by health conditions and behavioral needs
 * Uses product tags/features for filtering
 */
const HealthBehavioralFilters = ({
  selectedFilters,
  onFilterChange
}: HealthBehavioralFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Health condition filters
  const healthFilters = [
    { id: 'sensitive-stomach', label: 'Sensitive Stomach', category: 'health' },
    { id: 'allergies', label: 'Allergies', category: 'health' },
    { id: 'urinary-health', label: 'Urinary Health', category: 'health' },
    { id: 'joint-health', label: 'Joint Health', category: 'health' },
    { id: 'weight-management', label: 'Weight Management', category: 'health' },
    { id: 'dental-health', label: 'Dental Health', category: 'health' },
    { id: 'skin-health', label: 'Skin & Coat Health', category: 'health' },
    { id: 'kidney-health', label: 'Kidney Health', category: 'health' }
  ];

  // Behavioral filters
  const behavioralFilters = [
    { id: 'picky-eater', label: 'Picky Eater', category: 'behavioral' },
    { id: 'aggressive-chewer', label: 'Aggressive Chewer', category: 'behavioral' },
    { id: 'high-energy', label: 'High Energy', category: 'behavioral' },
    { id: 'senior', label: 'Senior Pet', category: 'behavioral' },
    { id: 'puppy-kitten', label: 'Puppy/Kitten', category: 'behavioral' }
  ];

  // Dietary filters
  const dietaryFilters = [
    { id: 'grain-free', label: 'Grain Free', category: 'dietary' },
    { id: 'limited-ingredient', label: 'Limited Ingredient', category: 'dietary' },
    { id: 'high-protein', label: 'High Protein', category: 'dietary' },
    { id: 'natural', label: 'Natural', category: 'dietary' },
    { id: 'organic', label: 'Organic', category: 'dietary' }
  ];

  const toggleFilter = (filterId: string) => {
    if (selectedFilters.includes(filterId)) {
      onFilterChange(selectedFilters.filter(f => f !== filterId));
    } else {
      onFilterChange([...selectedFilters, filterId]);
    }
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const allFilters = [...healthFilters, ...behavioralFilters, ...dietaryFilters];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-semibold text-gray-900 mb-4"
      >
        <span>Health & Special Needs Filters</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="space-y-6">
          {/* Health Conditions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Health Conditions</h3>
            <div className="flex flex-wrap gap-2">
              {healthFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.includes(filter.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Behavioral Needs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Behavioral Needs</h3>
            <div className="flex flex-wrap gap-2">
              {behavioralFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.includes(filter.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dietary Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {dietaryFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.includes(filter.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {selectedFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X size={16} />
              Clear all filters ({selectedFilters.length})
            </button>
          )}
        </div>
      )}

      {/* Selected Filters Display */}
      {selectedFilters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filterId) => {
              const filter = allFilters.find(f => f.id === filterId);
              return filter ? (
                <span
                  key={filterId}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {filter.label}
                  <button
                    onClick={() => toggleFilter(filterId)}
                    className="hover:text-primary-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthBehavioralFilters;

