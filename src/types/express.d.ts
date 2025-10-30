import { Request } from 'express';

// Define the required structure of the user object attached by the middleware
interface AuthenticatedUser {
  id: string;
  name?: string;
  email?: string;
}

// Export the custom Request type
// We extend the base Request and define the 'user' property precisely
export interface AuthRequest extends Request {
  // If the protect middleware succeeds, 'user' is guaranteed to be present.
  // By defining it here, all controllers and middleware imports will use this single reference.
  user: AuthenticatedUser;
}