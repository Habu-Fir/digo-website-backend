// src/types/index.ts
import { Types } from 'mongoose';

// ============================================================
// 🎭 USER ROLES - Complete System
// ============================================================

export type UserRole =
    | 'super_admin'
    | 'gallery_admin'
    | 'news_admin'
    | 'history_admin'
    | 'entertainment_admin'
    | 'health_admin'
    | 'technology_admin'
    | 'vacancy_admin'
    | 'viewer';

// ============================================================
// 📂 POST CATEGORIES
// ============================================================

export type PostCategory =
    | 'news'
    | 'history'
    | 'entertainment'
    | 'health'
    | 'technology'
    | 'vacancy'
    | 'gallery';

// ============================================================
// 🖼️ GALLERY CATEGORIES
// ============================================================

export type GalleryCategory =
    | 'nature'
    | 'culture'
    | 'cuisine'
    | 'investment'
    | 'event'
    | 'general'
    | 'news'
    | 'history'
    | 'entertainment'
    | 'health'
    | 'technology'
    | 'vacancy';

// ============================================================
// 🔐 USER PERMISSIONS
// ============================================================

export interface UserPermissions {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPublish: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
}

// ============================================================
// 👤 USER INTERFACE
// ============================================================

export interface IUser {
    _id: Types.ObjectId;
    id?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
    isActive: boolean;
    lastLogin?: Date;
    permissions: UserPermissions;
    createdAt: Date;
    updatedAt: Date;
    temporaryPassword?: string;        // ← Add this
    isTemporaryPassword: boolean;      // ← Add this
    passwordChangedAt?: Date;          // ← Add this
    mustChangePassword: boolean;       // ← Add this
    matchPassword(enteredPassword: string): Promise<boolean>;
}

// ============================================================
// 📝 POST INTERFACE (Unified for all content)
// ============================================================

