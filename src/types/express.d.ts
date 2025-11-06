import { Request } from 'express';

// Define the required structure of the user object attached by the middleware
interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
}

// Export the custom Request type
// We extend the base Request and define the 'user' property precisely
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}