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
}).refine(data => {
    if (data.budget_min && data.budget_max) {
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
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().optional(),
});
