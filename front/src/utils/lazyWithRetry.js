import { lazy } from 'react';

/**
 * A wrapper around React.lazy that handles dynamic import failures.
 * This is especially useful for Vite production builds where assets can
 * change hashes on redeployments, causing 404s when old clients try to load them.
 * 
 * @param {Function} componentImport A function that returns a dynamic import promise, e.g. () => import('./MyComponent')
 * @returns {React.Component} A lazy-loaded React component with retry logic
 */
export const lazyWithRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      // Check if we have already reloaded during this session to avoid infinite reload loops
      const pageHasBeenReloaded = window.sessionStorage.getItem('page-has-been-reloaded');
      
      if (!pageHasBeenReloaded) {
        window.sessionStorage.setItem('page-has-been-reloaded', 'true');
        window.location.reload();
        // Return a promise that never resolves or rejects to prevent React from trying to render
        // and throwing errors before the page actually reloads.
        return new Promise(() => {});
      }

      // If we already reloaded and it still failed, throw the error
      throw error;
    }
  });
};
