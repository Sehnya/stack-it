import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const reactPost = {
  title: "Building an Animated Task Manager with React, Framer Motion & Tailwind",
  excerpt: "Create a beautiful, interactive task manager app with smooth animations, drag-and-drop, and a modern glassmorphism UI design.",
  coverImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=800&fit=crop",
  technologies: JSON.stringify(["React", "TypeScript", "Tailwind CSS", "Framer Motion"]),
  content: `
<div class="prose prose-lg max-w-none">

<p class="text-xl text-gray-600 leading-relaxed mb-8">
Let's build a stunning <strong>animated task manager</strong> using <span class="text-blue-600 font-semibold">React</span>, <span class="text-purple-600 font-semibold">Framer Motion</span>, and <span class="text-cyan-600 font-semibold">Tailwind CSS</span>. This project showcases modern UI patterns with smooth micro-interactions that make your app feel alive.
</p>

<div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-8">
  <h4 class="text-blue-800 font-bold text-lg mb-2">✨ What You'll Build</h4>
  <ul class="text-blue-900 space-y-2">
    <li><strong>Glassmorphism UI</strong> - Modern frosted glass effect cards</li>
    <li><strong>Smooth Animations</strong> - Spring physics for natural motion</li>
    <li><strong>Interactive States</strong> - Hover, focus, and completion effects</li>
    <li><strong>Responsive Design</strong> - Works beautifully on all devices</li>
  </ul>
</div>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">1</span>
  Project Structure
</h2>

<p class="mb-4">Our app is organized into clean, reusable components:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-bash">src/
├── App.tsx          <span class="text-green-400"># Main app with state management</span>
├── TaskCard.tsx     <span class="text-green-400"># Individual task component</span>
├── AddTaskForm.tsx  <span class="text-green-400"># Form for adding new tasks</span>
├── styles.css       <span class="text-green-400"># Tailwind + custom animations</span>
└── index.tsx        <span class="text-green-400"># Entry point</span></code></pre>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl">2</span>
  The Task Card Component
</h2>

<p class="mb-4">Each task card features smooth animations and interactive states:</p>

<div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 mb-8">
  <h4 class="text-purple-800 font-bold text-lg mb-3 flex items-center gap-2">
    <span class="text-2xl">🎭</span> Animation Breakdown
  </h4>
  <ul class="text-purple-900 space-y-2">
    <li><code class="bg-purple-100 px-2 py-0.5 rounded text-purple-700">initial</code> - Cards start scaled down and transparent</li>
    <li><code class="bg-purple-100 px-2 py-0.5 rounded text-purple-700">animate</code> - Spring animation to full size</li>
    <li><code class="bg-purple-100 px-2 py-0.5 rounded text-purple-700">exit</code> - Slide out when deleted</li>
    <li><code class="bg-purple-100 px-2 py-0.5 rounded text-purple-700">whileHover</code> - Subtle lift effect on hover</li>
  </ul>
</div>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center text-xl">3</span>
  State Management
</h2>

<p class="mb-4">We use React's <code class="bg-gray-100 px-2 py-1 rounded text-pink-600">useState</code> hook for simple, effective state management:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-typescript"><span class="text-purple-400">interface</span> <span class="text-yellow-400">Task</span> {
  id: <span class="text-cyan-400">string</span>;
  title: <span class="text-cyan-400">string</span>;
  completed: <span class="text-cyan-400">boolean</span>;
  priority: <span class="text-green-400">'low'</span> | <span class="text-green-400">'medium'</span> | <span class="text-green-400">'high'</span>;
}

<span class="text-purple-400">const</span> [tasks, setTasks] = <span class="text-cyan-400">useState</span>&lt;<span class="text-yellow-400">Task</span>[]&gt;([]);

<span class="text-gray-500">// Toggle completion with animation</span>
<span class="text-purple-400">const</span> toggleTask = (id: <span class="text-cyan-400">string</span>) => {
  setTasks(tasks.<span class="text-cyan-400">map</span>(task =>
    task.id === id 
      ? { ...task, completed: !task.completed }
      : task
  ));
};</code></pre>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">4</span>
  Glassmorphism Styling
</h2>

<p class="mb-4">The frosted glass effect is achieved with Tailwind utilities:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-css"><span class="text-purple-400">.glass-card</span> {
  <span class="text-cyan-400">@apply</span> bg-white/70 backdrop-blur-xl 
         border border-white/20 
         shadow-xl rounded-2xl;
}

<span class="text-purple-400">.glass-card:hover</span> {
  <span class="text-cyan-400">@apply</span> bg-white/80 shadow-2xl;
}</code></pre>

<div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8">
  <h4 class="text-amber-800 font-bold text-lg mb-3 flex items-center gap-2">
    <span class="text-2xl">💡</span> Pro Tip
  </h4>
  <p class="text-amber-900">
    Use <code class="bg-amber-100 px-2 py-0.5 rounded text-amber-700">backdrop-blur-xl</code> for the frosted effect, but be mindful of performance on older devices. Consider adding a fallback solid background.
  </p>
</div>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-xl">5</span>
  Priority Colors
</h2>

<p class="mb-4">Visual priority indicators help users quickly scan their tasks:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-typescript"><span class="text-purple-400">const</span> priorityColors = {
  low: <span class="text-green-400">'bg-emerald-500'</span>,
  medium: <span class="text-green-400">'bg-amber-500'</span>,
  high: <span class="text-green-400">'bg-rose-500'</span>,
};

<span class="text-gray-500">// Animated priority indicator</span>
&lt;<span class="text-cyan-400">motion.div</span>
  className={\`w-2 h-2 rounded-full \${priorityColors[task.priority]}\`}
  animate={{ scale: [1, 1.2, 1] }}
  transition={{ repeat: Infinity, duration: 2 }}
/&gt;</code></pre>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center text-xl">6</span>
  Try It Live!
</h2>

<p class="mb-4">Click the <strong>"Open in IDE"</strong> button above to see the full code and interact with the live preview. Try:</p>

<ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
  <li>Adding new tasks with different priorities</li>
  <li>Clicking tasks to mark them complete</li>
  <li>Hovering over cards to see the lift animation</li>
  <li>Deleting tasks and watching them animate out</li>
</ul>

<div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mt-10">
  <h3 class="text-green-800 font-bold text-2xl mb-4 flex items-center gap-3">
    <span class="text-3xl">🎉</span> What's Next?
  </h3>
  <p class="text-green-900 text-lg mb-4">
    You've built a beautiful, animated task manager! Here are some ideas to extend it:
  </p>
  <ul class="text-green-800 space-y-2">
    <li>• Add drag-and-drop reordering with <code class="bg-green-100 px-2 py-0.5 rounded">@dnd-kit</code></li>
    <li>• Persist tasks to localStorage or a backend</li>
    <li>• Add due dates and reminders</li>
    <li>• Implement categories or tags</li>
  </ul>
</div>

</div>
`,
  files: [
    {
      name: "App.tsx",
      language: "tsx",
      code: `import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const initialTasks: Task[] = [
  { id: '1', title: 'Review pull requests', completed: false, priority: 'high' },
  { id: '2', title: 'Update documentation', completed: false, priority: 'medium' },
  { id: '3', title: 'Fix navigation bug', completed: true, priority: 'high' },
  { id: '4', title: 'Write unit tests', completed: false, priority: 'low' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addTask = (title: string, priority: Task['priority']) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      priority,
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            ✨ Task Manager
          </h1>
          <p className="text-white/80">
            {completedCount} of {tasks.length} tasks completed
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: tasks.length ? \`\${(completedCount / tasks.length) * 100}%\` : '0%' }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>
        </motion.div>

        {/* Add Task Form */}
        <AddTaskForm onAdd={addTask} />

        {/* Task List */}
        <div className="space-y-3 mt-6">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </AnimatePresence>
        </div>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-white/60"
          >
            <p className="text-xl">🎉 All done!</p>
            <p className="text-sm mt-2">Add a new task to get started</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}`
    },
    {
      name: "TaskCard.tsx",
      language: "tsx",
      code: `import { motion } from 'framer-motion';
import type { Task } from './App';

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
};

export default function TaskCard({ task, index, onToggle, onDelete }: TaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        delay: index * 0.05,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-4 cursor-pointer group"
      onClick={() => onToggle(task.id)}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <motion.div
          className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors \${
            task.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 group-hover:border-purple-400'
          }\`}
          whileTap={{ scale: 0.9 }}
        >
          {task.completed && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </motion.div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <p className={\`font-medium transition-all \${
            task.completed ? 'text-gray-400 line-through' : 'text-gray-800'
          }\`}>
            {task.title}
          </p>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center gap-2">
          <motion.div
            className={\`w-2 h-2 rounded-full \${priorityColors[task.priority]}\`}
            animate={task.priority === 'high' && !task.completed ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="text-xs text-gray-500 font-medium">
            {priorityLabels[task.priority]}
          </span>
        </div>

        {/* Delete Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}`
    },
    {
      name: "AddTaskForm.tsx",
      language: "tsx",
      code: `import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Task } from './App';

interface AddTaskFormProps {
  onAdd: (title: string, priority: Task['priority']) => void;
}

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), priority);
    setTitle('');
    setIsExpanded(false);
  };

  const priorities: Task['priority'][] = ['low', 'medium', 'high'];
  const priorityStyles = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/70 transition-all placeholder-gray-400"
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          Add
        </motion.button>
      </div>

      {/* Priority Selector */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
          <span className="text-sm text-gray-600 font-medium">Priority:</span>
          <div className="flex gap-2">
            {priorities.map((p) => (
              <motion.button
                key={p}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPriority(p)}
                className={\`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all capitalize \${
                  priority === p
                    ? priorityStyles[p]
                    : 'bg-white/50 text-gray-500 border-transparent hover:border-gray-200'
                }\`}
              >
                {p}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.form>
  );
}`
    },
    {
      name: "index.tsx",
      language: "tsx",
      code: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);`
    },
    {
      name: "public/index.html",
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
    }
  ]
};

async function seedReactPost() {
  try {
    // Get a real user to be the author
    const authorResult = await client.execute(
      "SELECT id, username FROM users ORDER BY id ASC LIMIT 1"
    );
    
    if (authorResult.rows.length === 0) {
      console.error("❌ No users found! Please sign up first.");
      return;
    }
    
    const authorId = authorResult.rows[0].id as number;
    const authorName = authorResult.rows[0].username as string;
    console.log(`Using author: ${authorName} (ID: ${authorId})`);

    // Insert the post
    const postResult = await client.execute({
      sql: `INSERT INTO posts (title, excerpt, content, cover_image, technologies, view_count, author_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        reactPost.title,
        reactPost.excerpt,
        reactPost.content,
        reactPost.coverImage,
        reactPost.technologies,
        0,
        authorId
      ]
    });

    const postId = postResult.lastInsertRowid;
    console.log(`Created post with ID: ${postId}`);

    // Insert the files
    for (const file of reactPost.files) {
      await client.execute({
        sql: `INSERT INTO post_files (post_id, name, language, code) VALUES (?, ?, ?, ?)`,
        args: [postId, file.name, file.language, file.code]
      });
      console.log(`  Added file: ${file.name}`);
    }

    console.log("\n✅ React demo post created successfully!");
    console.log(`   Title: ${reactPost.title}`);
    console.log(`   Author: ${authorName}`);
    console.log(`   Files: ${reactPost.files.length}`);
    console.log(`   Technologies: ${JSON.parse(reactPost.technologies).join(", ")}`);
    console.log("\n📦 This post can be previewed in the Sandpack IDE!");

  } catch (error) {
    console.error("Error seeding React post:", error);
    throw error;
  }
}

seedReactPost();
