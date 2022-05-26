import { sep } from 'node:path';
import type { ImportMapResult, ImportsResult, ScopesResult } from './types.js';
import { getDefaultBaseUrl, parseUrlLikeImportSpecifier } from './utils.js';

const getBaseUrl = (parentUrl: string | undefined) => {
  if (parentUrl) {
    const lastSlashIndex = parentUrl.lastIndexOf(sep);
    return parentUrl.substring(0, lastSlashIndex + 1);
  }
  return getDefaultBaseUrl();
};

const failedResolutionMessage = (specifierKey: string, reason: string) =>
  `The import map resolution of ${specifierKey} failed due to ${reason}`;

/**
 * https://wicg.github.io/import-maps/#resolve-an-imports-match
 */
const resolveImportsMatch = (
  normalizedSpecifier: string,
  specifierMap: ImportsResult,
) => {
  for (const specifierKey in specifierMap) {
    const resolutionResult = specifierMap[specifierKey];
    if (specifierKey === normalizedSpecifier) {
      if (resolutionResult == null)
        throw TypeError(failedResolutionMessage(specifierKey, 'a null entry'));
      return resolutionResult;
    }
    if (
      specifierKey.endsWith('/') &&
      normalizedSpecifier.startsWith(specifierKey)
    ) {
      if (resolutionResult == null)
        throw TypeError(failedResolutionMessage(specifierKey, 'a null entry'));
      const afterPrefix = normalizedSpecifier.substring(specifierKey.length);
      try {
        return new URL(afterPrefix, resolutionResult).href;
      } catch {
        throw TypeError(
          failedResolutionMessage(specifierKey, 'URL parse failure'),
        );
      }
    }
  }
  return null;
};

const resolveScopeImportsMatch = (
  normalizedSpecifier: string,
  scopeMap: ScopesResult,
  baseUrl: string,
) => {
  for (const scopePrefix in scopeMap) {
    if (
      scopePrefix === baseUrl ||
      (scopePrefix.endsWith('/') && baseUrl.startsWith(scopePrefix))
    ) {
      const scopeImportsMatch = resolveImportsMatch(
        normalizedSpecifier,
        scopeMap[scopePrefix]!,
      );
      if (scopeImportsMatch) return scopeImportsMatch;
    }
  }
  return null;
};

/**
 * https://wicg.github.io/import-maps/#new-resolve-algorithm
 */
export const resolveModuleSpecifier = (
  importMap: ImportMapResult,
  specifier: string,
  parentUrl: string | undefined,
) => {
  const baseUrl = getBaseUrl(parentUrl);
  const normalizedSpecifier =
    parseUrlLikeImportSpecifier(specifier, baseUrl) || specifier;
  return (
    resolveScopeImportsMatch(normalizedSpecifier, importMap.scopes, baseUrl) ||
    resolveImportsMatch(normalizedSpecifier, importMap.imports)
  );
};
