import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /** Added by csurf middleware at runtime */
    csrfToken?: () => string;
  }
}
