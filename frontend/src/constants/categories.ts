export interface Category {
  id: string;
  name: string;
  icon: string; // MaterialCommunityIcons name
  color: string;
}

export const expenseCategories: Category[] = [
  { id: 'general', name: 'General', icon: 'receipt', color: '#8899AA' },
  { id: 'food', name: 'Food & Dining', icon: 'food-fork-drink', color: '#FF9800' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping', color: '#E91E63' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie-open', color: '#9C27B0' },
  { id: 'transportation', name: 'Transport', icon: 'car', color: '#5B9BD5' },
  { id: 'home', name: 'Home', icon: 'home', color: '#795548' },
  { id: 'utilities', name: 'Utilities', icon: 'lightbulb-on', color: '#607D8B' },
  { id: 'medical', name: 'Medical', icon: 'hospital-box', color: '#FF6B6B' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#00BCD4' },
  { id: 'groceries', name: 'Groceries', icon: 'cart', color: '#4CAF50' },
  { id: 'rent', name: 'Rent', icon: 'home-city', color: '#FF7043' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'credit-card-refresh', color: '#AB47BC' },
];

export const getCategoryById = (id: string): Category =>
  expenseCategories.find((c) => c.id === id) || expenseCategories[0];

export const getCategoryColor = (id: string): string =>
  getCategoryById(id).color;

export const getCategoryIcon = (id: string): string =>
  getCategoryById(id).icon;
