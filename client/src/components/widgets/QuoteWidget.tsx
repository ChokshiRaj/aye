import { Quote } from 'lucide-react';

const QUOTES = [
  { text: 'Act only according to that maxim whereby you can at the same time will that it should become a universal law.', author: 'Immanuel Kant' },
  { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates' },
  { text: 'What is rational is real; and what is real is rational.', author: 'G.W.F. Hegel' },
  { text: 'God is dead. God remains dead. And we have killed him.', author: 'Friedrich Nietzsche' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'Life must be understood backward. But it must be lived forward.', author: 'Søren Kierkegaard' },
  { text: 'He who has a why to live for can bear almost any how.', author: 'Friedrich Nietzsche' },
  { text: 'The unexamined life is not worth living.', author: 'Socrates' },
  { text: 'There is only one good, knowledge, and one evil, ignorance.', author: 'Socrates' },
  { text: 'Entities should not be multiplied unnecessarily.', author: 'William of Ockham' },
  { text: 'I think therefore I am.', author: 'René Descartes' },
  { text: 'We live in the best of all possible worlds.', author: 'Gottfried Wilhelm Leibniz' },
  { text: 'Man is born free, and everywhere he is in chains.', author: 'Jean-Jacques Rousseau' },
  { text: 'If you would be a real seeker after truth, it is necessary that at least once in your life you doubt, as far as possible, all things.', author: 'René Descartes' },
  { text: 'Happiness is not an ideal of reason, but of imagination.', author: 'Immanuel Kant' },
  { text: 'The mind is furnished with ideas by experience alone.', author: 'John Locke' },
  { text: 'The life of man is solitary, poor, nasty, brutish, and short.', author: 'Thomas Hobbes' },
  { text: 'Virtue is nothing else than right reason.', author: 'Seneca' },
  { text: 'It is not death that a man should fear, but he should fear never beginning to live.', author: 'Marcus Aurelius' },
  { text: 'You have power over your mind - not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { text: 'The secret of happiness, you see, is not found in seeking more, but in developing the capacity to enjoy less.', author: 'Socrates' },
  { text: 'Freedom is secured not by the fulfilling of men\'s desires, but by the removal of desire.', author: 'Epictetus' },
  { text: 'No man is free who is not master of himself.', author: 'Epictetus' },
  { text: 'If you want to improve, be content to be thought foolish and stupid.', author: 'Epictetus' },
  { text: 'Time is a created thing. To say "I don\'t have time," is like saying, "I don\'t want to."', author: 'Lao Tzu' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'The flame that burns Twice as bright burns half as long.', author: 'Lao Tzu' },
  { text: 'Knowing others is intelligence; knowing yourself is true wisdom.', author: 'Lao Tzu' },
  { text: 'Be content with what you have; rejoice in the way things are. When you realize there is nothing lacking, the whole world belongs to you.', author: 'Lao Tzu' },
  { text: 'To see a world in a grain of sand and a heaven in a wild flower, hold infinity in the palm of your hand and eternity in an hour.', author: 'William Blake' },
];

export function QuoteWidget() {
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const dayOfYear = getDayOfYear();
  const quote = QUOTES[dayOfYear % QUOTES.length];

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#1f1f1f]">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-550">
          Daily Reflection
        </span>
        <Quote className="h-4 w-4 text-red-500 transform rotate-180" />
      </div>

      <div className="my-auto py-2">
        <p className="text-xs italic font-medium leading-relaxed text-slate-700 dark:text-slate-300">
          "{quote.text}"
        </p>
      </div>

      <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-550">
        — {quote.author}
      </div>
    </div>
  );
}

export default QuoteWidget;
