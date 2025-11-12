export const translateCategoryName = (name = '') => {
  const normalized = name.trim();
  const categoryTranslations = {
    'Nước Ép Mix': 'Mixed Cold-Pressed Juices',
    'Trà Trái Cây': 'Fruit Tea',
    'Trà Sữa': 'Milk Tea',
    'Yogurt': 'Yogurt',
    'Cafe': 'Coffee'
  };

  return categoryTranslations[normalized] || normalized;
};


