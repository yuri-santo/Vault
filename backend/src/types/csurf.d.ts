declare module 'csurf' {
  import type { RequestHandler } from 'express';
  type Options = any;
  function csurf(options?: Options): RequestHandler;
  export default csurf;
}
