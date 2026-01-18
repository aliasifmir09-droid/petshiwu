import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    
    // Get pasted HTML or plain text
    const pastedHtml = clipboardData.getData('text/html');
    const pastedText = clipboardData.getData('text/plain');

    if (pastedHtml) {
      // Insert HTML directly to preserve formatting
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        // Create a temporary div to hold the pasted HTML
        const tempDiv = document.createElement('div');
        // Clean up the HTML (remove scripts, styles that could be malicious) before setting innerHTML
        tempDiv.innerHTML = cleanPastedHtml(pastedHtml);
        
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        range.insertNode(fragment);
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // No selection, append to end
        if (editorRef.current) {
          const cleanHtml = cleanPastedHtml(pastedHtml);
          editorRef.current.innerHTML += cleanHtml;
        }
      }
    } else if (pastedText) {
      // Plain text fallback
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const textNode = document.createTextNode(pastedText);
        range.insertNode(textNode);
        
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Trigger onChange
    handleInput();
  };

  // Clean pasted HTML - remove dangerous elements but keep formatting
  const cleanPastedHtml = (html: string): string => {
    // Remove script tags and event handlers
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ''); // Remove iframes
    
    // Preserve style attributes (DOMPurify will sanitize them on the frontend)
    // We'll keep them here for exact formatting preservation
    
    return cleaned;
  };

  const handleBold = () => {
    document.execCommand('bold', false);
    editorRef.current?.focus();
    handleInput();
  };

  const handleItalic = () => {
    document.execCommand('italic', false);
    editorRef.current?.focus();
    handleInput();
  };

  const handleUnderline = () => {
    document.execCommand('underline', false);
    editorRef.current?.focus();
    handleInput();
  };

  const handleBulletList = () => {
    document.execCommand('insertUnorderedList', false);
    editorRef.current?.focus();
    handleInput();
  };

  const handleNumberedList = () => {
    document.execCommand('insertOrderedList', false);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
        <button
          type="button"
          onClick={handleBold}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold size={18} className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic size={18} className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={handleUnderline}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Underline"
        >
          <Underline size={18} className="text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={handleBulletList}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <List size={18} className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={handleNumberedList}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={18} className="text-gray-700" />
        </button>
      </div>

      {/* ContentEditable Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full min-h-[400px] px-4 py-2 border-0 focus:outline-none resize-y overflow-y-auto prose prose-sm max-w-none"
        style={{
          outline: 'none',
          whiteSpace: 'pre-wrap'
        }}
        data-placeholder="Blog content - paste formatted text from other websites here..."
        suppressContentEditableWarning={true}
      />
      
      {/* Placeholder styling */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

