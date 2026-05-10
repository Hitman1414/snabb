import { 
    Activity, 
    Utensils, 
    Home, 
    ShoppingBag, 
    Car, 
    Banknote, 
    Heart, 
    Briefcase, 
    MoreHorizontal,
    Cpu,
    Stethoscope,
    Sparkles,
    Layers
} from "lucide-react";

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

export const CATEGORY_THEMES: Record<string, any> = {
    'All': { 
        icon: Activity, 
        imageIcon: '/category-icons/all.png',
        hue: 'hue-rotate-0',
        color: '#FF6B35',
        bg: 'bg-orange-50',
        gradient: 'from-orange-400 to-red-500',
        text: 'text-orange-600',
        border: 'border-orange-100'
    },
    'Digital & Support': { 
        icon: Cpu, 
        imageIcon: '/category-icons/digital.png',
        hue: 'hue-rotate-60',
        color: '#8B5CF6',
        bg: 'bg-purple-50',
        gradient: 'from-violet-500 to-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-100'
    },
    'Food & Delivery': { 
        icon: Utensils, 
        imageIcon: '/category-icons/food.png',
        hue: 'hue-rotate-15',
        color: '#FF6B35',
        bg: 'bg-orange-50',
        gradient: 'from-orange-500 to-red-500',
        text: 'text-orange-600',
        border: 'border-orange-100'
    },
    'Home & Repairs': { 
        icon: Home, 
        imageIcon: '/category-icons/home.png',
        hue: 'hue-rotate-[180deg]',
        color: '#3B82F6',
        bg: 'bg-blue-50',
        gradient: 'from-blue-500 to-indigo-600',
        text: 'text-blue-600',
        border: 'border-blue-100'
    },
    'Errands & Shopping': { 
        icon: ShoppingBag, 
        imageIcon: '/category-icons/shopping.png',
        hue: 'hue-rotate-30',
        color: '#F59E0B',
        bg: 'bg-amber-50',
        gradient: 'from-amber-500 to-orange-600',
        text: 'text-amber-600',
        border: 'border-amber-100'
    },
    'Ride & Transport': { 
        icon: Car, 
        imageIcon: '/category-icons/ride.png',
        hue: 'hue-rotate-[150deg]',
        color: '#06B6D4',
        bg: 'bg-cyan-50',
        gradient: 'from-cyan-500 to-blue-500',
        text: 'text-cyan-600',
        border: 'border-cyan-100'
    },
    'Financial Assistance': { 
        icon: Banknote, 
        imageIcon: '/category-icons/financial.png',
        hue: 'hue-rotate-[120deg]',
        color: '#10B981',
        bg: 'bg-emerald-50',
        gradient: 'from-emerald-500 to-teal-600',
        text: 'text-emerald-600',
        border: 'border-emerald-100'
    },
    'Pet Care': { 
        icon: Heart, 
        imageIcon: '/category-icons/pet.png',
        hue: 'hue-rotate-15',
        color: '#D97706',
        bg: 'bg-yellow-50',
        gradient: 'from-yellow-600 to-amber-700',
        text: 'text-yellow-700',
        border: 'border-yellow-100'
    },
    'Health & Wellness': { 
        icon: Stethoscope, 
        imageIcon: '/category-icons/health.png',
        hue: 'hue-rotate-[300deg]',
        color: '#F43F5E',
        bg: 'bg-rose-50',
        gradient: 'from-rose-500 to-pink-600',
        text: 'text-rose-600',
        border: 'border-rose-100'
    },
    'Freelance Tasks': { 
        icon: Briefcase, 
        imageIcon: '/category-icons/freelance.png',
        hue: 'hue-rotate-[240deg]',
        color: '#6366F1',
        bg: 'bg-indigo-50',
        gradient: 'from-indigo-500 to-blue-700',
        text: 'text-indigo-600',
        border: 'border-indigo-100'
    },
    'Other': { 
        icon: Sparkles, 
        imageIcon: '/category-icons/other.png',
        hue: 'hue-rotate-[270deg]',
        color: '#6366F1',
        bg: 'bg-indigo-50',
        gradient: 'from-indigo-500 to-blue-700',
        text: 'text-indigo-600',
        border: 'border-indigo-100'
    },
    'Services': { 
        icon: Layers, 
        imageIcon: '/category-icons/services.png',
        hue: 'hue-rotate-[210deg]',
        color: '#8B5CF6',
        bg: 'bg-purple-50',
        gradient: 'from-violet-500 to-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-100'
    },
};
