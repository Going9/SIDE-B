/**
 * Simple markdown to HTML converter
 * Converts markdown syntax to HTML for rendering
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Headers (must be processed before other formatting)
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

  // Images - must be processed before links
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/gim,
    '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/gim,
    '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto"><code>$1</code></pre>');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');

  // Line breaks
  html = html.replace(/\n\n/gim, "</p><p>");
  html = html.replace(/\n/gim, "<br />");

  // Lists
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^\+ (.*$)/gim, "<li>$1</li>");

  // Wrap list items in ul tags
  html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");

  // Wrap in paragraph if not already wrapped
  if (!html.trim().startsWith("<")) {
    html = "<p>" + html + "</p>";
  }

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/gim, "");
  html = html.replace(/<p><br \/><\/p>/gim, "");

  return html;
}

