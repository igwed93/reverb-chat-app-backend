import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to protect routes by verifying a JWT tokem in the request header.
 */
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map