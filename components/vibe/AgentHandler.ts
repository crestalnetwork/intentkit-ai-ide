import { Agent, AgentGenerateRequest, AgentGenerateResponse } from "@/lib/utils/apiClient";
import apiClient from "@/lib/utils/apiClient";
import { showToast } from "@/lib/utils/toast";
import logger from "@/lib/utils/logger";
import { ConversationMessage } from "./AgentEditor";

export class AgentHandler {
  /**
   * Handle agent editing - generates updated agent configuration
   */
  static async handleEditAgent(
    agent: Agent,
    userInput: string,
    userId: string,
    setGenerating: (loading: boolean) => void,
    setMessages: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void,
    onAgentUpdated: (updatedAgent: Agent) => void
  ) {
    if (!userInput.trim()) {
      showToast.error("Please describe the changes you want to make");
      return;
    }

    if (userInput.trim().length < 10) {
      showToast.error("Please provide a more detailed description (at least 10 characters)");
      return;
    }

    if (userInput.trim().length > 1000) {
      showToast.error("Description is too long (maximum 1000 characters)");
      return;
    }

    logger.info("Starting agent edit", {
      agentId: agent.id,
      agentName: agent.name,
      promptLength: userInput.length,
      userId
    }, "AgentHandler.handleEditAgent");

    // Add user message
    const userMessage: ConversationMessage = {
      role: "user",
      content: userInput.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setGenerating(true);

    try {
      // Debug: Log the actual agent object we're working with
      logger.info("VIBE FLOW - Debug agent object structure", {
        agentFields: Object.keys(agent),
        hasPurpose: !!agent.purpose,
        hasPersonality: !!agent.personality,
        hasPrinciples: !!agent.principles,
        purposeValue: agent.purpose,
        personalityValue: agent.personality,
        principlesValue: agent.principles,
      }, "AgentHandler.handleEditAgent");

      // Handle agents that might be missing the required fields (older agents or different API responses)
      // Use fallback values if the fields are missing, null, undefined, or empty strings
      const purpose = (agent.purpose && agent.purpose.trim()) || 
                     (agent.description && agent.description.trim()) || 
                     "A helpful AI assistant";
      const personality = (agent.personality && agent.personality.trim()) || 
                         "Helpful, knowledgeable, and professional";
      const principles = (agent.principles && agent.principles.trim()) || 
                        "Always be helpful, accurate, and respectful";

      // Create a clean agent object matching the exact structure of working requests
      // Ensure all required fields are properly set and not undefined/null/empty
      const cleanAgentForGeneration = {
        name: (agent.name && agent.name.trim()) || "AI Assistant",
        purpose: purpose, // Already validated above
        personality: personality, // Already validated above
        principles: principles, // Already validated above
        owner: agent.owner,
        model: agent.model || "gpt-4.1-nano",
        temperature: agent.temperature ?? 0.7,
        skills: agent.skills || {},
        readonly_wallet_address: (agent as any).readonly_wallet_address || "",
        created_at: agent.created_at,
        updated_at: agent.updated_at,
      };

      // Final validation - ensure no required fields are empty
      if (!cleanAgentForGeneration.name || !cleanAgentForGeneration.purpose || 
          !cleanAgentForGeneration.personality || !cleanAgentForGeneration.principles) {
        const missingFields = [];
        if (!cleanAgentForGeneration.name) missingFields.push('name');
        if (!cleanAgentForGeneration.purpose) missingFields.push('purpose');
        if (!cleanAgentForGeneration.personality) missingFields.push('personality');
        if (!cleanAgentForGeneration.principles) missingFields.push('principles');
        
        logger.error("VIBE FLOW - Required fields still missing after fallbacks", {
          missingFields,
          cleanAgentFields: Object.keys(cleanAgentForGeneration),
        }, "AgentHandler.handleEditAgent");
        
        throw new Error(`Required fields are missing: ${missingFields.join(', ')}`);
      }

      logger.info("VIBE FLOW - Using fallback values for missing fields", {
        originalPurpose: agent.purpose,
        finalPurpose: purpose,
        originalPersonality: agent.personality,
        finalPersonality: personality,
        originalPrinciples: agent.principles,
        finalPrinciples: principles,
      }, "AgentHandler.handleEditAgent");

      logger.info("VIBE FLOW - Clean agent object created", {
        cleanAgentFields: Object.keys(cleanAgentForGeneration),
        hasCleanPurpose: !!cleanAgentForGeneration.purpose,
        hasCleanPersonality: !!cleanAgentForGeneration.personality,
        hasCleanPrinciples: !!cleanAgentForGeneration.principles,
      }, "AgentHandler.handleEditAgent");

      const generateRequest: AgentGenerateRequest = {
        prompt: userInput.trim(),
        user_id: userId,
        project_id: null,
        existing_agent: cleanAgentForGeneration,
      };

      // Enhanced logging for vibe page flow
      logger.info("VIBE FLOW - Sending edit request with clean agent object", {
        agentId: agent.id,
        agentName: agent.name,
        promptLength: generateRequest.prompt.length,
        flowType: "EDIT_EXISTING_AGENT",
        hasProjectId: !!generateRequest.project_id,
        userIdType: userId?.startsWith('did:privy') ? 'privy' : 'unknown',
        agentSkillsCount: agent.skills ? Object.keys(agent.skills).length : 0,
        agentSkillNames: agent.skills ? Object.keys(agent.skills) : [],
        agentModel: agent.model,
        agentOwner: agent.owner,
        cleanAgentFields: Object.keys(cleanAgentForGeneration),
        usingCleanAgent: true,
      }, "AgentHandler.handleEditAgent");

      // Log detailed skill structure for debugging
      if (agent.skills) {
        Object.entries(agent.skills).forEach(([skillName, skillData]) => {
          logger.info(`VIBE FLOW - Skill Detail: ${skillName}`, {
            skillName,
            enabled: (skillData as any)?.enabled,
            hasStates: !!(skillData as any)?.states,
            stateKeys: (skillData as any)?.states ? Object.keys((skillData as any).states) : [],
            hasApiKey: !!(skillData as any)?.api_key,
            apiKeyProvider: (skillData as any)?.api_key_provider,
          }, "AgentHandler.handleEditAgent");
        });
      }

      const response: AgentGenerateResponse = await apiClient.generateAgent(generateRequest);

      logger.info("Agent edit successful", {
        agentId: agent.id,
        updatedAgentName: response.agent.name,
        skillsCount: response.activated_skills?.length || 0,
      }, "AgentHandler.handleEditAgent");

      // Create updated agent preserving important fields
      const updatedAgent: Agent = {
        ...response.agent,
        id: agent.id,
        owner: agent.owner,
        created_at: agent.created_at,
        updated_at: new Date().toISOString(),
        cdp_wallet_address: agent.cdp_wallet_address,
        network_id: agent.network_id,
        cdp_network_id: agent.cdp_network_id,
      };

      // Auto-update the agent immediately
      await AgentHandler.handleAutoUpdate(updatedAgent, setMessages, onAgentUpdated);
      
    } catch (error: any) {
      logger.error("Failed to edit agent", {
        agentId: agent.id,
        error: error.message,
        status: error.response?.status,
      }, "AgentHandler.handleEditAgent");

      let errorMessage = "Failed to generate agent changes";
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const chatErrorMessage: ConversationMessage = {
        role: "assistant",
        content: `**Error:** ${errorMessage}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatErrorMessage]);
      showToast.error(`Failed to edit agent: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  }

  /**
   * Auto-update agent after generation
   */
  static async handleAutoUpdate(
    updatedAgent: Agent,
    setMessages: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void,
    onAgentUpdated: (updatedAgent: Agent) => void
  ) {
    try {
      logger.info("Auto-updating agent", {
        agentId: updatedAgent.id,
        agentName: updatedAgent.name,
      }, "AgentHandler.handleAutoUpdate");

      // Ensure required fields are present with fallbacks
      const updateData = {
        name: updatedAgent.name || "AI Assistant",
        purpose: updatedAgent.purpose || "A helpful AI assistant",
        personality: updatedAgent.personality || "Helpful, knowledgeable, and professional",
        principles: updatedAgent.principles || "Always be helpful, accurate, and respectful",
        model: updatedAgent.model,
        skills: updatedAgent.skills,
        example_intro: updatedAgent.example_intro,
      };

      // Validate that all required fields are properly set
      const requiredFields: (keyof typeof updateData)[] = ['name', 'purpose', 'personality', 'principles'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        const value = updateData[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        logger.error("Auto-update failed - missing required fields", {
          missingFields,
          updateData: Object.keys(updateData),
        }, "AgentHandler.handleAutoUpdate");
        throw new Error(`Missing required fields for update: ${missingFields.join(', ')}`);
      }

      const finalUpdatedAgent = await apiClient.updateAgent(updatedAgent.id!, updateData);
      onAgentUpdated(finalUpdatedAgent);

      const updateContent = `**Excellent!** Your agent "${finalUpdatedAgent.name}" has been successfully updated!\n\n**The changes are now live and you can continue chatting with your updated agent in the right panel!**`;

      const updateMessage: ConversationMessage = {
        role: "assistant",
        content: updateContent,
        created_at: new Date().toISOString(),
        metadata: {
          updatedAgent: finalUpdatedAgent,
          success: true,
        },
      };
      setMessages(prev => [...prev, updateMessage]);

      logger.info("Agent auto-update successful", {
        agentId: finalUpdatedAgent.id,
        agentName: finalUpdatedAgent.name 
      }, "AgentHandler.handleAutoUpdate");

      showToast.success(`Agent "${finalUpdatedAgent.name}" updated successfully!`);

    } catch (error: any) {
      logger.error("Failed to auto-update agent", { error }, "AgentHandler.handleAutoUpdate");
      
      let errorMessage = "Failed to apply changes to agent";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please sign in again.";
      } else if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const chatErrorMessage: ConversationMessage = {
        role: "assistant",
        content: `**Update Error:** ${errorMessage}\n\nThe changes were generated successfully but couldn't be applied.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatErrorMessage]);
      showToast.error(`Failed to update agent: ${errorMessage}`);
    }
  }

  /**
   * Handle agent creation - generates and deploys new agent
   */
  static async handleCreateAgent(
    userInput: string,
    userId: string,
    projectId: string | null,
    setGenerating: (loading: boolean) => void,
    setMessages: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void,
    setProjectId: (id: string) => void,
    onAgentCreated: (agent: Agent) => void
  ) {
    if (!userInput.trim()) {
      showToast.error("Please describe the agent you want to create");
      return;
    }

    if (userInput.trim().length < 10) {
      showToast.error("Please provide a more detailed description (at least 10 characters)");
      return;
    }

    if (userInput.trim().length > 1000) {
      showToast.error("Description is too long (maximum 1000 characters)");
      return;
    }

    logger.info("Starting agent creation", {
      promptLength: userInput.length,
      hasProjectId: !!projectId,
      userId
    }, "AgentHandler.handleCreateAgent");

    // Add user message
    const userMessage: ConversationMessage = {
      role: "user", 
      content: userInput.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setGenerating(true);

    try {
      const generateRequest: AgentGenerateRequest = {
        prompt: userInput.trim(),
        user_id: userId,
        project_id: projectId,
        existing_agent: null,
      };

      // Enhanced logging for create agent flow
      logger.info("CREATE FLOW - Sending creation request", {
        promptLength: generateRequest.prompt.length,
        flowType: "CREATE_NEW_AGENT",
        hasProjectId: !!generateRequest.project_id,
        projectId: generateRequest.project_id,
        userIdType: userId?.startsWith('did:privy') ? 'privy' : 'unknown',
        hasExistingAgent: !!generateRequest.existing_agent,
      }, "AgentHandler.handleCreateAgent");

      const response: AgentGenerateResponse = await apiClient.generateAgent(generateRequest);
      setProjectId(response.project_id);

      logger.info("Agent generation successful", {
        projectId: response.project_id,
        agentName: response.agent.name,
        skillsCount: response.activated_skills?.length || 0,
      }, "AgentHandler.handleCreateAgent");

      const generatedAgent: Agent = {
        ...response.agent,
        owner: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let summaryContent = response.summary;
      if (response.activated_skills && response.activated_skills.length > 0) {
        summaryContent += `\n\n**Activated Skills:** ${response.activated_skills.join(", ")}`;
      }
      if (response.autonomous_tasks && response.autonomous_tasks.length > 0) {
        summaryContent += `\n\n**Autonomous Tasks:** ${response.autonomous_tasks.length} task(s) configured`;
      }
      summaryContent += `\n\n**Deploying your agent now...**`;

      const aiMessage: ConversationMessage = {
        role: "assistant",
        content: summaryContent,
        created_at: new Date().toISOString(),
        metadata: {
          agent: generatedAgent,
          projectId: response.project_id,
          activatedSkills: response.activated_skills || [],
          autonomousTasks: response.autonomous_tasks || [],
          tags: response.tags || [],
        },
      };
      setMessages(prev => [...prev, aiMessage]);

      // Auto-deploy the generated agent
      await AgentHandler.handleAutoDeploy(generatedAgent, setMessages, onAgentCreated);
      
    } catch (error: any) {
      logger.error("Failed to create agent", {
        error: error.message,
        status: error.response?.status,
      }, "AgentHandler.handleCreateAgent");

      let errorMessage = "Failed to generate agent";
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const generateErrorMessage: ConversationMessage = {
        role: "assistant",
        content: `**Error:** ${errorMessage}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, generateErrorMessage]);
      showToast.error(`Failed to create agent: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  }

  /**
   * Auto-deploy generated agent
   */
  static async handleAutoDeploy(
    agentToDeploy: Agent,
    setMessages: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void,
    onAgentCreated: (agent: Agent) => void
  ) {
    try {
      logger.info("Auto-deploying agent", {
        agentName: agentToDeploy.name,
      }, "AgentHandler.handleAutoDeploy");

      // Ensure required fields are present before deployment
      const cleanAgentForDeployment = {
        ...agentToDeploy,
        name: agentToDeploy.name || "AI Assistant",
        purpose: agentToDeploy.purpose || "A helpful AI assistant",
        personality: agentToDeploy.personality || "Helpful, knowledgeable, and professional",
        principles: agentToDeploy.principles || "Always be helpful, accurate, and respectful",
      };

      // Validate required fields
      const requiredFields: (keyof typeof cleanAgentForDeployment)[] = ['name', 'purpose', 'personality', 'principles'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        const value = cleanAgentForDeployment[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        logger.error("Auto-deploy failed - missing required fields", {
          missingFields,
          agentFields: Object.keys(cleanAgentForDeployment),
        }, "AgentHandler.handleAutoDeploy");
        throw new Error(`Missing required fields for deployment: ${missingFields.join(', ')}`);
      }

      const deployedAgent = await apiClient.createAgent(cleanAgentForDeployment);
      onAgentCreated(deployedAgent);

      let deployContent = `**Excellent!** Your agent "${deployedAgent.name}" has been successfully deployed and is now ready to use!`;

      if (deployedAgent.cdp_wallet_address) {
        deployContent += `\n\n**CDP Wallet provisioned:** ${deployedAgent.cdp_wallet_address.slice(0, 6)}...${deployedAgent.cdp_wallet_address.slice(-4)}`;
        if (deployedAgent.network_id || deployedAgent.cdp_network_id) {
          deployContent += `\n**Network:** ${deployedAgent.network_id || deployedAgent.cdp_network_id}`;
        }
      }

      deployContent += `\n\n**You can now start chatting with your agent in the right panel!**`;

      const deployMessage: ConversationMessage = {
        role: "assistant",
        content: deployContent,
        created_at: new Date().toISOString(),
        metadata: {
          deployedAgent: deployedAgent,
          success: true,
        },
      };
      setMessages(prev => [...prev, deployMessage]);

      logger.info("Agent auto-deploy successful", {
        agentId: deployedAgent.id,
        agentName: deployedAgent.name 
      }, "AgentHandler.handleAutoDeploy");

      showToast.success(`Agent "${deployedAgent.name}" deployed and ready to chat!`);

    } catch (error: any) {
      logger.error("Failed to auto-deploy agent", { error }, "AgentHandler.handleAutoDeploy");
      
      let errorMessage = "Failed to deploy agent";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please sign in again.";
      } else if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const chatErrorMessage: ConversationMessage = {
        role: "assistant",
        content: `**Deployment Error:** ${errorMessage}\n\nThe agent was generated successfully but couldn't be deployed.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatErrorMessage]);
      showToast.error(`Failed to deploy agent: ${errorMessage}`);
    }
  }
}