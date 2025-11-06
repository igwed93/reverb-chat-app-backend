import 'express';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      username: string;
      email: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};