import { NodeLoader } from '@codecb/node-loader';
import { ImportMapInput, ImportMapResult } from './types';

declare module '@codecb/node-loader' {
  interface NodeLoader {
    setImportMapPromise: (
      newImportMapPromise: Promise<ImportMapInput>,
    ) => Promise<ImportMapResult>;
  }
}

declare global {
  var nodeLoader: NodeLoader;
}
