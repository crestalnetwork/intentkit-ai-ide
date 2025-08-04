import React, { useState, useEffect } from "react";
import skillsData from "../lib/data/skills.json";
import { showToast } from "../lib/utils/toast";

interface SkillsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onAddSkill: (skillName: string, skillConfig: any) => void;
}

interface SkillStates {
  [key: string]: {
    type: string;
    title: string;
    enum: string[];
    "x-enum-title": string[];
    description: string;
    default: string;
    "x-price-level": number;
  };
}

interface SkillConfig {
  title: string;
  description: string;
  "x-icon": string;
  "x-tags": string[];
  properties: {
    enabled: any;
    states: {
      properties: SkillStates;
    };
    api_key_provider?: any;
    [key: string]: any;
  };
  "x-avg-price-level": number;
}

const SkillsPanel: React.FC<SkillsPanelProps> = ({
  isVisible,
  onClose,
  onAddSkill,
}) => {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Extract skills from the JSON schema
  const skills = skillsData.properties?.skills?.properties || {};

  // Get unique categories/tags
  const categories = Array.from(
    new Set(
      Object.values(skills).flatMap((skill: any) => skill["x-tags"] || [])
    )
  ).sort();

  // Filter skills based on search and category
  const filteredSkills = Object.entries(skills).filter(
    ([skillName, skill]: [string, any]) => {
      const matchesSearch =
        skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        (skill["x-tags"] && skill["x-tags"].includes(selectedCategory));

      return matchesSearch && matchesCategory;
    }
  );

  // Helper function to extract URL from markdown link format
  const extractUrlFromMarkdown = (markdownLink: string) => {
    const match = markdownLink.match(/\[([^\]]+)\]\(([^)]+)\)/);
    return match ? { text: match[1], url: match[2] } : null;
  };

  // Helper function to check if skill requires owner API key
  const requiresOwnerApiKey = (skill: any) => {
    return skill.properties?.api_key_provider?.enum?.includes("agent_owner");
  };

  // Helper function to get API key URL for owner-provided keys
  const getApiKeyUrl = (skill: any) => {
    // Debug logging for troubleshooting
    if (process.env.NODE_ENV === "development" && requiresOwnerApiKey(skill)) {
      console.log("Skill with API key requirement:", {
        title: skill.title,
        hasIf: !!skill.if,
        hasThen: !!skill.then,
        ifCondition: skill.if?.properties?.api_key_provider?.const,
        thenApiKey: skill.then?.properties?.api_key,
      });
    }

    // The api_key property with x-link is inside the conditional "then" block
    // when api_key_provider is "agent_owner"
    if (
      skill.if &&
      skill.if.properties?.api_key_provider?.const === "agent_owner" &&
      skill.then
    ) {
      const apiKeyProperty = skill.then.properties?.api_key;
      if (apiKeyProperty && apiKeyProperty["x-link"]) {
        return extractUrlFromMarkdown(apiKeyProperty["x-link"]);
      }
    }

    // Also check direct properties structure for fallback
    const apiKeyProperty = skill.properties?.api_key;
    if (apiKeyProperty && apiKeyProperty["x-link"]) {
      return extractUrlFromMarkdown(apiKeyProperty["x-link"]);
    }

    return null;
  };

  const generateSkillConfig = (skillName: string, skill: SkillConfig) => {
    return {
      [skillName]: {
        enabled: true,
        states: Object.keys(skill.properties.states?.properties || {}).reduce(
          (acc, stateName) => {
            acc[stateName] = "private";
            return acc;
          },
          {} as any
        ),
        api_key_provider:
          skill.properties.api_key_provider?.default || "platform",
      },
    };
  };

  // Generate skill config with skill name as key for copying to agent editor
  const generateSkillConfigForAgent = (
    skillName: string,
    skill: SkillConfig
  ) => {
    return {
      [skillName]: {
        enabled: true,
        states: Object.keys(skill.properties.states?.properties || {}).reduce(
          (acc, stateName) => {
            acc[stateName] = "private";
            return acc;
          },
          {} as any
        ),
        api_key_provider:
          skill.properties.api_key_provider?.default || "platform",
      },
    };
  };

  const generateYAML = (skillName: string, skill: SkillConfig) => {
    const config = generateSkillConfig(skillName, skill);
    return `skills:
  ${skillName}:
    enabled: true
    states:${Object.keys(skill.properties.states?.properties || {})
      .map((stateName) => `\n      ${stateName}: private`)
      .join("")}
    api_key_provider: ${
      skill.properties.api_key_provider?.default || "platform"
    }`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 min-w-[500px] max-w-[800px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
      {/* Panel */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Available Skills
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Browse and add skills to your agent
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-neon-lime)] transition-colors hover-neon-glow-lime rounded cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-[var(--color-border-primary)] space-y-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] placeholder:text-[var(--color-text-muted)] transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Skills List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSkills.map(([skillName, skill]: [string, any]) => (
            <div
              key={skillName}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg overflow-hidden transition-all duration-200 hover:border-[var(--color-neon-lime-border)] hover-neon-glow-lime"
            >
              {/* Card Header */}
              <div className="p-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() =>
                    setExpandedSkill(
                      expandedSkill === skillName ? null : skillName
                    )
                  }
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg flex items-center justify-center overflow-hidden">
                    {skill["x-icon"] ? (
                      <img
                        src={skill["x-icon"]}
                        alt={skill.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML = `<span class="text-lg font-bold text-[var(--color-text-primary)]">${
                            skill.title?.charAt(0) || skillName.charAt(0)
                          }</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        {skill.title?.charAt(0) || skillName.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          {skill.title || skillName}
                        </h3>
                        {requiresOwnerApiKey(skill) && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-[var(--color-neon-orange-subtle)] border border-[var(--color-neon-orange-border)] rounded-full">
                            <svg
                              className="w-3 h-3 text-[var(--color-neon-orange)]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9l-1 1-1 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1h2l4.586-4.586A6 6 0 0121 9z"
                              />
                            </svg>
                            <span className="text-xs font-medium text-[var(--color-neon-orange)]">
                              API Key
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                      {skill.description}
                    </p>

                    {/* Tags */}
                    {skill["x-tags"] && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {skill["x-tags"].slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-0.5 bg-[var(--color-neon-cyan-subtle)] text-xs text-[var(--color-neon-cyan)] rounded font-medium border border-[var(--color-neon-cyan-border)]"
                          >
                            {tag}
                          </span>
                        ))}
                        {skill["x-tags"].length > 3 && (
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            +{skill["x-tags"].length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div
                      className="flex items-center justify-between mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center space-x-2 text-xs text-[var(--color-text-tertiary)]">
                        <svg
                          className={`w-3 h-3 transform transition-transform duration-200 ${
                            expandedSkill === skillName ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        <span>
                          {expandedSkill === skillName
                            ? "Click above to collapse"
                            : "Click above to expand"}
                        </span>
                      </div>

                      {/* TODO: Add Skill button - will be implemented later */}
                      {/* 
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddSkill(
                              skillName,
                              generateSkillConfig(skillName, skill)
                            );
                          }}
                          className="text-xs py-1.5 px-3 bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime hover-neon-glow-lime transition-all duration-200 font-medium"
                        >
                          Add Skill
                        </button>
                        */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSkill === skillName && (
                <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]">
                  <div className="p-4 space-y-4">
                    {/* Available Actions */}
                    {skill.properties?.states?.properties && (
                      <div>
                        <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                          Available Actions (
                          {
                            Object.keys(skill.properties.states.properties)
                              .length
                          }
                          )
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(
                            skill.properties.states.properties
                          ).map(([actionName, action]: [string, any]) => (
                            <div
                              key={actionName}
                              className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded p-3"
                            >
                              <div className="mb-1">
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                  {action.title || actionName}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                                {action.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* API Key Information */}
                    {requiresOwnerApiKey(skill) && (
                      <div className="bg-[var(--color-neon-orange-subtle)] border border-[var(--color-neon-orange-border)] rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-[var(--color-neon-orange)]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9l-1 1-1 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1h2l4.586-4.586A6 6 0 0121 9z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">
                              🔑 API Key Required
                            </h4>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                              This skill requires an API key that you need to
                              obtain yourself. You'll need to sign up with the
                              service provider to get access.
                            </p>
                            {getApiKeyUrl(skill) && (
                              <a
                                href={getApiKeyUrl(skill)!.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--color-neon-cyan)] text-black rounded-lg hover:bg-[var(--color-neon-cyan-bright)] transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl hover:shadow-[var(--color-neon-cyan-glow)] transform hover:scale-[1.02] cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                <span>{getApiKeyUrl(skill)!.text} ↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Configuration Examples */}
                    <div>
                      <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                        Configuration
                      </h4>

                      <div className="space-y-3">
                        {/* JSON Config */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                              JSON Configuration
                            </label>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const jsonConfig = JSON.stringify(
                                  generateSkillConfigForAgent(skillName, skill),
                                  null,
                                  2
                                );
                                navigator.clipboard.writeText(jsonConfig);
                                showToast.success(
                                  `Skill "${skillName}" config copied to clipboard! Paste into agent's skills section.`
                                );
                              }}
                              className="text-xs py-1 px-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded hover:bg-[var(--color-bg-card)] hover:text-[var(--color-neon-cyan)] transition-all duration-200 flex items-center space-x-1 cursor-pointer"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded p-3 text-xs text-[var(--color-text-primary)] overflow-x-auto">
                            {JSON.stringify(
                              generateSkillConfigForAgent(skillName, skill),
                              null,
                              2
                            )}
                          </pre>
                        </div>

                        {/* YAML Config */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                              YAML Configuration
                            </label>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const yamlConfig = generateYAML(
                                  skillName,
                                  skill
                                );
                                navigator.clipboard.writeText(yamlConfig);
                                showToast.success(
                                  "YAML configuration copied to clipboard!"
                                );
                              }}
                              className="text-xs py-1 px-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded hover:bg-[var(--color-bg-card)] hover:text-[var(--color-neon-cyan)] transition-all duration-200 flex items-center space-x-1 cursor-pointer"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded p-3 text-xs text-[var(--color-text-primary)] overflow-x-auto">
                            {generateYAML(skillName, skill)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredSkills.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)]">
                No skills found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsPanel;
