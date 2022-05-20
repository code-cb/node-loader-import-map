import { sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const getDefaultBaseUrl = () => `${pathToFileURL(process.cwd())}/${sep}`;

/**
 * https://wicg.github.io/import-maps/#parse-a-url-like-import-specifier
 */
export const parseUrlLikeImportSpecifier = (
  specifier: string,
  baseUrl: string,
) => {
  const useBaseUrl =
    specifier.startsWith('/') ||
    specifier.startsWith('./') ||
    specifier.startsWith('../');
  try {
    return new URL(specifier, useBaseUrl ? baseUrl : undefined).href;
  } catch {
    return null;
  }
};
