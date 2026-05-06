/**
 * Category Constants
 * Centralized list of all available categories for asks
 */

export const CATEGORIES = [
  'Digital & Support',
  'Food & Delivery',
  'Home & Repairs',
  'Errands & Shopping',
  'Ride & Transport',
  'Financial Assistance',
  'Pet Care',
  'Health & Wellness',
  'Freelance Tasks',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_ICONS: Record<string, { name: string; color: string }> = {
    'All': { name: 'grid-outline', color: '#121212' },
    'Digital & Support': { name: 'hardware-chip-outline', color: '#8B5CF6' },
    'Food & Delivery': { name: 'fast-food-outline', color: '#E23744' },
    'Home & Repairs': { name: 'construct-outline', color: '#AF52DE' },
    'Errands & Shopping': { name: 'bag-handle-outline', color: '#FF9500' },
    'Ride & Transport': { name: 'car-outline', color: '#007AFF' },
    'Financial Assistance': { name: 'card-outline', color: '#10B981' },
    'Pet Care': { name: 'paw-outline', color: '#A2845E' },
    'Health & Wellness': { name: 'medical-outline', color: '#FF3B30' },
    'Freelance Tasks': { name: 'briefcase-outline', color: '#6366F1' },
    'Other': { name: 'ellipsis-horizontal-circle-outline', color: '#5A6066' },
};
