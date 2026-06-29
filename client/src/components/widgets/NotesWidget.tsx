import { useState, useEffect, useRef } from 'react';
import { widgetsApi } from '../../api/widgets';
import { FileText, Loader, CheckCircle2, CloudLightning } from 'lucide-react';

interface NotesWidgetProps {
  fullHeight?: boolean;
}

export function NotesWidget({ fullHeight = false }: NotesWidgetProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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

  // Save notes to server on blur
  const handleBlur = async () => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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

  return (
    <div className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111] ${
      fullHeight ? 'h-full flex-1' : 'h-[280px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Scratchpad & Notes
          </span>
        </div>
        
        {/* Save Status indicators */}
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-550 flex items-center gap-1">
          {saveStatus === 'saving' && (
            <>
              <Loader className="h-3 w-3 animate-spin text-red-500" />
              <span className="text-red-500">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">Saved to cloud</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <CloudLightning className="h-3 w-3 text-red-500 animate-bounce" />
              <span className="text-red-550">Save failed</span>
            </>
          )}
          {saveStatus === 'idle' && <span>Auto-saves on blur</span>}
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
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            placeholder="Type your notes here... Markdown format is supported! Jot down random thoughts, code snippets, or task logs."
            className="h-full w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-0 dark:text-slate-250 dark:placeholder-slate-500 custom-scrollbar"
          />
        )}
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-650">
        Notes are encrypted and isolated per user session.
      </div>
    </div>
  );
}

export default NotesWidget;
