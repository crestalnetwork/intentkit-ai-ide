import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";

// Register languages for smaller bundle size
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);

// Custom markdown components with neon theme styling
export const MarkdownComponents = {
  // Links
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] underline transition-colors font-medium"
      {...props}
    >
      {children}
    </a>
  ),

  // Strong/Bold text
  strong: ({ children, ...props }: any) => (
    <strong
      className="font-semibold text-[var(--color-text-primary)]"
      {...props}
    >
      {children}
    </strong>
  ),

  // Emphasis/Italic text
  em: ({ children, ...props }: any) => (
    <em
      className="italic text-[var(--color-text-secondary)]"
      {...props}
    >
      {children}
    </em>
  ),

  // Headers
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-2xl font-bold text-[var(--color-neon-lime)] mb-4 border-b border-[var(--color-border-primary)] pb-2"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      className="text-xl font-bold text-[var(--color-neon-cyan)] mb-3 border-b border-[var(--color-border-secondary)] pb-1"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      className="text-lg font-semibold text-[var(--color-text-primary)] mb-2"
      {...props}
    >
      {children}
    </h3>
  ),

  // Code blocks
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    return !inline && language ? (
      <div className="my-4">
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="rounded-lg border border-[var(--color-border-secondary)]"
          customStyle={{
            background: "var(--color-bg-secondary)",
            padding: "1rem",
            fontSize: "0.875rem",
            margin: 0,
          }}
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code
        className="bg-[var(--color-bg-secondary)] text-[var(--color-neon-lime)] px-1.5 py-0.5 rounded text-sm font-mono border border-[var(--color-border-secondary)]"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Block quotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-[var(--color-neon-purple)] bg-[var(--color-bg-secondary)] pl-4 py-2 my-4 italic text-[var(--color-text-secondary)]"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside my-2 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-[var(--color-text-secondary)] ml-2" {...props}>
      {children}
    </li>
  ),

  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table
        className="min-w-full border-collapse border border-[var(--color-border-primary)] rounded-lg"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-[var(--color-bg-secondary)]" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="border border-[var(--color-border-primary)] px-4 py-2 text-left font-semibold text-[var(--color-text-primary)]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td
      className="border border-[var(--color-border-primary)] px-4 py-2 text-[var(--color-text-secondary)]"
      {...props}
    >
      {children}
    </td>
  ),

  // Horizontal rule
  hr: ({ ...props }: any) => (
    <hr
      className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-[var(--color-neon-purple)] to-transparent"
      {...props}
    />
  ),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;