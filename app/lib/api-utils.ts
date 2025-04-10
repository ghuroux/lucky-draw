import { NextResponse } from 'next/server';

/**
 * Standard error response formats for API routes
 */
export type ApiErrorType = 
  | 'UNAUTHORIZED'               // User is not logged in
  | 'FORBIDDEN'                  // User doesn't have required permissions
  | 'NOT_FOUND'                  // Resource not found
  | 'VALIDATION_ERROR'           // Invalid input data
  | 'INTERNAL_SERVER_ERROR'      // Unhandled server error
  | 'CONFLICT'                   // Resource conflict (e.g., duplicate)
  | 'BAD_REQUEST';               // General bad request

interface ErrorResponseOptions {
  message?: string;
  details?: Record<string, any>;
}

/**
 * Creates a standardized error response for API routes
 */
export function errorResponse(
  type: ApiErrorType,
  options: ErrorResponseOptions = {}
): NextResponse {
  const defaultMessages: Record<ApiErrorType, string> = {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Invalid input data',
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred',
    CONFLICT: 'Resource conflict detected',
    BAD_REQUEST: 'Invalid request'
  };

  const statusCodes: Record<ApiErrorType, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    INTERNAL_SERVER_ERROR: 500,
    CONFLICT: 409,
    BAD_REQUEST: 400
  };

  const message = options.message || defaultMessages[type];
  const status = statusCodes[type];

  const responseBody = {
    error: {
      type,
      message,
      ...(options.details ? { details: options.details } : {})
    }
  };

  return NextResponse.json(responseBody, { status });
}

/**
 * Creates a standardized success response for API routes
 */
export function successResponse(
  data: Record<string, any>,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Helper to handle common API errors with logging
 */
export function handleApiError(error: unknown, defaultMessage: string = 'An unexpected error occurred'): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return errorResponse('INTERNAL_SERVER_ERROR', { 
      message: process.env.NODE_ENV === 'development' ? error.message : defaultMessage,
      details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
    });
  }
  
  return errorResponse('INTERNAL_SERVER_ERROR', { message: defaultMessage });
} 