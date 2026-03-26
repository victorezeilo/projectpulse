export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

// Extend Express Request to include our user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}