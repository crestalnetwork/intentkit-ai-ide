import React, { useState } from "react";
import { AgentTemplate, AGENT_TEMPLATES } from "../lib/utils/templates";

interface TemplateSelectorProps {
  onTemplateSelect: (template: AgentTemplate) => void;
  onClose: () => void;
  isVisible: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  onClose,
  isVisible,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isVisible) return null;

  const categories = Array.from(
    new Set(AGENT_TEMPLATES.map((template) => template.category))
  );

  const filteredTemplates = selectedCategory
    ? AGENT_TEMPLATES.filter(
        (template) => template.category === selectedCategory
      )
    : AGENT_TEMPLATES;

  const getCategoryDisplayName = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-card)]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                Choose an Agent Template
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                Select a pre-configured template to quickly create an agent with
                specific capabilities and skills. Each template comes with
                optimized prompts and pre-configured tools.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-neon-red)] hover:bg-[var(--color-neon-red-subtle)] rounded-lg transition-all duration-200"
              title="Close"
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
        </div>

        {/* Category Filter */}
        <div className="p-6 border-b border-[var(--color-border-primary)]">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === null
                  ? "bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] shadow-lg shadow-[var(--color-neon-lime-glow)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-secondary)]"
              }`}
            >
              All Templates ({filteredTemplates.length})
            </button>
            {categories.map((category) => {
              const categoryCount = AGENT_TEMPLATES.filter(
                (t) => t.category === category
              ).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-[var(--color-neon-cyan)] text-[var(--color-text-on-primary)] shadow-lg shadow-[var(--color-neon-cyan-glow)]"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-secondary)]"
                  }`}
                >
                  {getCategoryDisplayName(category)} ({categoryCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:border-[var(--color-neon-lime-border)] hover:shadow-lg hover:shadow-[var(--color-neon-lime-glow)] transition-all duration-300 cursor-pointer group transform hover:scale-[1.02]"
                onClick={() => onTemplateSelect(template)}
              >
                {/* Template Header */}
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl flex items-center justify-center text-2xl group-hover:border-[var(--color-neon-lime-border)] transition-colors">
                    {template.icon}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-neon-lime)] transition-colors">
                      {template.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs rounded-full border border-[var(--color-border-secondary)]">
                      {getCategoryDisplayName(template.category)}
                    </span>
                  </div>
                </div>

                {/* Template Description */}
                <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed line-clamp-3">
                  {template.description}
                </p>

                {/* Skills Preview */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1 text-[var(--color-neon-orange)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Included Skills ({Object.keys(template.skills).length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(template.skills).map((skillName) => (
                      <span
                        key={skillName}
                        className="inline-flex items-center bg-[var(--color-neon-cyan-subtle)] text-[var(--color-neon-cyan)] text-xs px-3 py-1 rounded-full font-medium border border-[var(--color-neon-cyan-border)]"
                      >
                        {skillName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Use Template Button */}
                <button className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded-lg hover:bg-[var(--color-neon-lime-bright)] transition-all duration-200 font-medium group-hover:shadow-lg group-hover:shadow-[var(--color-neon-lime-glow)]">
                  <span>Use This Template</span>
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
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-[var(--color-text-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                No Templates Found
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                No templates match the selected category. Try selecting a
                different category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
