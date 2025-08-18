/**
 * API utility for fetching agent schema from the live endpoint
 */

import axios from 'axios';
import logger from './logger';
import { STORAGE_KEYS, DEFAULT_CONFIG } from './config';

// Cache for the schema to avoid unnecessary API calls
let schemaCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface AgentSchema {
  $schema: string;
  title: string;
  description: string;
  type: string;
  'x-groups': Array<{
    id: string;
    title: string;
    order: number;
  }>;
  required: string[];
  properties: {
    skills?: {
      properties: {
        [skillName: string]: {
          title: string;
          description: string;
          'x-icon'?: string;
          'x-tags'?: string[];
          'x-avg-price-level'?: number;
          properties: any;
          required: string[];
        };
      };
    };
    [key: string]: any;
  };
}

/**
 * Get the current base URL from storage or config
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.BASE_URL) || DEFAULT_CONFIG.BASE_URL;
  }
  return DEFAULT_CONFIG.BASE_URL;
}

/**
 * Fetch the agent schema from the live API endpoint
 */
export const fetchAgentSchema = async (): Promise<AgentSchema> => {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (schemaCache && (now - cacheTimestamp) < CACHE_DURATION) {
    logger.debug('Using cached agent schema', {}, 'schemaApi.fetchAgentSchema');
    return schemaCache;
  }

  try {
    const baseUrl = getBaseUrl();
    const schemaUrl = `${baseUrl}/metadata/agent/schema.json`;
    
    logger.info('Fetching agent schema from API', { schemaUrl }, 'schemaApi.fetchAgentSchema');
    
    const response = await axios.get(schemaUrl, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.data) {
      throw new Error('Empty response from schema API');
    }

    // Validate the response has the expected structure
    if (!response.data.properties || !response.data.properties.skills) {
      throw new Error('Invalid schema structure: missing skills properties');
    }

    // Update cache
    schemaCache = response.data;
    cacheTimestamp = now;

    logger.info('Agent schema fetched successfully', {
      skillsCount: Object.keys(response.data.properties.skills.properties || {}).length,
      groupsCount: response.data['x-groups']?.length || 0
    }, 'schemaApi.fetchAgentSchema');

    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch agent schema', {
      error: error.message,
      status: error.response?.status,
      url: `${getBaseUrl()}/metadata/agent/schema.json`
    }, 'schemaApi.fetchAgentSchema');

    // If we have cached data, use it as fallback
    if (schemaCache) {
      logger.warn('Using cached schema as fallback', {}, 'schemaApi.fetchAgentSchema');
      return schemaCache;
    }

    throw new Error(`Failed to fetch agent schema: ${error.message}`);
  }
};

/**
 * Get skills from the agent schema
 */
export const getSkillsFromSchema = async (): Promise<Record<string, any>> => {
  try {
    const schema = await fetchAgentSchema();
    return schema.properties.skills?.properties || {};
  } catch (error) {
    logger.error('Failed to get skills from schema', { error }, 'schemaApi.getSkillsFromSchema');
    throw error;
  }
};

/**
 * Clear the schema cache (useful for testing or forcing refresh)
 */
export const clearSchemaCache = (): void => {
  schemaCache = null;
  cacheTimestamp = 0;
  logger.debug('Schema cache cleared', {}, 'schemaApi.clearSchemaCache');
};

/**
 * Check if schema cache is valid
 */
export const isCacheValid = (): boolean => {
  const now = Date.now();
  return schemaCache !== null && (now - cacheTimestamp) < CACHE_DURATION;
};
