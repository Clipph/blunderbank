/** 
 * DEPRECATED: All authentication has been moved to local state.
 * This file is maintained only to prevent import errors during transition.
 */
export const useAuthStore = () => ({});
export const useAuth = () => ({ userId: 'local-user', isAuthenticated: true });