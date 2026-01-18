import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

interface RichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

const RichTextToolbar = ({ textareaRef, value, onChange }: RichTextToolbarProps) => {
  const insertText = (beforeText: string, afterText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    // If text is selected, wrap it; otherwise, insert the tags at cursor
    const newText = before + beforeText + selectedText + afterText + after;
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const selectedLength = selectedText ? selectedText.length : 0;
      const newCursorPos = start + beforeText.length + selectedLength + afterText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => {
    insertText('<strong>', '</strong>');
  };

  const handleItalic = () => {
    insertText('<em>', '</em>');
  };

  const handleUnderline = () => {
    insertText('<u>', '</u>');
  };

  const handleBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    // If text is selected, convert each line to a list item
    if (selectedText) {
      const lines = selectedText.split('\n').filter(line => line.trim());
      const listItems = lines.map(line => `  <li>${line.trim()}</li>`).join('\n');
      const newText = before + '<ul>\n' + listItems + '\n</ul>' + after;
      onChange(newText);
    } else {
      // Insert a single list item
      const newText = before + '<ul>\n  <li>Item</li>\n</ul>' + after;
      onChange(newText);
    }

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + '<ul>\n  <li>'.length + (selectedText || 'Item').length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    // If text is selected, convert each line to a list item
    if (selectedText) {
      const lines = selectedText.split('\n').filter(line => line.trim());
      const listItems = lines.map(line => `  <li>${line.trim()}</li>`).join('\n');
      const newText = before + '<ol>\n' + listItems + '\n</ol>' + after;
      onChange(newText);
    } else {
      // Insert a single list item
      const newText = before + '<ol>\n  <li>Item</li>\n</ol>' + after;
      onChange(newText);
    }

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + '<ol>\n  <li>'.length + (selectedText || 'Item').length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
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
  );
};

export default RichTextToolbar;

