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

        // Create a temporary div to hold and clean the pasted HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanPastedHtml(pastedHtml);
        
        // Move all nodes to a fragment
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        // Insert the fragment
        range.insertNode(fragment);
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // No selection, append to end
        if (editorRef.current) {
          const cleanHtml = cleanPastedHtml(pastedHtml);
          // Create a temp div to parse and append nodes properly
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cleanHtml;
          
          while (tempDiv.firstChild) {
            editorRef.current.appendChild(tempDiv.firstChild);
          }
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
    // Create a temporary div to parse and clean the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove dangerous elements first
    const dangerousElements = tempDiv.querySelectorAll('script, iframe, object, embed, form, input, button');
    dangerousElements.forEach(el => el.remove());
    
    // Remove dangerous attributes
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove event handlers
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || attr.name === 'javascript' || attr.name === 'onclick') {
          el.removeAttribute(attr.name);
        }
      });
      
      // Convert Word-specific elements to standard HTML
      const tagName = el.tagName.toLowerCase();
      
      // Handle Word paragraph styles
      if (tagName === 'p') {
        const classAttr = el.getAttribute('class') || '';
        const styleAttr = el.getAttribute('style') || '';
        
        // Convert Word heading styles to actual headings
        if (classAttr.match(/Heading[1-6]/i) || classAttr.match(/MsoHeading/i)) {
          const headingMatch = classAttr.match(/Heading(\d)/i);
          const headingLevel = headingMatch ? Math.min(parseInt(headingMatch[1]), 6) : 2;
          
          // Convert to heading
          const heading = document.createElement(`h${headingLevel}`);
          heading.innerHTML = el.innerHTML;
          el.parentNode?.replaceChild(heading, el);
        } else if ((styleAttr.includes('font-weight:700') || styleAttr.includes('font-weight:bold')) && styleAttr.includes('font-size')) {
          const fontSize = styleAttr.match(/font-size:\s*(\d+)/)?.[1];
          const fontWeight = styleAttr.match(/font-weight:\s*(\d+)/)?.[1] || '400';
          
          // Only convert if it's clearly a heading (large font + bold)
          if (parseInt(fontWeight) >= 700 && fontSize && parseInt(fontSize) >= 16) {
            let headingLevel = 2;
            if (parseInt(fontSize) >= 24) headingLevel = 1;
            else if (parseInt(fontSize) >= 20) headingLevel = 2;
            else if (parseInt(fontSize) >= 18) headingLevel = 3;
            else headingLevel = 4;
            
            const heading = document.createElement(`h${headingLevel}`);
            heading.innerHTML = el.innerHTML;
            el.parentNode?.replaceChild(heading, el);
          }
        }
      }
      
      // Convert Word list items to proper HTML lists
      if (tagName === 'li') {
        const parent = el.parentElement;
        if (parent && !['ul', 'ol'].includes(parent.tagName.toLowerCase())) {
          // Parent is not a list, create one
          const list = document.createElement('ul');
          parent.insertBefore(list, el);
          list.appendChild(el);
        }
      }
      
      // Clean up Word-specific classes and styles but keep formatting
      if (classAttr.includes('Mso')) {
        // Keep Mso classes that indicate formatting but remove others
        if (!classAttr.includes('MsoList') && !classAttr.includes('MsoNormal')) {
          el.removeAttribute('class');
        }
      }
    });
    
    // Convert Word lists (MsoListParagraph) to proper HTML lists
    const listParagraphs = tempDiv.querySelectorAll('.MsoListParagraph, [class*="ListParagraph"]');
    listParagraphs.forEach(para => {
      const text = para.textContent || '';
      if (text.trim().match(/^[•·▪▫\-\*]\s/) || text.trim().match(/^\d+[\.\)]\s/)) {
        const isOrdered = text.trim().match(/^\d+[\.\)]\s/);
        const list = document.createElement(isOrdered ? 'ol' : 'ul');
        const li = document.createElement('li');
        li.innerHTML = para.innerHTML.replace(/^[•·▪▫\-\*\d+[\.\)]\s*/, '');
        list.appendChild(li);
        para.parentNode?.replaceChild(list, para);
      }
    });
    
    // Normalize lists - ensure li elements are inside ul/ol
    const orphanLis = tempDiv.querySelectorAll('li:not(ul > li, ol > li)');
    orphanLis.forEach(li => {
      const ul = document.createElement('ul');
      li.parentNode?.insertBefore(ul, li);
      ul.appendChild(li);
    });
    
    // Clean up empty elements
    const emptyElements = tempDiv.querySelectorAll('p:empty, div:empty, span:empty');
    emptyElements.forEach(el => el.remove());
    
    // Get cleaned HTML
    let cleaned = tempDiv.innerHTML;
    
    // Remove any remaining dangerous content
    cleaned = cleaned
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    
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
          whiteSpace: 'normal'
        }}
        data-placeholder="Blog content - paste formatted text from Word, websites, or other sources here..."
        suppressContentEditableWarning={true}
      />
      
      {/* Editor content styling */}
      <style>{`
        [contenteditable].prose {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        [contenteditable].prose h1,
        [contenteditable].prose h2,
        [contenteditable].prose h3,
        [contenteditable].prose h4,
        [contenteditable].prose h5,
        [contenteditable].prose h6 {
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          display: block;
        }
        [contenteditable].prose h1 { font-size: 2rem; }
        [contenteditable].prose h2 { font-size: 1.75rem; }
        [contenteditable].prose h3 { font-size: 1.5rem; }
        [contenteditable].prose h4 { font-size: 1.25rem; }
        [contenteditable].prose h5 { font-size: 1.125rem; }
        [contenteditable].prose h6 { font-size: 1rem; }
        [contenteditable].prose p {
          margin-bottom: 1rem;
          display: block;
        }
        [contenteditable].prose ul,
        [contenteditable].prose ol {
          margin: 1rem 0;
          padding-left: 2rem;
          display: block;
        }
        [contenteditable].prose li {
          display: list-item;
          margin-bottom: 0.5rem;
        }
        [contenteditable].prose ul {
          list-style-type: disc;
        }
        [contenteditable].prose ol {
          list-style-type: decimal;
        }
        [contenteditable].prose strong,
        [contenteditable].prose b {
          font-weight: 700;
        }
        [contenteditable].prose em,
        [contenteditable].prose i {
          font-style: italic;
        }
        [contenteditable].prose u {
          text-decoration: underline;
        }
      `}</style>
      
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

