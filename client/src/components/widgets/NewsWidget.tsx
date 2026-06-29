import { useState, useEffect } from 'react';
import { Newspaper, Loader, ExternalLink, RefreshCw } from 'lucide-react';
import { widgetsApi } from '../../api/widgets';

interface NewsStory {
  id: string | number;
  title: string;
  url: string;
  source: string;
  time: string;
}

const FALLBACK_NEWS: NewsStory[] = [
  {
    id: 1,
    title: 'The Future of AI Agents in Developer Workflows',
    url: 'https://news.ycombinator.com',
    source: 'TechCrunch',
    time: '2h ago',
  },
  {
    id: 2,
    title: 'PostgreSQL 17 Beta Released: Focus on Query Performance',
    url: 'https://news.ycombinator.com',
    source: 'Hacker News',
    time: '4h ago',
  },
  {
    id: 3,
    title: 'Why Vite Became the Standard Frontend Toolchain',
    url: 'https://news.ycombinator.com',
    source: 'Dev.to',
    time: '6h ago',
  },
  {
    id: 4,
    title: 'Sleek Minimalist Typography in Modern Web Design',
    url: 'https://news.ycombinator.com',
    source: 'Medium',
    time: '8h ago',
  },
  {
    id: 5,
    title: 'Understanding JWT Token Rotation Best Practices',
    url: 'https://news.ycombinator.com',
    source: 'Auth0 Blog',
    time: '1d ago',
  },
];

export function NewsWidget() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveNews = async () => {
    try {
      const res = await widgetsApi.getNewsHeadlines();
      if (res.success && res.data) {
        setStories(res.data);
      } else {
        setStories(FALLBACK_NEWS);
      }
    } catch (error) {
      console.error('API fetch error, using fallbacks:', error);
      setStories(FALLBACK_NEWS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLiveNews();
  };

  return (
    <div className="flex h-[320px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-red-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Tech Headlines
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Refresh Feed"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stories list */}
      <div className="custom-scrollbar my-3 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="h-5 w-5 animate-spin text-red-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {stories.map((story) => (
              <a
                key={story.id}
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1 rounded-lg border border-slate-50 bg-slate-50/30 p-2.5 transition-all hover:border-red-100 hover:bg-red-50/10 dark:border-slate-900 dark:bg-slate-800/10 dark:hover:border-red-950/20 dark:hover:bg-red-950/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold leading-snug text-slate-700 dark:text-slate-350 group-hover:text-red-600 dark:group-hover:text-red-400 line-clamp-2">
                    {story.title}
                  </h4>
                  <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {story.source}
                  </span>
                  <span>•</span>
                  <span>{story.time}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-600 italic">
        Powered by Hacker News Live Feed API
      </div>
    </div>
  );
}

export default NewsWidget;
