// Email validation
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

// Password validation
export interface PasswordValidation {
    valid: boolean;
    errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

// Phone number validation (Indian format)
export const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid Indian phone number (10 digits)
    // Or international format with country code (+91)
    return /^[6-9]\d{9}$/.test(cleaned) || /^91[6-9]\d{9}$/.test(cleaned);
};

// Required field validation
export const validateRequired = (value: string): boolean => {
    return value.trim().length > 0;
};

// Input sanitization (prevent XSS)
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
};

// Bid amount validation
export const validateBidAmount = (
    amount: number,
    min?: number,
    max?: number
): { valid: boolean; error?: string } => {
    if (isNaN(amount) || amount <= 0) {
        return { valid: false, error: 'Bid amount must be a positive number' };
    }

    if (min !== undefined && amount < min) {
        return { valid: false, error: `Bid amount must be at least ₹${min.toLocaleString()}` };
    }

    if (max !== undefined && amount > max) {
        return { valid: false, error: `Bid amount cannot exceed ₹${max.toLocaleString()}` };
    }

    return { valid: true };
};

// Character length validation
export const validateLength = (
    value: string,
    min: number,
    max: number
): { valid: boolean; error?: string } => {
    const length = value.trim().length;

    if (length < min) {
        return { valid: false, error: `Must be at least ${min} characters` };
    }

    if (length > max) {
        return { valid: false, error: `Must not exceed ${max} characters` };
    }

    return { valid: true };
};

// Username validation
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
    const trimmed = username.trim();

    if (trimmed.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (trimmed.length > 20) {
        return { valid: false, error: 'Username must not exceed 20 characters' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }

    return { valid: true };
};

// Budget range validation
export const validateBudgetRange = (
    min?: number,
    max?: number
): { valid: boolean; error?: string } => {
    if (min !== undefined && max !== undefined && min > max) {
        return { valid: false, error: 'Minimum budget cannot be greater than maximum budget' };
    }

    if (min !== undefined && min < 0) {
        return { valid: false, error: 'Budget cannot be negative' };
    }

    if (max !== undefined && max < 0) {
        return { valid: false, error: 'Budget cannot be negative' };
    }

    return { valid: true };
};
