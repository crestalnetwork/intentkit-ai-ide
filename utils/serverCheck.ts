/**
 * Utility to check if the IntentKit server is running and properly configured
 */

import axios from 'axios';
import { Agent } from '../types';

interface ServerStatus {
  isRunning: boolean;
  agentExists?: boolean;
  hasTokenSkill?: boolean;
  hasPortfolioSkill?: boolean;
  agentData?: Agent;
  error?: string;
}

export const checkServerStatus = async (agentName: string): Promise<ServerStatus> => {
  try {
    // Check if the server is running
    const statusResponse = await axios.get('http://127.0.0.1:8000/status');
    
    if (statusResponse.status !== 200) {
      return {
        isRunning: false,
        error: `Server returned status ${statusResponse.status}`,
      };
    }
    
    // Check if the agent exists
    try {
      const agentResponse = await axios.get<Agent>(`http://127.0.0.1:8000/agents/${agentName}`);
      
      // Check if the agent has token skills
      const hasTokenSkill = agentResponse.data?.skills?.token?.enabled === true;
      const hasPortfolioSkill = agentResponse.data?.skills?.portfolio?.enabled === true;
      
      return {
        isRunning: true,
        agentExists: true,
        hasTokenSkill,
        hasPortfolioSkill,
        agentData: agentResponse.data,
      };
    } catch (agentError) {
      if (axios.isAxiosError(agentError) && agentError.response?.status === 404) {
        return {
          isRunning: true,
          agentExists: false,
          error: `Agent "${agentName}" not found`,
        };
      }
      
      throw agentError;
    }
  } catch (error) {
    console.error('Error checking server status:', error);
    
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      return {
        isRunning: false,
        error: 'Cannot connect to IntentKit server. Make sure it is running on http://127.0.0.1:8000',
      };
    }
    
    return {
      isRunning: false,
      error: error instanceof Error ? error.message : 'Unknown error checking server status',
    };
  }
};

export const validateAgentConfig = (agentData: Agent | undefined): string[] => {
  const issues: string[] = [];
  
  if (!agentData) {
    return ['No agent data available'];
  }
  
  // Check token skill
  if (agentData.skills?.token?.enabled) {
    const tokenSkill = agentData.skills.token;
    
    if (!tokenSkill.api_key) {
      issues.push('Token skill is missing api_key');
    }
    
    if (!tokenSkill.api_key_provider || tokenSkill.api_key_provider !== 'agent_owner') {
      issues.push('Token skill api_key_provider should be set to "agent_owner"');
    }
    
    // Check states
    const tokenStates = tokenSkill.states || {};
    ['token_price', 'token_search', 'token_analytics'].forEach(state => {
      if (tokenStates[state] !== 'public') {
        issues.push(`Token skill state "${state}" should be set to "public"`);
      }
    });
  }
  
  // Check portfolio skill
  if (agentData.skills?.portfolio?.enabled) {
    const portfolioSkill = agentData.skills.portfolio;
    
    if (!portfolioSkill.api_key) {
      issues.push('Portfolio skill is missing api_key');
    }
    
    if (!portfolioSkill.api_key_provider || portfolioSkill.api_key_provider !== 'agent_owner') {
      issues.push('Portfolio skill api_key_provider should be set to "agent_owner"');
    }
    
    // Check states
    const portfolioStates = portfolioSkill.states || {};
    [
      'wallet_net_worth', 'wallet_stats', 'token_balances', 
      'wallet_history', 'wallet_nfts', 'wallet_defi_positions', 
      'wallet_profitability', 'wallet_swaps'
    ].forEach(state => {
      if (portfolioStates[state] !== 'public') {
        issues.push(`Portfolio skill state "${state}" should be set to "public"`);
      }
    });
  }
  
  return issues;
}; 