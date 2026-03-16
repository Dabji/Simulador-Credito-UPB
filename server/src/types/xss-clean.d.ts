declare module 'xss-clean' {
  import type { RequestHandler } from 'express';
  function xssClean(): RequestHandler;
  export = xssClean;
}
