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
    contact_phone?: string;
    server_id?: number;
    payment_status?: string;
    paid_at?: string;
    is_accepted?: boolean;
    is_interested?: boolean;
    unread_count?: number;
    interested_count?: number;
    response_count?: number;
    created_at: string;
    user?: User;
}

export interface Review {
    id: number;
    ask_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    comment: string;
    created_at: string;
    reviewer?: User;
    reviewee?: User;
}
