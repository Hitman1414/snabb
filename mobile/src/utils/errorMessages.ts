export const ERROR_MESSAGES = {
    // Authentication errors
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',
        ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
        SESSION_EXPIRED: 'Your session has expired. Please login again.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        REGISTRATION_FAILED: 'Registration failed. Please try again.',
        USER_EXISTS: 'An account with this email or username already exists.',
    },

    // Validation errors
    VALIDATION: {
        REQUIRED_FIELD: 'This field is required',
        INVALID_EMAIL: 'Please enter a valid email address',
        INVALID_PHONE: 'Please enter a valid phone number',
        WEAK_PASSWORD: 'Password does not meet security requirements',
        PASSWORDS_DONT_MATCH: 'Passwords do not match',
        INVALID_USERNAME: 'Username contains invalid characters',
        INVALID_BID: 'Please enter a valid bid amount',
        BUDGET_RANGE_INVALID: 'Invalid budget range',
    },

    // Network errors
    NETWORK: {
        NO_CONNECTION: 'No internet connection. Please check your network.',
        TIMEOUT: 'Request timed out. Please try again.',
        SERVER_ERROR: 'Server error. Please try again later.',
        UNKNOWN_ERROR: 'Something went wrong. Please try again.',
    },

    // API errors
    API: {
        NOT_FOUND: 'The requested resource was not found.',
        FORBIDDEN: 'You do not have permission to access this resource.',
        BAD_REQUEST: 'Invalid request. Please check your input.',
        CONFLICT: 'This action conflicts with existing data.',
    },

    // Success messages
    SUCCESS: {
        LOGIN: 'Welcome back!',
        REGISTRATION: 'Account created successfully!',
        ASK_CREATED: 'Your ask has been posted successfully!',
        RESPONSE_SUBMITTED: 'Your response has been submitted!',
        RESPONSE_ACCEPTED: 'Response accepted successfully!',
        PROFILE_UPDATED: 'Profile updated successfully!',
    },
};

// Helper to get user-friendly error message from API error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getErrorMessage = (error: any): string => {
    if (!error) return ERROR_MESSAGES.NETWORK.UNKNOWN_ERROR;

    // Network errors
    if (error.code === 'ECONNABORTED') {
        return ERROR_MESSAGES.NETWORK.TIMEOUT;
    }

    if (error.message === 'Network Error') {
        return ERROR_MESSAGES.NETWORK.NO_CONNECTION;
    }

    // API errors
    if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        switch (status) {
            case 400:
                return typeof detail === 'string' ? detail : ERROR_MESSAGES.API.BAD_REQUEST;
            case 401:
                return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
            case 403:
                return ERROR_MESSAGES.API.FORBIDDEN;
            case 404:
                return ERROR_MESSAGES.API.NOT_FOUND;
            case 409:
                return typeof detail === 'string' ? detail : ERROR_MESSAGES.API.CONFLICT;
            case 500:
            case 502:
            case 503:
                return ERROR_MESSAGES.NETWORK.SERVER_ERROR;
            default:
                return typeof detail === 'string' ? detail : ERROR_MESSAGES.NETWORK.UNKNOWN_ERROR;
        }
    }

    return error.message || ERROR_MESSAGES.NETWORK.UNKNOWN_ERROR;
};
