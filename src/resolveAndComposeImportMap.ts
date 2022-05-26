import type { ImportsResult, ScopesResult } from './types.js';
import { getDefaultBaseUrl, parseUrlLikeImportSpecifier } from './utils.js';

function assertPlainObject(
  obj: unknown,
  message?: string,
): asserts obj is Record<string, unknown> {
  if (obj !== Object(obj) || Array.isArray(obj))
    throw new TypeError(message || 'Expected a plain object');
}

const importMapErrorMessage = (msg: string) => `Invalid import map: ${msg}`;

/**
 * https://wicg.github.io/import-maps/#normalize-a-specifier-key
 */
const normalizeSpecifierKey = (key: string, baseUrl: string) => {
  if (key === '') {
    console.warn(`Specifier keys in import maps may not be the empty string`);
    return null;
  }
  return parseUrlLikeImportSpecifier(key, baseUrl) || key;
};

/**
 * https://wicg.github.io/import-maps/#sort-and-normalize-a-specifier-map
 */
const sortAndNormalizeSpecifierMap = (
  map: Record<string, unknown>,
  baseUrl: string,
) =>
  Object.fromEntries(
    Object.entries(map).flatMap<[string, string | null]>(
      ([specifierKey, value]) => {
        const normalizedSpecifierKey = normalizeSpecifierKey(
          specifierKey,
          baseUrl,
        );
        if (normalizedSpecifierKey === null) return [];
        if (typeof value !== 'string') {
          console.warn(
            `URL addresses in import maps must be strings, received '${typeof value}'`,
          );
          return [[normalizedSpecifierKey, null]];
        }
        const addressUrl = parseUrlLikeImportSpecifier(value, baseUrl);
        if (addressUrl === null) {
          console.warn(
            `Invalid URL address for import map specifier '${specifierKey}'`,
          );
          return [[normalizedSpecifierKey, null]];
        }
        if (specifierKey.endsWith('./') && !addressUrl.endsWith('/')) {
          console.warn(
            `Invalid URL address for import map specifier '${specifierKey}' - since the specifier ends in slash, so must the address`,
          );
          return [[normalizedSpecifierKey, null]];
        }
        return [[normalizedSpecifierKey, addressUrl]];
      },
    ),
  );

/**
 * https://wicg.github.io/import-maps/#sort-and-normalize-scopes
 */
const sortAndNormalizeScopes = (
  map: Record<string, unknown>,
  baseUrl: string,
) =>
  Object.fromEntries(
    Object.entries(map).flatMap<[string, Record<string, string | null>]>(
      ([scopePrefix, potentialSpecifierMap]) => {
        assertPlainObject(
          potentialSpecifierMap,
          `The value of scope ${scopePrefix} must be a JSON object`,
        );
        try {
          return [
            [
              new URL(scopePrefix, baseUrl).href,
              sortAndNormalizeSpecifierMap(potentialSpecifierMap, baseUrl),
            ],
          ];
        } catch {
          console.warn(`Invalid scope prefix '${scopePrefix}' in import map`);
          return [];
        }
      },
    ),
  );

/**
 * https://wicg.github.io/import-maps/#parsing
 */
export const resolveAndComposeImportMap = (parsed: unknown) => {
  // Step 2
  assertPlainObject(
    parsed,
    importMapErrorMessage(`top level must be an object`),
  );

  const baseUrl = getDefaultBaseUrl();

  // Step 3
  let sortedAndNormalizedImports: ImportsResult = {};

  // Step 4
  if ('imports' in parsed) {
    // Step 4.1
    assertPlainObject(
      parsed['imports'],
      importMapErrorMessage(`"imports" property must be an object`),
    );
    // Step 4.2
    sortedAndNormalizedImports = sortAndNormalizeSpecifierMap(
      parsed['imports'],
      baseUrl,
    );
  }

  // Step 5
  let sortedAndNormalizedScopes: ScopesResult = {};

  // Step 6
  if ('scopes' in parsed) {
    // Step 6.1
    assertPlainObject(
      parsed['scopes'],
      importMapErrorMessage(`"scopes" property must be an object`),
    );

    // Step 6.2
    sortedAndNormalizedScopes = sortAndNormalizeScopes(
      parsed['scopes'],
      baseUrl,
    );
  }

  // Step 7
  const validKeys = ['imports', 'scopes'];
  const invalidKeys = Object.keys(parsed).filter(
    key => !validKeys.includes(key),
  );
  if (invalidKeys.length > 0) {
    console.warn(
      `Invalid top-level key${
        invalidKeys.length > 0 ? 's' : ''
      } in import map - ${invalidKeys.join(', ')}`,
    );
  }

  // Step 8
  return {
    imports: sortedAndNormalizedImports,
    scopes: sortedAndNormalizedScopes,
  };
};
