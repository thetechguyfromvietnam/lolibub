const DEFAULT_DRINK_IMAGE = '/images/red-energy.jpg';

export const heroBackgrounds = [
  '/images/Background/background-1.jpg',
  '/images/Background/background-2.jpg',
  '/images/Background/background-3.jpg',
  '/images/Background/background-4.jpg',
  '/images/Background/background-5.jpg'
];

const drinkImagesByName = {
  'red energy': '/images/red-energy.jpg',
  'energy boost': '/images/energy-boost.jpg',
  'green vitality': '/images/green-vitality.jpg',
  'heart shine': '/images/refresh-balance.jpg',
  'green detox': '/images/green-detox.jpg',
  refresh: '/images/refresh.jpg',
  'energy recharge': '/images/energy-recharge.jpg',
  'rf balance': '/images/refresh-balance.jpg',
  'nước ép nguyên vị / nước ép chai': '/images/red-energy.jpg',
  'trà đác thơm': '/images/tra-dac-thom.jpg',
  'trà đào': '/images/tra-dao.jpg',
  'trà atiso đỏ': '/images/tra-atiso-do.jpg',
  'trà vải hoa anh đào': '/images/tra-hoa-anh-dao.jpg',
  'trà sữa loli': '/images/tra-sua.jpg',
  'trà sữa truyền thống': '/images/tra-sua.jpg',
  'mix ngũ cốc nướng': '/images/trai-cay-to.jpg',
  'trái cây tô yogurt': '/images/trai-cay-to.jpg',
  'cafe đen đá': '/images/ca-phe-den.jpg',
  'cafe sữa': '/images/ca-phe-sua.jpg',
  'bạc xíu': '/images/bac-xiu.jpg'
};

const juiceCycleImages = [
  '/images/red-energy.jpg',
  '/images/energy-boost.jpg',
  '/images/green-vitality.jpg',
  '/images/green-detox.jpg',
  '/images/refresh.jpg',
  '/images/energy-recharge.jpg',
  '/images/refresh-balance.jpg'
];

const teaCycleImages = [
  '/images/tra-dac-thom.jpg',
  '/images/tra-dao.jpg',
  '/images/tra-atiso-do.jpg',
  '/images/tra-hoa-anh-dao.jpg'
];

export function resolveDrinkImage(category = '', name = '', index = 0) {
  const normalizedName = name.trim().toLowerCase();
  if (normalizedName && drinkImagesByName[normalizedName]) {
    return drinkImagesByName[normalizedName];
  }

  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes('ép mix')) {
    return juiceCycleImages[index % juiceCycleImages.length];
  }

  if (normalizedCategory.includes('nguyên vị')) {
    return juiceCycleImages[index % juiceCycleImages.length];
  }

  if (normalizedCategory.includes('trà trái cây')) {
    return teaCycleImages[index % teaCycleImages.length];
  }

  if (normalizedCategory.includes('trà sữa')) {
    return '/images/tra-sua.jpg';
  }

  if (normalizedCategory.includes('yogurt')) {
    return '/images/trai-cay-to.jpg';
  }

  if (normalizedCategory.includes('cafe')) {
    const cafeImages = [
      '/images/ca-phe-den.jpg',
      '/images/ca-phe-sua.jpg',
      '/images/bac-xiu.jpg'
    ];
    return cafeImages[index % cafeImages.length];
  }

  return DEFAULT_DRINK_IMAGE;
}

export function getDefaultDrinkImage() {
  return DEFAULT_DRINK_IMAGE;
}

