/**
 * API Response Types and Utilities
 * Standardized response formats for all API endpoints
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ApiLeadsResponse = ApiResponse<any[]>;
export type ApiLeadResponse = ApiResponse<any>;
export type ApiTemplatesResponse = ApiResponse<any[]>;
export type ApiSendEmailResponse = ApiResponse<{ messageId: string; sentAt: string }>;

/**
 * Helper to format API responses
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(error: string): ApiResponse<never> {
  return {
    success: false,
    error,
  };
}
