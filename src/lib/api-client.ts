/**
 * DEPRECATED: The application is now pure-frontend. 
 * Use local store actions in src/lib/store.ts instead.
 */
export async function api<T>(...args: any[]): Promise<T> {
  throw new Error("API called in frontend-only mode.");
}