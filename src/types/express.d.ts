import { User } from '../models/User'; // adjust path/type as needed

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: User;
    }
}

export { };