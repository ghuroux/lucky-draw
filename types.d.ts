// Types for API route handlers in Next.js

// Define the context parameter for dynamic route segments
declare type RouteParams<T extends Record<string, string> = Record<string, string>> = {
  params: T;
};

// Augment the existing types in Next.js
declare namespace NextApiHandlers {
  interface Get<T extends Record<string, string> = Record<string, string>> {
    (request: Request, context: RouteParams<T>): Promise<Response> | Response;
  }

  interface Post<T extends Record<string, string> = Record<string, string>> {
    (request: Request, context: RouteParams<T>): Promise<Response> | Response;
  }

  interface Put<T extends Record<string, string> = Record<string, string>> {
    (request: Request, context: RouteParams<T>): Promise<Response> | Response;
  }

  interface Delete<T extends Record<string, string> = Record<string, string>> {
    (request: Request, context: RouteParams<T>): Promise<Response> | Response;
  }
}

// Auth response types
declare interface AuthResponse {
  token?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
  error?: string;
  message?: string;
} 