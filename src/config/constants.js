/**
 * Configuration Constants
 * Centralized configuration for the entire application
 */

export const API_CONFIG = {
  IMAGEROUTER: {
    URL: 'https://api.imagerouter.io/v1/openai/images/generations',
    MODEL: 'run-diffusion/Juggernaut-Lightning-Flux',
    OUTPUT_FORMAT: 'webp',
    MAX_PROMPT_LENGTH: 1000
  },
  SILICONFLOW: {
    URL: 'https://api.siliconflow.com/v1/chat/completions',
    MODEL: 'Qwen/Qwen3-VL-8B-Instruct',
    MAX_TOKENS: 800,
    TEMPERATURE: 0.2
  }
};

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // 1 second
  EXPONENTIAL_BACKOFF: true
};

export const SERVER_CONFIG = {
  DEFAULT_PORT: 3000,
  REQUEST_SIZE_LIMIT: '10mb',
  CORS_ENABLED: true
};

export const WORKER_CONFIG = {
  TOTAL_WORKERS: 20,
  WORKER_NAMES: Array.from({ length: 20 }, (_, i) => `SERVER${i + 1}`)
};
