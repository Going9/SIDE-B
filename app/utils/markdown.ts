import { marked } from "marked";

// Configure marked options
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // Disable header IDs for cleaner HTML
  mangle: false, // Don't mangle email addresses
});

/**
 * Convert markdown to HTML using marked library
 * @param markdown - Markdown string to convert
 * @returns HTML string
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  try {
    // Use marked to convert markdown to HTML
    // marked.parse() returns a string synchronously
    const html = marked.parse(markdown) as string;
    return html;
  } catch (error) {
    console.error("Error parsing markdown:", error);
    // Fallback: return escaped HTML
    return markdown.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
