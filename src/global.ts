import type { ImportMapInput, ImportMapResult } from './types.js';

declare module '@codecb/node-loader' {
  interface NodeLoader {
    setImportMapPromise: (
      newImportMapPromise: Promise<ImportMapInput>,
    ) => Promise<ImportMapResult>;
  }
}
