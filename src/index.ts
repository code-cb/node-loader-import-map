import { NodeLoader, ResolveHook } from '@codecb/node-loader';
import { readFile } from 'node:fs/promises';
import { resolve as pathResolve } from 'node:path';
import { resolveAndComposeImportMap } from './resolveAndComposeImportMap';
import { resolveModuleSpecifier } from './resolveModuleSpecifier';
import { ImportMapResult } from './types';

export * from './global';
export type { ImportMapInput, ImportMapResult } from './types';

const readImportMapFile = async () => {
  const relativePath = process.env.IMPORT_MAP_PATH || 'node.importmap';
  const importMapPath = pathResolve(process.cwd(), relativePath);
  try {
    return {
      path: importMapPath,
      text: await readFile(importMapPath, 'utf-8'),
    };
  } catch {
    return null;
  }
};

const getImportMapPromise = async (): Promise<ImportMapResult> => {
  const readResult = await readImportMapFile();
  if (!readResult) return { imports: {}, scopes: {} };
  const { path, text } = readResult;
  try {
    const json = JSON.parse(text);
    return resolveAndComposeImportMap(json);
  } catch (err) {
    throw Error(
      `Import map at ${path} contains invalid json: ${
        err instanceof Error ? err.message : err
      }`,
    );
  }
};

let importMapPromise = getImportMapPromise();

export const resolve: ResolveHook = async (
  specifier,
  context,
  defaultResolve,
) => {
  const importMap = await importMapPromise;
  const importMapUrl = resolveModuleSpecifier(
    importMap,
    specifier,
    context.parentURL,
  );
  return importMapUrl
    ? { url: importMapUrl }
    : defaultResolve(specifier, context, defaultResolve);
};

global.nodeLoader ||= {} as NodeLoader;
global.nodeLoader.setImportMapPromise = newImportMapPromise =>
  (importMapPromise = newImportMapPromise.then(resolveAndComposeImportMap));