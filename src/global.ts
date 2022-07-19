import type { SetImportMapPromise } from './types.js';

declare module '@codecb/node-loader' {
  interface NodeLoader {
    setImportMapPromise: SetImportMapPromise;
  }
}
