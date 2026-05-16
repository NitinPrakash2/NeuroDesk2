import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, FileText, Download, Trash2, Sparkles, List, Loader2, X, Eye } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';

const FileItem = ({ file, onView, onDelete, onSummary, onExtract, loading }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group">
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{file.size} • {file.type}</p>
      </div>
    </div>
    <div className="flex items-center space-x-2 ml-4">
      {file.type === 'PDF' && (
        <>
          <button
            onClick={onSummary}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-50"
            title="AI Summary"
          >
            {loading === 'summary' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            <span>Summary</span>
          </button>
          <button
            onClick={onExtract}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-50"
            title="Extract Points"
          >
            {loading === 'extract' ? <Loader2 className="w-3 h-3 animate-spin" /> : <List className="w-3 h-3" />}
            <span>Extract</span>
          </button>
        </>
      )}
      <button
        onClick={onView}
        className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const File = () => {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [files, setFiles] = useState([]);
  const [loadingFile, setLoadingFile] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [memories, setMemories] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  React.useEffect(() => {
    fetchFiles();
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [tasksRes, notesRes, goalsRes, memoriesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/notes'),
        api.get('/goals'),
        api.get('/memories'),
      ]);
      setTasks(tasksRes.data);
      setNotes(notesRes.data);
      setGoals(goalsRes.data);
      setMemories(memoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  React.useEffect(() => {
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

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files');
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setFiles([]);
    }
  };

  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText.substring(0, 15000));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSummary = async (file) => {
    setLoadingFile(file.id);
    setLoadingAction('summary');
    try {
      // Check if summary already exists
      if (file.summary) {
        setAiResult({ type: 'summary', content: file.summary, fileName: file.name });
        setShowModal(true);
        toast.success('Summary loaded!');
        return;
      }

      // Get full file content from database
      const fileRes = await api.get(`/files/${file.id}`);
      const text = fileRes.data.content;
      
      if (!text) {
        toast.error('No content found in file');
        return;
      }

      const res = await api.post('/ai/summarize', { text });
      const summary = res.data.summary;

      // Save summary to database
      await api.patch(`/files/${file.id}/summary`, { summary });

      setAiResult({ type: 'summary', content: summary, fileName: file.name });
      setShowModal(true);
      toast.success('Summary generated!');

      // Update local state
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, summary } : f));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoadingFile(null);
      setLoadingAction(null);
    }
  };

  const handleExtract = async (file) => {
    setLoadingFile(file.id);
    setLoadingAction('extract');
    try {
      // Check if points already exist
      if (file.important_points) {
        const points = JSON.parse(file.important_points);
        setAiResult({ type: 'points', content: points, fileName: file.name });
        setShowModal(true);
        toast.success('Important points loaded!');
        return;
      }

      // Extract and auto-save to Notes & Memory
      toast.loading('Extracting and saving important points...', { id: 'extract' });
      const res = await api.post('/ai/extract-and-save', { fileId: file.id });
      const { points, savedNotes, savedMemories, message } = res.data;

      setAiResult({ type: 'points', content: points, fileName: file.name });
      setShowModal(true);
      
      toast.success(
        `${message}\n✅ ${savedNotes} note(s) created\n💾 ${savedMemories} memory(ies) saved`,
        { id: 'extract', duration: 5000 }
      );

      // Update local state
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, important_points: JSON.stringify(points) } : f));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extract points', { id: 'extract' });
    } finally {
      setLoadingFile(null);
      setLoadingAction(null);
    }
  };

  const handleView = async (file) => {
    try {
      const res = await api.get(`/files/${file.id}`);
      const fullFile = res.data;
      
      let content = fullFile.content || 'No content available';
      if (content.length > 2000) {
        content = content.substring(0, 2000) + '...';
      }

      setAiResult({ 
        type: 'view', 
        content, 
        fileName: file.name,
        summary: fullFile.summary,
        points: fullFile.important_points ? JSON.parse(fullFile.important_points) : null
      });
      setShowModal(true);
    } catch (err) {
      toast.error('Failed to load file details');
    }
  };

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (uploadedFiles.length === 0) return;

    setUploading(true);

    for (const file of uploadedFiles) {
      const toastId = file.name;
      try {
        let content = null;
        
        if (file.type === 'application/pdf') {
          toast.loading(`Extracting text from ${file.name}...`, { id: toastId });
          try {
            content = await extractTextFromPDF(file);
            console.log('PDF text extracted, length:', content?.length);
          } catch (pdfError) {
            console.error('PDF extraction error:', pdfError);
            toast.error(`Could not extract text from ${file.name}. Uploading without content.`, { id: toastId });
            content = null;
          }
        }

        const fileData = {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: file.name.split('.').pop().toUpperCase(),
          content: content,
        };

        console.log('Uploading file:', fileData.name, 'Content length:', fileData.content?.length);
        
        const res = await api.post('/files', fileData);
        setFiles(prev => [res.data, ...prev]);
        toast.success(`${file.name} uploaded!`, { id: toastId });
      } catch (err) {
        console.error('Upload error:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
        toast.error(`Failed to upload ${file.name}: ${errorMsg}`, { id: toastId });
      }
    }

    setUploading(false);
    event.target.value = '';
  };

  const handleDelete = async (idToRemove) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await api.delete(`/files/${idToRemove}`);
      setFiles((prevFiles) => prevFiles.filter(file => file.id !== idToRemove));
      toast.success('File deleted');
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <img src="/Fevicon.png" alt="NeuroDesk" className="w-8 h-8 rounded-full" />
          </div>
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <Link to="/app/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Home
          </Link>
          <Link to="/app/tasks" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Tasks
          </Link>
          <Link to="/app/notes" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Notes
          </Link>
          <Link to="/app/files" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Files
          </Link>
          <Link to="/app/memory" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Memory
          </Link>
          <Link to="/app/goals" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
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

        <div className="p-3 m-4 border border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt={user?.name || 'User'} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs font-semibold text-slate-400">Free plan</p>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 h-full overflow-y-auto p-8 relative">
        <div className="max-w-[1200px] mx-auto pb-24">

          <PageHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            searchResults={searchResults}
            actionButton={{ label: uploading ? 'Uploading...' : 'Add File', onClick: () => setShowUploadModal(true), disabled: uploading }}
            notificationOpen={notificationOpen}
            setNotificationOpen={setNotificationOpen}
          />

          {/* WELCOME */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-800 mb-2 flex items-center gap-2">
              My Files <span className="text-2xl">📁</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Upload and manage your documents with AI-powered insights</p>
          </div>

      {/* FILES LIST */}
      <div>
        {!Array.isArray(files) || files.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No files uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {files.filter(file => 
              file.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((file) => (
              <FileItem 
                key={file.id}
                file={file}
                onView={() => handleView(file)}
                onDelete={() => handleDelete(file.id)}
                onSummary={() => handleSummary(file)}
                onExtract={() => handleExtract(file)}
                loading={loadingFile === file.id ? loadingAction : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= UPLOAD MODAL ================= */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
          <div 
            className="bg-white rounded-[24px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Upload Files</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative group">
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 cursor-pointer">
                <div className="p-4 bg-white rounded-2xl text-indigo-500 mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  {uploading ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {uploading ? 'Uploading...' : 'Click to upload files'}
                </h3>
                <p className="text-sm text-gray-500 mt-2">or drag and drop your files here</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, TXT (AI features work best with PDF)</p>
                
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt" 
                  multiple
                  onChange={(e) => {
                    handleFileUpload(e);
                    if (!uploading) setShowUploadModal(false);
                  }}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  title=""
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {showModal && aiResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {aiResult.type === 'summary' ? '📄 AI Summary' : aiResult.type === 'points' ? '✨ Important Points' : '📁 File Details'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{aiResult.fileName}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {aiResult.type === 'summary' ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResult.content}</p>
              ) : aiResult.type === 'points' ? (
                <ul className="space-y-3">
                  {aiResult.content.map((point, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 flex-1">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Content Preview</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{aiResult.content}</p>
                  </div>
                  {aiResult.summary && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">AI Summary</h3>
                      <p className="text-gray-700 leading-relaxed">{aiResult.summary}</p>
                    </div>
                  )}
                  {aiResult.points && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Important Points</h3>
                      <ul className="space-y-2">
                        {aiResult.points.map((point, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-gray-700 text-sm flex-1">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

export default File;

if (typeof window !== 'undefined' && !window['pdfjs-dist/build/pdf']) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  document.head.appendChild(script);
}
