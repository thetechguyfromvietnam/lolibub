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

export const translateDrinkName = (name = '') => {
  const normalized = name.trim();

  const drinkTranslations = {
    'Trà Đác Thơm': 'Pineapple Palm Seed Tea',
    'Trà Đào': 'Peach Tea',
    'Trà Atiso Đỏ': 'Ruby Hibiscus Tea',
    'Trà Vải Hoa Anh Đào': 'Lychee Cherry Blossom Tea',
    'Trà Sữa Loli': 'Lolibub Signature Milk Tea',
    'Trà Sữa Truyền Thống': 'Classic Milk Tea',
    'Mix Ngũ Cốc Nướng': 'Crunchy Granola Yogurt',
    'Trái Cây Tô Yogurt': 'Fresh Fruit Yogurt Bowl',
    'Cafe Đen Đá': 'Iced Black Coffee',
    'Cafe Sữa': 'Vietnamese Iced Milk Coffee',
    'Bạc Xíu': 'Saigon White Coffee',
    'Bạc Xỉu': 'Saigon White Coffee'
  };

  return drinkTranslations[normalized] || normalized;
};


