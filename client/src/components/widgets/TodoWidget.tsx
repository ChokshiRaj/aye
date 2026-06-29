import { useState, useEffect, FormEvent } from 'react';
import { widgetsApi } from '../../api/widgets';
import { Todo } from '../../types';
import { CheckSquare, Square, Trash2, Plus, Loader, ListTodo } from 'lucide-react';

export function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTodos = async () => {
    try {
      const res = await widgetsApi.getTodos();
      if (res.success && res.data) {
        setTodos(res.data);
      } else {
        setError(res.error || 'Failed to load todos');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e: FormEvent) => {
    e.preventDefault();
    const text = newTodoText.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      const res = await widgetsApi.createTodo(text);
      if (res.success && res.data) {
        setTodos([res.data, ...todos]);
        setNewTodoText('');
      } else {
        setError(res.error || 'Failed to create todo');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating todo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTodo = async (id: string, done: boolean) => {
    try {
      // Optimistic update
      setTodos(
        todos.map((todo) => (todo.id === id ? { ...todo, done: !done } : todo))
      );
      
      const res = await widgetsApi.updateTodo(id, { done: !done });
      if (!res.success) {
        // Rollback on failure
        setTodos(
          todos.map((todo) => (todo.id === id ? { ...todo, done } : todo))
        );
        setError(res.error || 'Failed to update todo');
      }
    } catch (err: any) {
      // Rollback
      setTodos(
        todos.map((todo) => (todo.id === id ? { ...todo, done } : todo))
      );
      setError(err.message || 'Error updating todo');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const originalTodos = [...todos];
      // Optimistic update
      setTodos(todos.filter((todo) => todo.id !== id));

      const res = await widgetsApi.deleteTodo(id);
      if (!res.success) {
        setTodos(originalTodos);
        setError(res.error || 'Failed to delete todo');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting todo');
    }
  };

  const activeCount = todos.filter((t) => !t.done).length;
  const completedCount = todos.filter((t) => t.done).length;

  return (
    <div className="flex h-[320px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-red-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Tasks List
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550">
          {activeCount} active | {completedCount} done
        </span>
      </div>

      {/* Todo List Content */}
      <div className="custom-scrollbar my-3 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="h-5 w-5 animate-spin text-red-500" />
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-xs text-red-500">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchTodos();
              }}
              className="mt-2 text-[10px] text-red-500 underline"
            >
              Retry
            </button>
          </div>
        ) : todos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">All caught up!</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">Add a task below</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="group flex items-center justify-between rounded-lg border border-slate-50 bg-slate-50/50 p-2 transition-all hover:border-slate-100 hover:bg-slate-50 dark:border-[#1f1f1f] dark:bg-[#111111] dark:hover:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <div className="flex flex-1 items-center gap-2">
                  <button
                    onClick={() => handleToggleTodo(todo.id, todo.done)}
                    className="text-slate-400 hover:text-red-500 dark:text-slate-550 dark:hover:text-red-400"
                  >
                    {todo.done ? (
                      <CheckSquare className="h-4.5 w-4.5 text-red-500" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                  <span
                    className={`text-xs text-slate-700 dark:text-slate-300 line-clamp-2 ${
                      todo.done ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {todo.text}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleAddTodo} className="flex gap-1.5 border-t border-slate-100 pt-3 dark:border-[#1f1f1f]">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
          placeholder="Add new task..."
          maxLength={100}
        />
        <button
          type="submit"
          disabled={!newTodoText.trim() || submitting}
          className="rounded-lg bg-red-600 p-1.5 text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default TodoWidget;
