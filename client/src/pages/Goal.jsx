import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';
import api from '../services/api';

export default function Goal() {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration: '' });
  const [aiPlan, setAiPlan] = useState(null);
  const [expandedGoal, setExpandedGoal] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [memories, setMemories] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => { fetchGoals(); fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      const [tasksRes, notesRes, memoriesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/notes'),
        api.get('/memories'),
      ]);
      setTasks(tasksRes.data);
      setNotes(notesRes.data);
      setMemories(memoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results = [];
    tasks.forEach(t => {
      if (t.title?.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
        results.push({ type: 'Task', icon: '✅', title: t.title, sub: t.priority + ' priority', color: 'text-indigo-600 bg-indigo-50' });
    });
    notes.forEach(n => {
      if (n.title?.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
        results.push({ type: 'Note', icon: '📝', title: n.title, sub: n.content?.substring(0, 40) || '', color: 'text-orange-600 bg-orange-50' });
    });
    goals.forEach(g => {
      if (g.title?.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q))
        results.push({ type: 'Goal', icon: '🎯', title: g.title, sub: g.progress + '% complete', color: 'text-teal-600 bg-teal-50' });
    });
    memories.forEach(m => {
      if (m.label?.toLowerCase().includes(q) || m.value?.toLowerCase().includes(q))
        results.push({ type: 'Memory', icon: '🔐', title: m.label, sub: m.type === 'password' ? '••••••••' : m.value?.substring(0, 40), color: 'text-blue-600 bg-blue-50' });
    });
    setSearchResults(results);
  }, [searchQuery, tasks, notes, goals, memories]);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setForm({ title: '', description: '', duration: '' });
    setAiPlan(null);
    setShowModal(true);
  };

  // Extract duration from goal text (e.g., "become AI ML Engineer in 6 months")
  const extractDuration = (text) => {
    const match = text.match(/(\d+)\s*(year|month|week|day)s?/i);
    return match ? `${match[1]} ${match[2].toLowerCase()}${parseInt(match[1]) > 1 ? 's' : ''}` : '';
  };

  const sendChatMessage = async (goalId, message) => {
    if (!message.trim()) return;
    setChatLoading(true);
    setChatMessages(prev => ({
      ...prev,
      [goalId]: [...(prev[goalId] || []), { role: 'user', text: message }]
    }));
    try {
      const res = await api.post('/ai/goal-chat', { goalId, message });
      setChatMessages(prev => ({
        ...prev,
        [goalId]: [...(prev[goalId] || []), { role: 'assistant', text: res.data.response }]
      }));
    } catch (err) {
      console.error(err);
      setChatMessages(prev => ({
        ...prev,
        [goalId]: [...(prev[goalId] || []), { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]
      }));
    } finally {
      setChatLoading(false);
    }
  };

  const generateAIPlan = async () => {
    if (!form.title.trim()) return;
    setAiLoading(true);
    setAiPlan(null);
    try {
      const res = await api.post('/ai/roadmap', { goal: form.title });
      const steps = res.data?.steps;
      if (!Array.isArray(steps) || steps.length === 0) throw new Error('Empty');
      setAiPlan(steps.map(s => ({ text: String(s).replace(/^Step \d+[:.\s]*/i, ''), completed: false })));
    } catch (err) {
      console.error('Roadmap error:', err?.response?.data || err.message);
      // Use client-side fallback so user always gets a roadmap
      setAiPlan(getClientFallback(form.title));
    } finally {
      setAiLoading(false);
    }
  };

  const getClientFallback = (goal) => {
    const g = goal.toLowerCase();
    let steps;
    if (g.includes('ai') || g.includes('ml') || g.includes('machine learning') || g.includes('data science')) {
      steps = ['Learn Python: syntax, OOP, libraries', 'Study Mathematics: Linear Algebra, Statistics, Calculus', 'Master NumPy, Pandas, Matplotlib', 'Learn ML with Scikit-learn: regression, classification, clustering', 'Deep Learning: Neural Networks, CNNs, RNNs (TensorFlow/PyTorch)', 'Natural Language Processing (NLP) & Transformers', 'MLOps: model deployment with FastAPI & Docker', 'Build 3-5 end-to-end ML projects on Kaggle', 'Study LLMs and prompt engineering', 'Contribute to open source & apply for roles'];
    } else if (g.includes('web') || g.includes('frontend') || g.includes('react') || g.includes('developer')) {
      steps = ['Learn HTML5 & CSS3: flexbox, grid, responsive design', 'Master JavaScript ES6+: DOM, async/await, fetch', 'Learn Git & GitHub for version control', 'Study React.js: components, hooks, state management', 'Learn Node.js & Express.js for backend', 'Databases: PostgreSQL (SQL) and MongoDB (NoSQL)', 'REST APIs & JWT authentication', 'Build 3 full-stack projects for portfolio', 'Deploy apps: Vercel, Netlify, Railway', 'Apply for jobs & contribute to open source'];
    } else if (g.includes('android') || g.includes('mobile') || g.includes('flutter')) {
      steps = ['Learn Kotlin or Dart basics', 'Setup Android Studio / Flutter SDK', 'UI components: layouts, navigation, state', 'API integration & local storage', 'Firebase: auth, Firestore, notifications', 'Build 3 complete mobile apps', 'Publish on Google Play Store', 'Learn testing & CI/CD for mobile'];
    } else if (g.includes('devops') || g.includes('cloud') || g.includes('aws')) {
      steps = ['Learn Linux & shell scripting', 'Git & GitHub Actions for CI/CD', 'Docker: containers, images, compose', 'Kubernetes: pods, deployments, services', 'AWS/GCP core services: EC2, S3, Lambda', 'Infrastructure as Code: Terraform', 'Monitoring: Prometheus, Grafana', 'Get AWS/CKA certification'];
    } else if (g.includes('design') || g.includes('ui') || g.includes('ux')) {
      steps = ['Learn design principles: typography, color, spacing', 'Master Figma: components, auto-layout, prototyping', 'UX research: user interviews, personas', 'Wireframing & low-fidelity prototyping', 'Build a design system', 'Create 5 portfolio case studies', 'Learn basic HTML/CSS', 'Apply for internships & freelance'];
    } else {
      steps = [`Research fundamentals of: ${goal}`, 'Find best learning resources (courses, books, YouTube)', 'Create a structured 3-month learning plan', 'Practice daily with hands-on projects', 'Join communities and find a mentor', 'Build 2-3 real projects to showcase skills', 'Get feedback and iterate', 'Apply for opportunities and keep improving'];
    }
    return steps.map(text => ({ text, completed: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const progress = aiPlan ? calcProgress(aiPlan) : 0;
    const duration = form.duration || extractDuration(form.title);
    try {
      const res = await api.post('/goals', {
        title: form.title,
        description: form.description,
        progress,
        ai_plan: aiPlan ? JSON.stringify(aiPlan) : null,
        duration: duration || null,
      });
      setGoals(prev => [res.data, ...prev]);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate progress from steps array
  const calcProgress = (steps) => {
    if (!steps.length) return 0;
    return Math.round((steps.filter(s => s.completed).length / steps.length) * 100);
  };

  // Toggle a step's completed state and sync to DB
  const toggleStep = async (goal, stepIndex) => {
    const steps = getSteps(goal);
    steps[stepIndex].completed = !steps[stepIndex].completed;
    const newProgress = calcProgress(steps);
    const newStatus = newProgress === 100 ? 'completed' : 'active';

    // Optimistic update
    setGoals(prev => prev.map(g =>
      g.id === goal.id
        ? { ...g, ai_plan: JSON.stringify(steps), progress: newProgress, status: newStatus }
        : g
    ));

    try {
      await api.put(`/goals/${goal.id}`, {
        ai_plan: JSON.stringify(steps),
        progress: newProgress,
        status: newStatus,
      });
    } catch (err) {
      console.error(err);
      fetchGoals();
    }
  };

  const deleteGoal = async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    try { await api.delete(`/goals/${id}`); } catch { fetchGoals(); }
  };

  const getSteps = (goal) => {
    try {
      const parsed = goal.ai_plan ? JSON.parse(goal.ai_plan) : [];
      // Support both old format (string[]) and new format ({text, completed}[])
      return parsed.map(s => typeof s === 'string' ? { text: s.replace(/^Step \d+:\s*/i, ''), completed: false } : s);
    } catch { return []; }
  };

  const statusColor = (s) =>
    s === 'completed' ? 'bg-green-100 text-green-700' :
    s === 'paused' ? 'bg-yellow-100 text-yellow-700' :
    'bg-indigo-100 text-indigo-700';

  // Calculate days remaining and time progress
  const getDeadlineInfo = (goal) => {
    if (!goal.end_date) return null;
    const now = new Date();
    const end = new Date(goal.end_date);
    const start = new Date(goal.start_date);
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const timeProgress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
    const isOverdue = daysLeft < 0;
    const isApproaching = daysLeft > 0 && daysLeft <= 7;
    return { daysLeft, timeProgress, isOverdue, isApproaching, daysElapsed, totalDays };
  };

  const formatDaysLeft = (days) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    if (days <= 7) return `${days} days left`;
    const weeks = Math.floor(days / 7);
    if (weeks <= 4) return `${weeks} week${weeks > 1 ? 's' : ''} left`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} left`;
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-[20px] p-6 border border-slate-100 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-2/3 mb-3"></div>
      <div className="h-3 bg-slate-100 rounded w-full mb-4"></div>
      <div className="h-2 bg-slate-100 rounded-full w-full"></div>
    </div>
  );

  const ChatInput = ({ onSend, disabled }) => {
    const [input, setInput] = useState('');
    const handleSubmit = (e) => {
      e.preventDefault();
      if (input.trim()) {
        onSend(input);
        setInput('');
      }
    };
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your goal..."
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        <div className="p-8 flex items-center gap-3">
          <img src="/Fevicon.png" alt="NeuroDesk" className="w-8 h-8" />
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {[
            { to: '/app/dashboard', label: 'Home', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
            { to: '/app/tasks', label: 'Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
            { to: '/app/notes', label: 'Notes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
            { to: '/app/files', label: 'Files', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
            { to: '/app/memory', label: 'Memory', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
          ].map(({ to, label, icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </Link>
          ))}
          <Link to="/app/goals" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            Goals
          </Link>
          <Link to="/app/analytics" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </Link>
          <Link to="/app/account" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Account
          </Link>
        </nav>
        <div className="p-3 m-4 border border-slate-100 rounded-2xl flex items-center gap-3">
          <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt="" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs font-semibold text-slate-400">Free plan</p>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="max-w-[1200px] mx-auto pb-24">

          <PageHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            searchResults={searchResults}
            actionButton={{ label: 'Add Goal', onClick: openModal }}
            notificationOpen={notificationOpen}
            setNotificationOpen={setNotificationOpen}
          />

          {/* WELCOME */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-800 mb-2 flex items-center gap-2">
              My Goals <span className="text-2xl">🎯</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Set long-term goals and let AI build your roadmap</p>
          </div>

          {/* STATS */}
          {!loading && goals.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Goals', value: goals.length, color: 'bg-indigo-50 text-indigo-700', icon: '🎯' },
                { label: 'Completed', value: goals.filter(g => g.status === 'completed').length, color: 'bg-green-50 text-green-700', icon: '✅' },
                { label: 'In Progress', value: goals.filter(g => g.status === 'active').length, color: 'bg-orange-50 text-orange-700', icon: '🔥' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-[16px] p-4 flex items-center gap-3 hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer`}>
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs font-semibold opacity-70">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GOALS LIST */}
          {loading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No goals yet</h3>
              <p className="text-slate-500 text-sm mb-6">Add your first goal and let AI create a roadmap for you</p>
              <button onClick={openModal} className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(goal => {
                const steps = getSteps(goal);
                const isExpanded = expandedGoal === goal.id;
                const progress = goal.progress || 0;
                const completedCount = steps.filter(s => s.completed).length;
                const deadlineInfo = getDeadlineInfo(goal);

                return (
                  <div key={goal.id} className="bg-white rounded-[20px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* TITLE + BADGES */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-bold text-slate-800">{goal.title}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(goal.status)}`}>
                              {goal.status}
                            </span>
                            {steps.length > 0 && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                                ✨ AI Plan
                              </span>
                            )}
                            {deadlineInfo && deadlineInfo.isOverdue && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">⏰ Overdue</span>
                            )}
                            {deadlineInfo && deadlineInfo.isApproaching && !deadlineInfo.isOverdue && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">⚠️ Deadline Soon</span>
                            )}
                          </div>

                          {goal.description && (
                            <p className="text-sm text-slate-500 mb-2">{goal.description}</p>
                          )}

                          {/* DEADLINE INFO */}
                          {deadlineInfo && (
                            <p className="text-xs text-slate-500 mb-3 font-medium">
                              📅 {formatDaysLeft(deadlineInfo.daysLeft)}
                            </p>
                          )}

                          {/* DUAL PROGRESS BARS */}
                          <div className="space-y-2">
                            {/* Task Progress */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${progress}%`,
                                    background: progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #5A67D8, #818cf8)'
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-600 w-20 text-right">
                                {steps.length > 0 ? `${completedCount}/${steps.length}` : `${progress}%`}
                              </span>
                            </div>
                            {/* Time Progress */}
                            {deadlineInfo && (
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${deadlineInfo.timeProgress}%`,
                                      background: deadlineInfo.isOverdue ? '#ef4444' : deadlineInfo.timeProgress > 80 ? '#f97316' : '#94a3b8'
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-500 w-20 text-right">⏱️ {Math.round(deadlineInfo.timeProgress)}%</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setChatOpen(chatOpen === goal.id ? null : goal.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${chatOpen === goal.id ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            title="Ask AI about this goal"
                          >
                            💬 Chat
                          </button>
                          {steps.length > 0 && (
                            <button
                              onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isExpanded ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                            >
                              ✨ AI Plan
                              <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          )}
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 💬 AI CHAT PANEL */}
                    {chatOpen === goal.id && (
                      <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                        <p className="text-xs font-bold text-blue-600 mb-3">💬 Goal Coach</p>
                        <div className="bg-slate-50 rounded-xl p-3 h-64 overflow-y-auto mb-3 space-y-2">
                          {(chatMessages[goal.id] || []).map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <ChatInput onSend={(msg) => sendChatMessage(goal.id, msg)} disabled={chatLoading} />
                      </div>
                    )}

                    {/* ✅ EXPANDABLE STEPS WITH CHECKBOXES */}
                    {isExpanded && steps.length > 0 && (
                      <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                        <p className="text-xs font-bold text-purple-600 mb-4 flex items-center gap-1.5">
                          <span>✨</span> AI-Generated Roadmap
                          <span className="ml-auto text-slate-400 font-semibold">{completedCount}/{steps.length} completed</span>
                        </p>
                        <ol className="space-y-3">
                          {steps.map((step, i) => (
                            <li
                              key={i}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${step.completed ? 'bg-green-50' : 'bg-slate-50 hover:bg-indigo-50'}`}
                              onClick={() => toggleStep(goal, i)}
                            >
                              {/* CHECKBOX */}
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${step.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                {step.completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {/* STEP NUMBER */}
                              <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-green-200 text-green-700' : 'bg-indigo-100 text-indigo-600'}`}>
                                {i + 1}
                              </span>
                              {/* STEP TEXT */}
                              <span className={`text-sm flex-1 transition-all ${step.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {step.text}
                              </span>
                              {step.completed && <span className="text-xs text-green-500 font-bold">Done ✓</span>}
                            </li>
                          ))}
                        </ol>

                        {/* COMPLETION MESSAGE */}
                        {progress === 100 && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                            <p className="text-sm font-bold text-green-700">🎉 Goal Completed! Amazing work!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ADD GOAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[24px] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">New Goal 🎯</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Goal *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. I want to become AI ML Engineer"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Why is this goal important to you?"
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Duration (optional)</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                  placeholder="e.g. 6 months, 1 year, 90 days"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                {!form.duration && form.title && extractDuration(form.title) && (
                  <p className="text-xs text-indigo-600 mt-1.5 font-medium">💡 Detected: {extractDuration(form.title)}</p>
                )}
              </div>

              {/* AI PLAN SECTION */}
              <div className="bg-[#F4F4FF] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                    <span>✨</span> AI Roadmap Generator
                  </p>
                  <button
                    type="button"
                    onClick={generateAIPlan}
                    disabled={!form.title.trim() || aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5A67D8] text-white rounded-lg text-xs font-bold hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        Generating...
                      </>
                    ) : '🚀 Generate Steps'}
                  </button>
                </div>

                {!aiPlan && !aiLoading && (
                  <p className="text-xs text-indigo-500">Enter your goal above and click Generate to get an AI-powered step-by-step roadmap</p>
                )}

                {aiLoading && (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-3 bg-indigo-100 rounded animate-pulse" style={{ width: `${65 + i * 7}%` }} />
                    ))}
                  </div>
                )}

                {aiPlan && !aiLoading && (
                  <ol className="space-y-2">
                    {aiPlan.map((step, i) => (
                      <li key={i} className="flex items-center gap-2.5 p-2 bg-white rounded-lg">
                        <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="text-xs text-indigo-800">{step.text}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
