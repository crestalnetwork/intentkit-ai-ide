import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthProvider";
import { Agent } from "@/lib/utils/apiClient";
import apiClient from "@/lib/utils/apiClient";
import { showToast } from "@/lib/utils/toast";
import logger from "@/lib/utils/logger";
import confetti from "canvas-confetti";
import { ConversationMessage } from "@/components/vibe/AgentEditor";
import { AgentHandler } from "@/components/vibe/AgentHandler";

export const useVibeLogic = () => {
  const router = useRouter();
  const { agentId } = router.query;
  const { user, isAuthenticated, initingLogin } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Create mode state
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  // Confetti celebration when page loads
  useEffect(() => {
    const triggerConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    };
    
    const timer = setTimeout(triggerConfetti, 300);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!initingLogin && !isAuthenticated) {
      router.push("/");
      return;
    }
  }, [initingLogin, isAuthenticated, router]);

  // Load agent data or set create mode
  useEffect(() => {
    if (initingLogin || !isAuthenticated) {
      return;
    }
    
    const loadAgent = async () => {
      setLoading(true);
      
      try {
        if (!agentId || agentId === "new") {
          // Create mode - no agent ID or "new" ID
          logger.info("Vibe page in create mode", { agentId }, "useVibeLogic.loadAgent");
          setIsCreateMode(true);
          setAgent(null);
          
          // Welcome message for create mode
          const welcomeMessage: ConversationMessage = {
            role: "assistant",
            content: "Hello! I'm here to help you create a new IntentKit agent. Describe what you want your agent to do and I'll generate it for you!\n\nFor example:\n• \"Create an agent that helps track crypto prices\"\n• \"I need an agent for managing my DeFi portfolio\"\n• \"Build an agent that can answer questions about blockchain data\"",
            created_at: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
          
        } else {
          // Edit mode - load existing agent
          logger.info("Vibe page in edit mode", { agentId }, "useVibeLogic.loadAgent");
          setIsCreateMode(false);
          
          const loadedAgent = await apiClient.getAgent(agentId as string);
          setAgent(loadedAgent);
          
          // Welcome message for edit mode
          const welcomeMessage: ConversationMessage = {
            role: "assistant",
            content: `Hello! I'm here to help you edit your agent "${loadedAgent.name}". Describe the changes you want to make and I'll update it for you!\n\nFor example:\n• \"Make it more focused on DeFi protocols\"\n• \"Add crypto trading capabilities\"\n• \"Change the personality to be more helpful\"`,
            created_at: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
          
          logger.info("Agent loaded for editing", { 
            agentId: loadedAgent.id, 
            agentName: loadedAgent.name 
          }, "useVibeLogic.loadAgent");
        }
      } catch (error: any) {
        logger.error("Failed to load agent", { 
          agentId, 
          error: error.message 
        }, "useVibeLogic.loadAgent");
        
        if (error.response?.status === 404) {
          showToast.error("Agent not found");
          router.push("/");
        } else {
          showToast.error("Failed to load agent data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [agentId, initingLogin, isAuthenticated, user, router]);

  // Handle send message
  const handleSendMessage = () => {
    if (!user) return;
    
    if (isCreateMode) {
      AgentHandler.handleCreateAgent(
        inputValue,
        user.id,
        projectId,
        setGenerating,
        setMessages,
        setProjectId,
        (createdAgent) => {
          setAgent(createdAgent);
          setIsCreateMode(false); // Switch to edit mode after creation
        }
      );
    } else if (agent) {
      AgentHandler.handleEditAgent(
        agent,
        inputValue,
        user.id,
        setGenerating,
        setMessages,
        setAgent
      );
    }
    
    setInputValue("");
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // Refresh agent data
  const refreshAgent = async () => {
    if (!agentId || agentId === "new" || !isAuthenticated) {
      return;
    }
    
    try {
      logger.info("Refreshing agent data", { agentId }, "useVibeLogic.refreshAgent");
      const refreshedAgent = await apiClient.getAgent(agentId as string);
      setAgent(refreshedAgent);
      logger.info("Agent data refreshed", { 
        agentId: refreshedAgent.id, 
        agentName: refreshedAgent.name 
      }, "useVibeLogic.refreshAgent");
    } catch (error: any) {
      logger.error("Failed to refresh agent data", { 
        agentId, 
        error: error.message 
      }, "useVibeLogic.refreshAgent");
      showToast.error("Failed to refresh agent data");
    }
  };

  return {
    // State
    agent,
    loading,
    generating,
    isCreateMode,
    messages,
    inputValue,
    
    // Auth
    user,
    isAuthenticated,
    initingLogin,
    
    // Handlers
    handleSendMessage,
    handleInputChange,
    setMessages,
    refreshAgent,
  };
};