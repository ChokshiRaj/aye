import { useState, useEffect, FormEvent } from 'react';
import { widgetsApi } from '../../api/widgets';
import { Bookmark as BookmarkType } from '../../types';
import {
  Bookmark,
  Trash2,
  Edit2,
  Loader,
  Globe,
  Github,
  Mail,
  BookOpen,
  Code,
  Music,
  Video,
  ExternalLink,
  Search,
} from 'lucide-react';

export function BookmarksWidget() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('Globe');

  const fetchBookmarks = async () => {
    try {
      const res = await widgetsApi.getBookmarks();
      if (res.success && res.data) {
        setBookmarks(res.data);
      } else {
        setError(res.error || 'Failed to load bookmarks');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleSubmitBookmark = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    // Auto prepend https if missing
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      if (editingBookmark) {
        // Edit mode
        const res = await widgetsApi.updateBookmark(editingBookmark.id, { name, url: targetUrl, icon });
        if (res.success && res.data) {
          setBookmarks(bookmarks.map((b) => (b.id === editingBookmark.id ? res.data! : b)));
          setEditingBookmark(null);
          setName('');
          setUrl('');
          setIcon('Globe');
          setIsAdding(false);
        } else {
          setError(res.error || 'Failed to update bookmark');
        }
      } else {
        // Add mode
        const res = await widgetsApi.createBookmark({ name, url: targetUrl, icon });
        if (res.success && res.data) {
          setBookmarks([res.data, ...bookmarks]);
          setName('');
          setUrl('');
          setIcon('Globe');
          setIsAdding(false);
        } else {
          setError(res.error || 'Failed to add bookmark');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error saving bookmark');
    }
  };

  const handleStartEdit = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setName(bookmark.name);
    setUrl(bookmark.url);
    setIcon(bookmark.icon || 'Globe');
    setIsAdding(true);
  };

  const handleToggleView = () => {
    if (isAdding) {
      setIsAdding(false);
      setEditingBookmark(null);
      setName('');
      setUrl('');
      setIcon('Globe');
    } else {
      setIsAdding(true);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;
    try {
      const original = [...bookmarks];
      setBookmarks(bookmarks.filter((b) => b.id !== id));

      const res = await widgetsApi.deleteBookmark(id);
      if (!res.success) {
        setBookmarks(original);
        setError(res.error || 'Failed to remove bookmark');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting bookmark');
    }
  };

  // Resolve Lucide icons by name string
  const renderIcon = (iconName: string | null) => {
    const props = { className: 'h-4 w-4 text-red-500' };
    switch (iconName) {
      case 'Github':
        return <Github {...props} />;
      case 'Search':
        return <Search {...props} />;
      case 'Mail':
        return <Mail {...props} />;
      case 'Book':
      case 'BookOpen':
        return <BookOpen {...props} />;
      case 'Code':
        return <Code {...props} />;
      case 'Music':
        return <Music {...props} />;
      case 'Video':
        return <Video {...props} />;
      case 'Globe':
      default:
        return <Globe {...props} />;
    }
  };

  const iconOptions = ['Globe', 'Github', 'Search', 'Mail', 'BookOpen', 'Code', 'Music', 'Video'];

  return (
    <div className="flex h-[240px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-1.5">
          <Bookmark className="h-4 w-4 text-red-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Bookmarks
          </span>
        </div>
        <button
          onClick={handleToggleView}
          className="rounded-lg bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
        >
          {isAdding ? 'View All' : 'Add Link'}
        </button>
      </div>

      {/* Content Area */}
      <div className="custom-scrollbar my-2 flex-1 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="h-5 w-5 animate-spin text-red-500" />
          </div>
        ) : error ? (
          <div className="py-2 text-center text-xs text-red-500">{error}</div>
        ) : isAdding ? (
          // Add/Edit Bookmark Form
          <form onSubmit={handleSubmitBookmark} className="space-y-2 mt-1">
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-1/2 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
              />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URL (e.g. google.com)"
                className="w-1/2 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Icon:</span>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1 text-[10px] text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
                >
                  {iconOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1.5">
                {editingBookmark && (
                  <button
                    type="button"
                    onClick={handleToggleView}
                    className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                >
                  {editingBookmark ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        ) : bookmarks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-4">
            <p className="text-xs text-slate-400">No bookmarks saved yet</p>
          </div>
        ) : (
          // Bookmarks Grid
          <div className="grid grid-cols-2 gap-2 mt-1">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group flex items-center justify-between rounded-lg border border-slate-50 bg-slate-50/50 p-2 hover:border-red-100 hover:bg-red-50/10 dark:border-slate-800/40 dark:bg-slate-800/10 dark:hover:border-red-950/20 dark:hover:bg-red-950/10"
              >
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 overflow-hidden flex-1"
                >
                  {renderIcon(bookmark.icon)}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate group-hover:text-red-600 dark:group-hover:text-red-400">
                    {bookmark.name}
                  </span>
                </a>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(bookmark)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    title="Edit Bookmark"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-450 dark:text-slate-600 flex items-center gap-1">
        <ExternalLink className="h-3 w-3" />
        <span>Links open in a new tab</span>
      </div>
    </div>
  );
}

export default BookmarksWidget;
