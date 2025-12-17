import { useState, useEffect, useRef } from "react";
import dynamic from "react-router/dynamic";
import type { Editor as EditorType } from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";

// Dynamic import to avoid SSR issues
const Editor = dynamic(
  () => import("react-markdown-editor-lite"),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const editorRef = useRef<EditorType>(null);

  const handleEditorChange = ({ text }: { text: string; html: string }) => {
    onChange(text);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        ref={editorRef}
        value={value}
        style={{ height: "500px" }}
        onChange={handleEditorChange}
        renderHTML={(text) => {
          // Use a simple markdown parser or return empty for now
          // You can integrate a markdown parser here if needed
          return text;
        }}
        placeholder={placeholder || "마크다운 형식으로 작성하세요..."}
        config={{
          view: {
            menu: true,
            md: true,
            html: true,
          },
          canView: {
            menu: true,
            md: true,
            html: true,
            fullScreen: true,
            hideMenu: false,
          },
        }}
      />
    </div>
  );
}

