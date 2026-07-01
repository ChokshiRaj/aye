import { useState, useEffect, useRef } from 'react';
import { widgetsApi } from '../../api/widgets';
import {
  FileText,
  Loader,
  CheckCircle2,
  CloudLightning,
  Eye,
  Edit2,
  Copy,
  Check,
  Trash2,
  Download,
} from 'lucide-react';

interface NotesWidgetProps {
  fullHeight?: boolean;
}

export function NotesWidget({ fullHeight = false }: NotesWidgetProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const isInitialMount = useRef(true);

  // Fetch Notes
  const fetchNotes = async () => {
    try {
      const res = await widgetsApi.getNote();
      if (res.success && res.data) {
        setContent(res.data.content);
      } else {
        setError(res.error || 'Failed to fetch notes.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Debounced Auto-save (resolves delayed saving issue)
  useEffect(() => {
    if (loading || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await widgetsApi.upsertNote(content);
        if (res.success) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [content, loading]);

  // Fallback Save on blur
  const handleBlur = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      const res = await widgetsApi.upsertNote(content);
      if (res.success) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your scratchpad? This action cannot be undone.')) {
      setContent('');
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `aye-scratchpad-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Basic inline markdown parser helper
  const parseInlineMarkdown = (text: string) => {
    const parts = [];
    let currentText = text;
    let keyIndex = 0;

    while (currentText.length > 0) {
      const boldMatch = currentText.match(/\*\*(.*?)\*\*/);
      const codeMatch = currentText.match(/`(.*?)`/);

      if (!boldMatch && !codeMatch) {
        parts.push(currentText);
        break;
      }

      const boldIndex = boldMatch ? currentText.indexOf(boldMatch[0]) : Infinity;
      const codeIndex = codeMatch ? currentText.indexOf(codeMatch[0]) : Infinity;

      if (boldIndex < codeIndex) {
        if (boldIndex > 0) {
          parts.push(currentText.substring(0, boldIndex));
        }
        parts.push(<strong key={keyIndex++} className="font-extrabold text-slate-950 dark:text-white">{boldMatch![1]}</strong>);
        currentText = currentText.substring(boldIndex + boldMatch![0].length);
      } else {
        if (codeIndex > 0) {
          parts.push(currentText.substring(0, codeIndex));
        }
        parts.push(<code key={keyIndex++} className="px-1.5 py-0.5 rounded bg-slate-100 text-red-655 dark:bg-slate-800/80 dark:text-red-400 font-mono text-[11px]">{codeMatch![1]}</code>);
        currentText = currentText.substring(codeIndex + codeMatch![0].length);
      }
    }

    return parts;
  };

  // Render markdown blocks
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="flex h-full items-center justify-center text-xs italic text-slate-450 dark:text-slate-550">
          Nothing to preview yet. Start typing in Write mode!
        </div>
      );
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm text-slate-800 dark:text-slate-200 overflow-y-auto h-full pr-1 custom-scrollbar">
        {lines.map((line, i) => {
          if (line.startsWith('# ')) {
            return <h1 key={i} className="text-base font-black text-slate-955 dark:text-white mt-4 border-b border-slate-100 pb-1 dark:border-slate-800/80">{line.substring(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={i} className="text-sm font-black text-slate-955 dark:text-white mt-3">{line.substring(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={i} className="text-xs font-bold text-slate-955 dark:text-white mt-2">{line.substring(4)}</h3>;
          }
          
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <ul key={i} className="list-disc pl-5 my-0.5">
                <li>{parseInlineMarkdown(line.substring(2))}</li>
              </ul>
            );
          }

          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <ol key={i} className="list-decimal pl-5 my-0.5">
                <li>{parseInlineMarkdown(numMatch[2])}</li>
              </ol>
            );
          }

          if (!line.trim()) {
            return <div key={i} className="h-2" />;
          }

          return <p key={i} className="leading-relaxed text-xs">{parseInlineMarkdown(line)}</p>;
        })}
      </div>
    );
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111] ${
      fullHeight ? 'h-full flex-1' : 'h-[280px]'
    }`}>
      {/* Header */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 dark:border-[#1f1f1f] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Scratchpad & Notes
          </span>
        </div>

        {/* Controls, Modes & Save status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Toggles */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/50 p-0.5 dark:border-slate-800 dark:bg-[#0d0d0d]">
            <button
              onClick={() => setActiveMode('edit')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                activeMode === 'edit'
                  ? 'bg-gradient-to-r from-red-500 to-red-655 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Edit2 className="h-3 w-3" /> Write
            </button>
            <button
              onClick={() => setActiveMode('preview')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                activeMode === 'preview'
                  ? 'bg-gradient-to-r from-red-500 to-red-655 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
          </div>

          {/* Action buttons (only in Edit mode and when not empty) */}
          {activeMode === 'edit' && content.trim().length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-655 dark:text-slate-550 dark:hover:bg-slate-800/80 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-655 dark:text-slate-550 dark:hover:bg-slate-800/80 transition-colors"
                title="Download as Markdown"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-555 dark:hover:bg-red-950/20 transition-colors"
                title="Clear scratchpad"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Save Status Indicators */}
          <div className="text-[9px] font-extrabold text-slate-400 dark:text-slate-550 flex items-center gap-1 shrink-0">
            {saveStatus === 'saving' && (
              <>
                <Loader className="h-3 w-3 animate-spin text-red-500" />
                <span className="text-red-500 uppercase">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 uppercase">Saved to Cloud</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <CloudLightning className="h-3 w-3 text-red-500 animate-bounce" />
                <span className="text-red-550 uppercase">Save Failed</span>
              </>
            )}
            {saveStatus === 'idle' && <span className="uppercase">Auto-Saved</span>}
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div className="my-3 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="h-5 w-5 animate-spin text-red-500" />
          </div>
        ) : error ? (
          <div className="py-6 text-center text-xs text-red-500">{error}</div>
        ) : activeMode === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            placeholder="Type your notes here... Markdown format is supported! Jot down random thoughts, code snippets, or task logs."
            className="h-full w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-0 dark:text-slate-250 dark:placeholder-slate-500 custom-scrollbar"
          />
        ) : (
          renderMarkdown(content)
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#1f1f1f] text-[9px] font-bold text-slate-400 dark:text-slate-650 sm:flex-row sm:justify-between">
        <div>
          {wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'} &nbsp;•&nbsp; {charCount} {charCount === 1 ? 'CHARACTER' : 'CHARACTERS'}
        </div>
        <div className="uppercase">
          Notes are encrypted and isolated per user session.
        </div>
      </div>
    </div>
  );
}

export default NotesWidget;
