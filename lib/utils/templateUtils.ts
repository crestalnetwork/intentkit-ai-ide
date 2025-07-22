import { AgentTemplate } from "./templates";
import { Agent } from "./apiClient";

export function templateToPrompt(template: AgentTemplate): string {
  const skillsList = Object.keys(template.skills).join(", ");
  
  return `Create a ${template.category} agent: ${template.baseConfig.name}

${template.description}

Purpose: ${template.baseConfig.purpose}
Personality: ${template.baseConfig.personality}
Principles: ${template.baseConfig.principles}

Skills: ${skillsList}
Model: ${template.baseConfig.model || "gpt-4.1-nano"}

Configure exactly as specified with only these skills enabled.`;
}

export function templateToAgentConfig(template: AgentTemplate, userWalletAddress?: string): Agent {
  return {
    name: template.baseConfig.name,
    description: template.description,
    purpose: template.baseConfig.purpose,
    personality: template.baseConfig.personality,
    principles: template.baseConfig.principles,
    skills: template.skills,
    owner: userWalletAddress,
    mode: "private", // Default to private for template-based agents
    fee_percentage: 0,
    wallet_provider: "cdp",
    network_id: "base-mainnet",
    cdp_network_id: "base-mainnet",
    model: template.baseConfig.model || "gpt-4.1-nano",
    example_intro: template.baseConfig.example_intro,
    temperature: 0.7,
    frequency_penalty: 0,
    presence_penalty: 0,
    short_term_memory_strategy: "trim",
  };
} 