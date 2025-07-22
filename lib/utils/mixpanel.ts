import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

class MixpanelTracker {
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined' && MIXPANEL_TOKEN) {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage',
      });
      this.initialized = true;
      console.log('Mixpanel initialized with token:', MIXPANEL_TOKEN.substring(0, 8) + '...');
    } else if (typeof window !== 'undefined') {
      console.warn('Mixpanel token not found. Please add NEXT_PUBLIC_MIXPANEL_TOKEN to your .env.local file');
    }
  }

  // Identify user
  identify(userId: string, userProperties?: Record<string, any>) {
    if (!this.initialized) return;
    
    mixpanel.identify(userId);
    if (userProperties) {
      mixpanel.people.set(userProperties);
    }
  }

  // Track events
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    
    mixpanel.track(eventName, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;
    
    mixpanel.people.set(properties);
  }

  // Track page views
  trackPageView(pageName?: string) {
    if (!this.initialized) return;
    
    this.track('Page View', {
      page: pageName || window.location.pathname,
      url: window.location.href,
      referrer: document.referrer,
    });
  }

  // Reset user (for logout)
  reset() {
    if (!this.initialized) return;
    
    mixpanel.reset();
  }
}

// Create singleton instance
const mixpanelTracker = new MixpanelTracker();

// Quick Agent Creator specific events
export const trackQuickCreatorEvents = {
  // Template selection
  templateSelected: (templateId: string, templateName: string) => {
    mixpanelTracker.track('Quick Creator - Template Selected', {
      template_id: templateId,
      template_name: templateName,
      source: 'quick_creator',
    });
  },

  // Agent creation started
  agentCreationStarted: (templateId: string, userId?: string) => {
    mixpanelTracker.track('Quick Creator - Agent Creation Started', {
      template_id: templateId,
      user_id: userId,
      source: 'quick_creator',
    });
  },

  // Agent creation completed
  agentCreationCompleted: (agentId: string, agentName: string, templateId: string, userId?: string) => {
    mixpanelTracker.track('Quick Creator - Agent Creation Completed', {
      agent_id: agentId,
      agent_name: agentName,
      template_id: templateId,
      user_id: userId,
      source: 'quick_creator',
    });
  },

  // Agent creation failed
  agentCreationFailed: (templateId: string, error: string, userId?: string) => {
    mixpanelTracker.track('Quick Creator - Agent Creation Failed', {
      template_id: templateId,
      error_message: error,
      user_id: userId,
      source: 'quick_creator',
    });
  },

  // Chat with agent started
  chatStarted: (agentId: string, templateId: string, userId?: string) => {
    mixpanelTracker.track('Quick Creator - Chat Started', {
      agent_id: agentId,
      template_id: templateId,
      user_id: userId,
      source: 'quick_creator',
    });
  },

  // User authentication
  userSignIn: (userId: string, method: 'signin' | 'signup') => {
    mixpanelTracker.track('Quick Creator - User Auth', {
      auth_method: method,
      user_id: userId,
      source: 'quick_creator',
    });
  },

  // Navigation events
  navigatedToMainApp: (fromStep: string, agentId?: string) => {
    mixpanelTracker.track('Quick Creator - Navigated to Main App', {
      from_step: fromStep,
      agent_id: agentId,
      source: 'quick_creator',
    });
  },

  // Page view
  pageView: () => {
    mixpanelTracker.trackPageView('Quick Creator');
  },
};

export default mixpanelTracker; 