export interface IPost {
    _id: Types.ObjectId;
    id?: string;
    title: string;
    localTitle?: string;
    category: PostCategory;
    content: string;
    localContent?: string;
    author: string;
    localAuthor?: string;
    authorPhoto?: string;
    imageUrl?: string;
    imagePath?: string;
    videoUrl?: string;
    duration?: string;
    tags?: string[];
    isPublished: boolean;
    publishedBy: Types.ObjectId | IUser;
    views: number;
    likes: number;
    shareCount: number;
    scheduledPublish?: Date;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// 🏛️ LEGACY ARTICLE INTERFACE (For backward compatibility)
// ============================================================

export interface IArticle {
    _id: Types.ObjectId;
    id?: string;
    title: string;
    localTitle?: string;
    category: 'news' | 'history' | 'interview' | 'video';
    content: string;
    localContent?: string;
    author: string;
    localAuthor?: string;
    authorPhoto?: string;
    imageUrl?: string;
    imagePath?: string;
    videoUrl?: string;
    duration?: string;
    publishedBy: Types.ObjectId | IUser;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// 🖼️ GALLERY INTERFACE
// ============================================================

export interface IGallery {
    _id: Types.ObjectId;
    id?: string;
    title: string;
    category: GalleryCategory;
    url: string;
    imagePath?: string;
    description?: string;
    uploadedBy: Types.ObjectId | IUser;
    tags?: string[];
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// 📅 EVENT INTERFACE
// ============================================================

export interface IEvent {
    _id: Types.ObjectId;
    id?: string;
    title: string;
    localTitle?: string;
    date: number;
    month: string;
    ethiopianDateStr?: string;
    category: 'cultural' | 'market' | 'holiday' | 'investment';
    description: string;
    location: string;
    time: string;
    organizer: string;
    isPopular: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// 💼 INVESTMENT INTERFACE
// ============================================================

export interface IInvestment {
    _id: Types.ObjectId;
    id?: string;
    companyName: string;
    investorName: string;
    sector: string;
    email: string;
    phone: string;
    proposedBudget: string;
    proposalBrief: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected';
    adminNotes?: string;
    submittedBy?: Types.ObjectId | IUser;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// 🏔️ LANDMARK INTERFACE
// ============================================================

export interface ILandmark {
    _id: Types.ObjectId;
    id?: string;
    name: string;
    localName: string;
    description: string;
    history: string;
    category: 'nature' | 'culture' | 'sacred' | 'admin';
    coordinates: {
        x: number;
        y: number;
    };
    image: string;
    elevation?: string;
    highlights: string[];
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// 💼 VACANCY INTERFACE (Jobs, Products, Houses, etc.)
// ============================================================

export interface IVacancy {
    _id: Types.ObjectId;
    id?: string;
    title: string;
    localTitle?: string;
    type: 'job' | 'product' | 'house' | 'phone' | 'vehicle' | 'other';
    category: 'vacancy';
    companyName?: string;
    location?: string;
    price?: string;
    contactInfo?: string;
    description: string;
    localDescription?: string;
    imageUrl?: string;
    imagePath?: string;
    isPublished: boolean;
    publishedBy: Types.ObjectId | IUser;
    views: number;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// 📋 REQUEST TYPES (API Input)
// ============================================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    role?: UserRole;
    department?: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    department?: string;
    isActive?: boolean;
}

export interface CreatePostRequest {
    title: string;
    localTitle?: string;
    category: PostCategory;
    content: string;
    localContent?: string;
    author: string;
    localAuthor?: string;
    authorPhoto?: string;
    imageUrl?: string;
    videoUrl?: string;
    duration?: string;
    tags?: string[];
    isPublished?: boolean;
    scheduledPublish?: Date;
}

export interface UpdatePostRequest {
    title?: string;
    localTitle?: string;
    content?: string;
    localContent?: string;
    author?: string;
    localAuthor?: string;
    authorPhoto?: string;
    imageUrl?: string;
    videoUrl?: string;
    duration?: string;
    tags?: string[];
    isPublished?: boolean;
}

export interface CreateGalleryRequest {
    title: string;
    category: GalleryCategory;
    url?: string;
    imagePath?: string;
    description?: string;
    tags?: string[];
    isFeatured?: boolean;
}

export interface CreateEventRequest {
    title: string;
    localTitle?: string;
    date: number;
    month: string;
    ethiopianDateStr?: string;
    category: 'cultural' | 'market' | 'holiday' | 'investment';
    description: string;
    location: string;
    time: string;
    organizer: string;
    isPopular?: boolean;
}

export interface CreateInvestmentRequest {
    companyName: string;
    investorName: string;
    sector: string;
    email: string;
    phone: string;
    proposedBudget: string;
    proposalBrief: string;
}

// ============================================================
// 📤 RESPONSE TYPES (API Output)
// ============================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    count?: number;
    total?: number;
    pages?: number;
    currentPage?: number;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    data: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        department?: string;
        permissions: UserPermissions;
        createdAt: string;
    };
}

// ============================================================
// 📊 DASHBOARD STATS
// ============================================================

export interface DashboardStats {
    totalPosts: number;
    totalUsers: number;
    totalViews: number;
    totalGallery: number;
    postsByCategory: {
        news: number;
        history: number;
        entertainment: number;
        health: number;
        technology: number;
        vacancy: number;
        gallery: number;
    };
    recentActivity: {
        user: string;
        action: string;
        timestamp: Date;
    }[];
    pendingPosts: number;
    scheduledPosts: number;
}

export interface InvestmentStats {
    total: number;
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
    sectorStats: {
        sector: string;
        count: number;
        totalBudget: number;
    }[];
    recent: IInvestment[];
}

// ============================================================
// 🔗 ROLE TO CATEGORY MAPPING
// ============================================================

export const ROLE_TO_CATEGORY: Record<UserRole, PostCategory[]> = {
    super_admin: ['news', 'history', 'entertainment', 'health', 'technology', 'vacancy', 'gallery'],
    gallery_admin: ['gallery'],
    news_admin: ['news'],
    history_admin: ['history'],
    entertainment_admin: ['entertainment'],
    health_admin: ['health'],
    technology_admin: ['technology'],
    vacancy_admin: ['vacancy'],
    viewer: [],
};

// ============================================================
// 🏷️ ROLE LABELS (For Display)
// ============================================================

export const ROLE_LABELS: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    gallery_admin: 'Gallery Admin',
    news_admin: 'News Admin',
    history_admin: 'History Admin',
    entertainment_admin: 'Entertainment Admin',
    health_admin: 'Health Admin',
    technology_admin: 'Technology Admin',
    vacancy_admin: 'Vacancy Admin',
    viewer: 'Viewer',
};

// ============================================================
// 🏷️ CATEGORY LABELS (For Display)
// ============================================================

export const CATEGORY_LABELS: Record<PostCategory, string> = {
    news: 'News',
    history: 'History',
    entertainment: 'Entertainment',
    health: 'Health',
    technology: 'Technology',
    vacancy: 'Vacancy',
    gallery: 'Gallery',
};

// ============================================================
// 📝 ROLE DESCRIPTIONS
// ============================================================

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    super_admin: '👑 Full access to all features, content categories, and user management. Can create, edit, delete ANY content and manage ALL users.',
    gallery_admin: '📸 Can upload, edit, and manage photos in the gallery. Cannot access other content categories or manage users.',
    news_admin: '📰 Can create, edit, publish, and manage news articles. Cannot access other content categories or manage users.',
    history_admin: '📜 Can create, edit, publish, and manage historical content. Cannot access other content categories or manage users.',
    entertainment_admin: '🎭 Can create, edit, publish, and manage entertainment content. Cannot access other content categories or manage users.',
    health_admin: '🏥 Can create, edit, publish, and manage health-related content. Cannot access other content categories or manage users.',
    technology_admin: '💻 Can create, edit, publish, and manage technology content. Cannot access other content categories or manage users.',
    vacancy_admin: '💼 Can post, edit, and manage jobs, products, houses, phones, and other listings. Cannot access other content categories or manage users.',
    viewer: '👀 Read-only access to all public content. Cannot create, edit, or delete any content.',
};

// ============================================================
// 🔧 PERMISSION HELPERS
// ============================================================

export const getDefaultPermissions = (role: UserRole): UserPermissions => {
    const roleString = role as string;
    const isAdmin = roleString !== 'viewer';
    const isSuperAdmin = roleString === 'super_admin';

    return {
        canCreate: isAdmin || isSuperAdmin,
        canEdit: isAdmin || isSuperAdmin,
        canDelete: isAdmin || isSuperAdmin,
        canPublish: isAdmin || isSuperAdmin,
        canManageUsers: isSuperAdmin,
        canViewAnalytics: isSuperAdmin || roleString === 'super_admin',
    };
};

export const canUserManageCategory = (userRole: UserRole, category: PostCategory): boolean => {
    if (userRole === 'super_admin') return true;
    const allowedCategories = ROLE_TO_CATEGORY[userRole] || [];
    return allowedCategories.includes(category);
};

export const isAdminRole = (role: UserRole): boolean => {
    const adminRoles: UserRole[] = [
        'super_admin',
        'gallery_admin',
        'news_admin',
        'history_admin',
        'entertainment_admin',
        'health_admin',
        'technology_admin',
        'vacancy_admin'
    ];
    return adminRoles.includes(role);
};

export const isSuperAdminRole = (role: UserRole): boolean => {
    return role === 'super_admin';
};

export const getCategoryLabel = (category: PostCategory): string => {
    return CATEGORY_LABELS[category] || category;
};

export const getRoleLabel = (role: UserRole): string => {
    return ROLE_LABELS[role] || role;
};
