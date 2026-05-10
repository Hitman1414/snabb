/**
 * Category Constants
 * Centralized list of all available categories for asks with theme colors
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

export interface CategoryTheme {
  name: string;
  color: string;
  gradient: [string, string];
  darkColor: string;
  imageIcon?: any;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
    'All': { 
        name: 'grid-outline', 
        imageIcon: require('../../assets/category-icons/all.png'),
        color: '#FF6B35', 
        gradient: ['#FF6B35', '#E23744'],
        darkColor: '#FF6B35'
    },
    'Digital & Support': { 
        name: 'hardware-chip-outline', 
        imageIcon: require('../../assets/category-icons/digital.png'),
        color: '#8B5CF6', 
        gradient: ['#8B5CF6', '#6D28D9'],
        darkColor: '#7C3AED'
    },
    'Food & Delivery': { 
        name: 'fast-food-outline', 
        imageIcon: require('../../assets/category-icons/food.png'),
        color: '#FF6B35', 
        gradient: ['#FF6B35', '#E23744'],
        darkColor: '#EA580C'
    },
    'Home & Repairs': { 
        name: 'construct-outline', 
        imageIcon: require('../../assets/category-icons/home.png'),
        color: '#3B82F6', 
        gradient: ['#3B82F6', '#1D4ED8'],
        darkColor: '#2563EB'
    },
    'Errands & Shopping': { 
        name: 'bag-handle-outline', 
        imageIcon: require('../../assets/category-icons/shopping.png'),
        color: '#F59E0B', 
        gradient: ['#F59E0B', '#D97706'],
        darkColor: '#D97706'
    },
    'Ride & Transport': { 
        name: 'car-outline', 
        imageIcon: require('../../assets/category-icons/ride.png'),
        color: '#06B6D4', 
        gradient: ['#06B6D4', '#0891B2'],
        darkColor: '#0891B2'
    },
    'Financial Assistance': { 
        name: 'card-outline', 
        imageIcon: require('../../assets/category-icons/financial.png'),
        color: '#10B981', 
        gradient: ['#10B981', '#059669'],
        darkColor: '#059669'
    },
    'Pet Care': { 
        name: 'paw-outline', 
        imageIcon: require('../../assets/category-icons/pet.png'),
        color: '#D97706', 
        gradient: ['#D97706', '#92400E'],
        darkColor: '#B45309'
    },
    'Health & Wellness': { 
        name: 'medical-outline', 
        imageIcon: require('../../assets/category-icons/health.png'),
        color: '#F43F5E', 
        gradient: ['#F43F5E', '#BE123C'],
        darkColor: '#E11D48'
    },
    'Freelance Tasks': { 
        name: 'briefcase-outline', 
        imageIcon: require('../../assets/category-icons/freelance.png'),
        color: '#6366F1', 
        gradient: ['#6366F1', '#4338CA'],
        darkColor: '#4F46E5'
    },
    'Other': { 
        name: 'sparkles-outline', 
        imageIcon: require('../../assets/category-icons/other.png'),
        color: '#6366F1', 
        gradient: ['#6366F1', '#4F46E5'],
        darkColor: '#6366F1'
    },
    'Services': { 
        name: 'layers-outline', 
        imageIcon: require('../../assets/category-icons/services.png'),
        color: '#8B5CF6', 
        gradient: ['#8B5CF6', '#6D28D9'],
        darkColor: '#8B5CF6'
    },
};

// For backward compatibility
export const CATEGORY_ICONS = CATEGORY_THEMES;
