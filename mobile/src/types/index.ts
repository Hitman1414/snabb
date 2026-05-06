export interface User {
    id: number;
    username: string;
    email: string;
    phone_number?: string;
    location?: string;
    avatar_url?: string;
    created_at: string;
    is_active: boolean;
    is_admin: boolean;
    // Pro Fields
    is_pro: boolean;
    pro_category?: string;
    pro_bio?: string;
    pro_verified: boolean;
    pro_rating: number;
    pro_completed_tasks: number;
    completed_asks_count?: number;
}

export interface Ask {
    id: number;
    user_id: number;
    title: string;
    description: string;
    category: string;
    location: string;
    status: 'open' | 'in_progress' | 'closed';
    budget_min?: number;
    budget_max?: number;
    images?: string[];
    latitude?: number;
    longitude?: number;
    server_id?: number;
    message?: string;
    bid_amount?: number;
    is_accepted: boolean;
    is_interested?: boolean;
    unread_count?: number;
    interested_count?: number;
    response_count?: number;
    created_at: string;
    user?: User;
}

export interface Response {
    id: number;
    ask_id: number;
    user_id: number;
    message: string;
    bid_amount?: number;
    is_accepted: boolean;
    is_interested: boolean;
    unread_count: number;
    created_at: string;
    user?: User;
}

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    ask_id?: number;
    content: string;
    created_at: string;
    is_read: boolean;
    sender?: {
        id: number;
        username: string;
    };
    receiver?: {
        id: number;
        username: string;
    };
}

export interface Conversation {
    other_user: User;
    ask: Ask;
    last_message: Message;
    unread_count: number;
}

export interface AuthTokens {
    access_token: string;
    token_type: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    phone_number?: string;
    location?: string;
}

export interface CreateAskData {
    title: string;
    description: string;
    category: string;
    location: string;
    budget_min?: number;
    budget_max?: number;
    images?: string[];
    latitude?: number;
    longitude?: number;
    contact_phone?: string;
}

// Type alias for consistency with backend
export type AskCreate = CreateAskData;

export interface CreateResponseData {
    message: string;
    bid_amount?: number;
}

// Type alias for consistency with backend
export type ResponseCreate = CreateResponseData;

export interface CreateMessageData {
    content: string;
    receiver_id: number;
    ask_id?: number;
}

export interface ApiError {
    detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    body: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    is_read: boolean;
    created_at: string;
}
