import React from "react";

interface SidebarNavigationProps {
  sections: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
  }>;
  activeSection?: string;
  onSectionClick: (sectionId: string) => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  sections,
  activeSection,
  onSectionClick,
}) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
    onSectionClick(sectionId);
  };

  return (
    <div className="w-64 bg-[var(--color-bg-card)] border-r border-[var(--color-border-primary)] p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
        <svg
          className="w-4 h-4 mr-2 text-[var(--color-neon-cyan)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        Navigation
      </h3>

      <nav className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`w-full flex items-center space-x-3 text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
              activeSection === section.id
                ? "bg-[var(--color-neon-purple)] text-[var(--color-text-on-primary)] neon-glow-purple"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
            }`}
          >
            <span className="flex-shrink-0">{section.icon}</span>
            <span className="truncate">{section.label}</span>
          </button>
        ))}
      </nav>

      {/* Quick Actions */}
      <div className="mt-8 pt-4 border-t border-[var(--color-border-secondary)]">
        <h4 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button
            onClick={() => scrollToSection("skills-section")}
            className="w-full flex items-center space-x-2 text-left px-3 py-2 rounded-lg transition-all duration-200 text-xs text-[var(--color-neon-lime)] hover:text-[var(--color-neon-lime-bright)] hover:bg-[var(--color-neon-lime-subtle)]"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Add Skills</span>
          </button>
          <button
            onClick={() => scrollToSection("autonomous-tasks")}
            className="w-full flex items-center space-x-2 text-left px-3 py-2 rounded-lg transition-all duration-200 text-xs text-[var(--color-neon-purple)] hover:text-[var(--color-neon-purple-bright)] hover:bg-[var(--color-neon-purple-subtle)]"
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Add Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarNavigation;
