import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownContentProps {
  content: string;
}

function isSafeHref(href: string | undefined): href is string {
  if (!href) {
    return false;
  }
  const value = href.trim().toLowerCase();
  return (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("mailto:")
  );
}

const markdownComponents: Components = {
  a: ({ href, children }) => {
    if (!isSafeHref(href)) {
      return <span>{children}</span>;
    }
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    return (
      <a href={href} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
        {children}
      </a>
    );
  },
  img: () => null,
  script: () => null,
  iframe: () => null,
  object: () => null,
  embed: () => null,
};

/** Renders the LLM's Markdown-formatted optimization suggestions. */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-zinc-900 dark:prose-headings:text-white prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-li:text-zinc-600 dark:prose-li:text-zinc-300 prose-strong:text-zinc-900 dark:prose-strong:text-white prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-zinc-800 dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
