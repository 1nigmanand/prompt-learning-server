/**
 * Routes Index
 * Central export for all route handlers
 */

export { handleRoot } from './docs.js';
export { handleHealth, handleStatus } from './health.js';
export { handleGenerateImage, handleGenerateImageStream } from './images.js';
export { handleAcquireKey, handleReleaseKey, handleKeyStatus } from './keys.js';
