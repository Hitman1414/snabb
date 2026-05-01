/**
 * Validation Schemas
 * Zod schemas for form validation
 */
import { z } from 'zod';

export const createAskSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    category: z.string().min(1, 'Category is required'),
    location: z.string().min(1, 'Location is required'),
    budget_min: z.number().min(0, 'Budget must be positive').optional(),
    budget_max: z.number().min(0, 'Budget must be positive').optional(),
    images: z.array(z.string()).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    contact_phone: z.string().optional(),
}).refine(data => {
    if (data.budget_min !== undefined && data.budget_max !== undefined) {
        return data.budget_max >= data.budget_min;
    }
    return true;
}, {
    message: "Max budget must be greater than min budget",
    path: ["budget_max"],
});

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone_number: z.string().optional().refine(val => {
        if (!val) return true;
        const cleaned = val.replace(/\D/g, '');
        return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
    }, 'Invalid phone number (must be 10 digits)'),
    location: z.string().optional(),
});

export const responseSchema = z.object({
    message: z.string().min(5, 'Message must be at least 5 characters').max(500, 'Message too long'),
    bid_amount: z.number().min(0, 'Bid cannot be negative').optional(),
});

export const reviewSchema = z.object({
    rating: z.number().min(1, 'Rating is required').max(5, 'Invalid rating'),
    comment: z.string().max(250, 'Comment too long').optional(),
});

export const messageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
});

export const profileUpdateSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone_number: z.string().optional(),
    location: z.string().optional(),
});
