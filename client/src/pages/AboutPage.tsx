import { Link } from 'react-router-dom';
import { ArrowLeft, Github, Cpu, Sparkles, BookOpen, Heart, Shield, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col justify-between px-4 py-8 md:px-8">
      {/* Container */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center py-10">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Link to="/login" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 animate-pulse" /> Project Info
          </span>
        </div>

        {/* Hero Banner */}
        <div className="text-center md:text-left mb-12 animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AYE Command Centre
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
            A private, high-performance personal cockpit designed for daily clarity, productivity, and absolute privacy. Built as a specialized learning project and a highly integrated daily workspace.
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          
          {/* Left Column: Why & Engineering Stack */}
          <div className="space-y-6">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-red-500" />
                Why I Built AYE
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                As a developer, I wanted to build a single, unified dashboard that aggregates my habits, calendar, events, scratchpads, and financial indices without leaking data to third-party ad networks or tracking scripts. AYE is built to be self-hosted, secure, and entirely under the owner's control.
              </p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-4">
                <Cpu className="h-4 w-4 text-red-500" />
                Engineering Stack
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>React 18 & Vite</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>Node.js & Express</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>Prisma ORM</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>PostgreSQL (Neon)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>Vercel & Render</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Features & Security Design */}
          <div className="space-y-6">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-red-500" />
                Key Highlights
              </h2>
              <ul className="space-y-3 text-xs md:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>12 Integrated Widgets:</strong> Todo lists, HackerNews, weather cards, Pomodoro timers, and quick bookmarks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>Interactive Habits:</strong> 7-day responsive checkbox grid paired with a 365-day consistency heatmap.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>Markdown Scratchpad:</strong> In-memory note-taking widget with instant tabbed rendering and debounced saves.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>Live Markets Center:</strong> Real-time Indian indices, gold/silver commodity quotes, forex rates, and crypto tracking.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-red-500" />
                Built-in Privacy
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Engineered for personal sovereignty. AYE uses a seed-only model (no open signup) to eliminate user account sprawl. Session tokens are protected using secure cookies, and all API paths require strict JWT verification to secure your database dashboard records.
              </p>
            </div>
          </div>
        </div>

        {/* Developer Info & CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-850/60 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Developed By</p>
            <p className="text-sm font-bold text-white mt-0.5">Raj Chokshi</p>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/ChokshiRaj/aye" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800/70 px-4 py-2 rounded-lg border border-slate-800/60 transition-all active:scale-[0.98]">
              <Github className="h-4 w-4" /> GitHub Repo
            </a>
            <Link to="/login" className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-all active:scale-[0.98]">
              Sign In <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="text-center py-4 text-[10px] text-slate-500">
        &copy; {new Date().getFullYear()} AYE Command Centre. All rights reserved.
      </div>
    </div>
  );
}
