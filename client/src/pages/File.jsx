import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, FileText, Download, Trash2, Sparkles, List, Loader2, X, Eye } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';

const FileItem = ({ file, onView, onDelete, onSummary, onExtract, loading }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group gap-3">
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{file.size} • {file.type}</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 sm:ml-4 flex-wrap">
      {file.type === 'PDF' && (
        <>
          <button
            onClick={onSummary}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            title="AI Summary"
          >
            {loading === 'summary' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            <span className="hidden sm:inline">Summary</span>
          </button>
          <button
            onClick={onExtract}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Extract Points"
          >
            {loading === 'extract' ? <Loader2 className="w-3 h-3 animate-spin" /> : <List className="w-3 h-3" />}
            <span className="hidden sm:inline">Extract</span>
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
    <>

          <PageHeader title="My Files"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            searchResults={searchResults}
            notificationOpen={notificationOpen}
            setNotificationOpen={setNotificationOpen}
          />

          {/* WELCOME */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h1 className="text-xl md:text-[28px] font-bold text-slate-800 flex items-center gap-2">
                My Files <span className="text-2xl">📁</span>
              </h1>
              <button onClick={() => setShowUploadModal(true)} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md flex-shrink-0 disabled:opacity-60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
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
      </>
  );
};

export default File;

if (typeof window !== 'undefined' && !window['pdfjs-dist/build/pdf']) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  document.head.appendChild(script);
}
