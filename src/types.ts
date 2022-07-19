type Dictionary<T = string> = Record<string, T>;

export interface ImportMapInput {
  imports: Dictionary;
  scopes: Dictionary<Dictionary>;
}

export type ImportsResult = Dictionary<string | null>;

export type ScopesResult = Dictionary<ImportsResult>;

export interface ImportMapResult {
  imports: ImportsResult;
  scopes: ScopesResult;
}

export type SetImportMapPromise = (
  newImportMapPromise: Promise<ImportMapInput>,
) => Promise<ImportMapResult>;
