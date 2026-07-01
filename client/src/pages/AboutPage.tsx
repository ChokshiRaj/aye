import { Link } from 'react-router-dom';
import { ArrowLeft, Github, Cpu, BookOpen, Heart, Shield, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 pb-8 pt-0 md:px-8 text-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100 flex flex-col justify-between">
      {/* Container */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-start pt-6 md:pt-8 pb-6">

        {/* Header Controls */}
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Link to="/login" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>
        </div>

        {/* Hero Banner */}
        <div className="text-center md:text-left mb-10 animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            AYE
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            A personal dashboard I built for myself — habits, notes, market rates, and a few other daily things, all in one place. It's private, single-user, and something I actively use every day.
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">

          {/* Left Column: Why & Engineering Stack */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#111111]/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-red-500" />
                Why I Built This
              </h2>
              <p className="text-slate-650 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                I'm a student learning full-stack development, and I was tired of switching between five different apps just to check my habits, jot a note, or look at gold rates. So I built one place for all of it. It's for me, not for the public — there's no sign-up, and I built and maintain it myself.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#111111]/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Cpu className="h-4 w-4 text-red-500" />
                Built With
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-650 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>React 18 & Vite</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Node.js & Express</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Prisma ORM</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>PostgreSQL (Neon)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span>Vercel & Render</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Features & Security Design */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#111111]/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-red-500" />
                What's Inside
              </h2>
              <ul className="space-y-3 text-xs md:text-sm text-slate-650 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>Everyday widgets:</strong> Todo list, HackerNews feed, weather, Pomodoro timer, and quick bookmarks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>Habit tracking:</strong> A weekly checklist plus a heatmap to see streaks over the year.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>Notes with Markdown:</strong> Auto-saves as you type, with a live preview.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  <span><strong>Markets:</strong> Indian stock indices, gold/silver rates, forex, and crypto prices.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#111111]/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-red-500" />
                Security
              </h2>
              <p className="text-slate-650 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                There's no public sign-up, so the only login is mine. Passwords are hashed with bcrypt, sessions use secure HttpOnly cookies, and every API route checks the request is authenticated before doing anything. I've also added 2FA support and automated dependency scanning to keep things patched.
              </p>
            </div>
          </div>
        </div>

        {/* Developer Info & CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200 dark:border-slate-800/60 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Built By</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Raj Chokshi</p>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/ChokshiRaj/aye" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-slate-800/40 dark:hover:bg-slate-800/70 dark:border-slate-800/60 px-4 py-2 rounded-lg transition-all active:scale-[0.98]">
              <Github className="h-4 w-4" /> GitHub Repo
            </a>
            <Link to="/login" className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg transition-all active:scale-[0.98]">
              Sign In <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="text-center py-4 text-[10px] text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} AYE. Built by Raj Chokshi.
      </div>
    </div>
  );
}