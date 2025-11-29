import { Link } from 'react-router-dom';

interface MegaMenuProps {
  petType: 'dog' | 'cat' | 'other';
}

const MegaMenu = ({ petType }: MegaMenuProps) => {
  const menuData = {
    dog: [
      {
        title: 'Food',
        items: [
          'Dry Food',
          'Wet Food',
          'Fresh Food & Toppers',
          'Veterinary Diets',
          'Science-Backed Formulas',
          'Puppy Food'
        ]
      },
      {
        title: 'Treats',
        items: [
          'Bones, Bully Sticks & Naturals',
          'Soft & Chewy Treats',
          'Dental Treats',
          'Biscuits & Cookies',
          'Long-Lasting Chews',
          'Jerky Treats',
          'Freeze-Dried & Dehydrated'
        ]
      },
      {
        title: 'Health & Pharmacy',
        items: [
          'Flea & Tick',
          'Vitamins & Supplements',
          'Allergy & Itch Relief',
          'Heartworm & Dewormers',
          'Pharmacy & Prescriptions',
          'Anxiety & Calming Care',
          'DNA Testing Kits'
        ]
      },
      {
        title: 'Supplies',
        items: [
          'Crates, Pens & Gates',
          'Beds',
          'Tech & Smart Home',
          'Leashes, Collars & Harnesses',
          'Bowls & Feeders',
          'Clothing & Accessories',
          'Carriers & Travel',
          'Training & Behavior'
        ]
      },
      {
        title: 'Toys',
        items: [
          'Plush Toys',
          'Chew Toys',
          'Fetch Toys',
          'Treat Dispensing Toys',
          'Puzzle Toys',
          'Rope & Tug Toys'
        ]
      },
      {
        title: 'Cleaning & Potty',
        items: [
          'Pee Pads & Diapers',
          'Poop Bags & Scoopers',
          'Cleaners & Stain Removers',
          'Vacuums & Steam Cleaners'
        ]
      },
      {
        title: 'Grooming',
        items: [
          'Brushes & Combs',
          'Shampoos & Conditioners',
          'Grooming Tools',
          'Paw & Nail Care',
          'Ear Care',
          'Skin Care'
        ]
      },
      {
        title: 'More',
        items: [
          'Dog Deals',
          'New Dog Supplies',
          'Pet Parent Supplies',
          'Shop all Dog'
        ]
      }
    ],
    cat: [
      {
        title: 'Food',
        items: [
          'Dry Food',
          'Wet Food',
          'Fresh Food & Toppers',
          'Veterinary Diets',
          'Science-Backed Formulas',
          'Kitten Food'
        ]
      },
      {
        title: 'Treats',
        items: [
          'Soft & Chewy Treats',
          'Crunchy Treats',
          'Dental Treats',
          'Catnip & Grass',
          'Freeze-Dried & Dehydrated'
        ]
      },
      {
        title: 'Health & Pharmacy',
        items: [
          'Flea & Tick',
          'Vitamins & Supplements',
          'Allergy & Itch Relief',
          'Heartworm & Dewormers',
          'Pharmacy & Prescriptions',
          'Anxiety & Calming Care'
        ]
      },
      {
        title: 'Litter & Accessories',
        items: [
          'Litter',
          'Litter Boxes',
          'Litter Box Liners & Filters',
          'Litter Scoops & Caddies',
          'Litter Mats',
          'Litter Box Furniture'
        ]
      },
      {
        title: 'Supplies',
        items: [
          'Beds',
          'Carriers & Travel',
          'Bowls & Feeders',
          'Scratchers & Furniture',
          'Collars, Harnesses & Leashes',
          'Clothing & Accessories'
        ]
      },
      {
        title: 'Toys',
        items: [
          'Interactive Toys',
          'Mice & Animals',
          'Balls',
          'Wands & Teasers',
          'Catnip Toys',
          'Laser Toys'
        ]
      },
      {
        title: 'Grooming',
        items: [
          'Brushes & Combs',
          'Shampoos & Conditioners',
          'Grooming Tools',
          'Nail Care',
          'Ear Care'
        ]
      },
      {
        title: 'More',
        items: [
          'Cat Deals',
          'New Cat Supplies',
          'Pet Parent Supplies',
          'Shop all Cat'
        ]
      }
    ],
    other: [
      {
        title: 'Birds',
        items: [
          'Food',
          'Treats',
          'Cages & Accessories',
          'Toys',
          'Health & Wellness'
        ]
      },
      {
        title: 'Fish',
        items: [
          'Food',
          'Aquariums & Bowls',
          'Filters & Pumps',
          'Decorations',
          'Water Care',
          'Lighting'
        ]
      },
      {
        title: 'Small Pets',
        items: [
          'Food',
          'Treats',
          'Habitats & Cages',
          'Bedding & Litter',
          'Toys',
          'Health & Wellness'
        ]
      },
      {
        title: 'Reptiles',
        items: [
          'Food',
          'Terrariums & Habitats',
          'Heating & Lighting',
          'Substrate & Bedding',
          'Décor',
          'Health & Wellness'
        ]
      },
      {
        title: 'Farm Animals',
        items: [
          'Chicken Food',
          'Livestock Food',
          'Housing & Bedding',
          'Health & Wellness',
          'Supplies'
        ]
      },
      {
        title: 'Horses',
        items: [
          'Food & Treats',
          'Supplements',
          'Grooming',
          'Tack & Equipment',
          'Health & Wellness'
        ]
      }
    ]
  };

  const categories = menuData[petType] || [];

  return (
    <div className="absolute left-0 right-0 top-full bg-white shadow-2xl border-t-2 border-primary-500 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] mt-0">
      <div className="container mx-auto px-6 lg:px-8 py-8 max-w-7xl">
        <div className="grid grid-cols-4 gap-x-10 gap-y-10">
          {categories.map((category, index) => (
            <div key={index}>
              <Link
                to={`/category/${encodeURIComponent(category.title.toLowerCase().replace(/\s+/g, '-'))}?petType=${petType}`}
                className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-1.5 hover:text-primary-600 transition-colors cursor-pointer"
              >
                {category.title}
                <span className="text-gray-400 text-xs">›</span>
              </Link>
              <ul className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      to={`/category/${encodeURIComponent(item.toLowerCase().replace(/\s+/g, '-'))}?petType=${petType}`}
                      className="text-sm text-gray-700 hover:text-primary-600 hover:underline block transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;

