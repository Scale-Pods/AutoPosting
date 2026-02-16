import React, { useEffect, useState, useRef } from 'react';
import { dataService } from '../utils/dataService';
import { UploadCloud, Clock, AlertCircle, FileText } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalized = status.replace(' ', '.');
  return <span className={`badge status-${normalized}`}>{status}</span>;
};

const DesignerDashboard = ({ view = 'assigned' }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTask, setUploadingTask] = useState(null); // Task object being uploaded to
  const [designUrl, setDesignUrl] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]); // [NEW] Files state (Array)
  const fileInputRef = useRef(null); // Ref for hidden file input
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // [NEW] Success Modal


  useEffect(() => {
    fetchTasks(true);
  }, []);

  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const allTasks = await dataService.getTasks();
    setTasks(allTasks); 
    if (showLoading) setLoading(false);
  };

  const handleUploadClick = (task) => {
    setUploadingTask(task);
    setDesignUrl('');
  };

  const handleCloseModal = () => {
    setUploadingTask(null);
    setDesignUrl('');
    setFilesToUpload([]);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop for Links
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Helper to extract Drive Link
    const findDriveLink = (text) => {
        if (!text) return null;
        const match = text.match(/https?:\/\/(drive\.google\.com|docs\.google\.com)[^\s"']+/);
        return match ? match[0] : null;
    };
    
    // 1. Try to get URL from Text/URI
    const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    let foundUrl = findDriveLink(droppedText);

    // 2. Try to get URL from HTML (common when dragging links from web)
    if (!foundUrl) {
        const droppedHtml = e.dataTransfer.getData('text/html');
        if (droppedHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(droppedHtml, 'text/html');
            const link = doc.querySelector('a[href*="drive.google.com"], a[href*="docs.google.com"]');
            if (link) {
                foundUrl = link.href;
            }
        }
    }

    if (foundUrl) {
        setDesignUrl(foundUrl);
        setFilesToUpload([]); // Clear files if link found
        return;
    }
    
    // 3. Check for file drops (Local files)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        // Append new files to existing ones
        setFilesToUpload(prev => [...prev, ...droppedFiles]);
        setDesignUrl(''); // Clear link if files found
        return;
    }

    // 4. Nothing found
    alert('Please drop a valid Google Drive link or files.');
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files);
        setFilesToUpload(prev => [...prev, ...selectedFiles]);
        setDesignUrl('');
    }
  };



  const handleSubmitDesign = async (e) => {
    e.preventDefault();
    if (!designUrl && filesToUpload.length === 0) return;

    // Handle File Upload
    if (filesToUpload.length > 0) {
         await dataService.uploadDesignFile(uploadingTask, filesToUpload);
         handleCloseModal();
         setShowSuccessModal(true);
         return;
    }

    // Handle Link Upload
    if (!designUrl.includes('drive.google.com') && !designUrl.includes('docs.google.com')) {
        alert('Please provide a valid Google Drive link.');
        return;
    }

    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === uploadingTask.id ? { ...t, status: 'Design Uploaded', designUrl: designUrl } : t));
    
    // Close modal immediately
    const tempId = uploadingTask.id;
    const tempUrl = designUrl;
    handleCloseModal();

    // API Call
    await dataService.uploadDesign(tempId, tempUrl);
    
    // Show Success Modal
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    fetchTasks(true);
  };

  // Filter tasks based on view prop
  let displayedTasks = [];
  let title = '';
  let subtitle = '';

  if (view === 'assigned') {
      displayedTasks = tasks.filter(t => t.status === 'New');
      title = 'Assigned Tasks';
      subtitle = 'Manage your active design briefs and uploads.';
  } else if (view === 'sent') {
      displayedTasks = tasks.filter(t => t.status === 'Design Uploaded');
      title = 'Sent for Review';
      subtitle = 'Designs awaiting client feedback.';
  } else if (view === 'rejected') {
      displayedTasks = tasks.filter(t => t.status === 'Rejected');
      title = 'Rejected Tasks';
      subtitle = 'Tasks requiring revisions based on feedback.';
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Brief</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Deadline</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{view === 'sent' ? 'Link' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {displayedTasks.length === 0 && (
               <tr>
                 <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks found in this section.</td>
               </tr>
            )}
            {displayedTasks.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{task.clientName}</td>
                <td style={{ padding: '1rem', maxWidth: '300px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{task.campaignName || 'Campaign'}</div>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border)', fontWeight: 600 }}>
                        {task.postType || 'Static'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{task.brief}</div>
                  {task.status === 'Rejected' && task.feedback && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-error-subtle)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-error)', display: 'flex', gap: '6px', alignItems: 'start' }}>
                       <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                       <div>
                         <strong>Feedback:</strong> {task.feedback}
                       </div>
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                     <Clock size={16} /> {task.deadline || 'No deadline'}
                   </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <StatusBadge status={task.status} />
                </td>
                <td style={{ padding: '1rem' }}>
                  {view === 'sent' ? (
                    <a href={task.designUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.875rem' }}>
                        View Design
                    </a>
                  ) : (
                      task.status === 'Design Uploaded' ? (
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500 }}>
                              <Clock size={16} /> Waiting for Client
                           </div>
                      ) : (
                        <button className="btn btn-primary" onClick={() => handleUploadClick(task)}>
                          <UploadCloud size={16} /> Upload Design
                        </button>
                      )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {uploadingTask && (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
           <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Upload Design</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Provide the Google Drive link for <strong>{uploadingTask.campaignName}</strong>
              </p>

              {/* Order Instruction for Carousel/Story */}
              {['Carousel', 'Story (Image)'].includes(uploadingTask.postType) && (
                  <div style={{ 
                      marginBottom: '1.5rem', 
                      padding: '0.75rem', 
                      background: 'rgba(255, 152, 0, 0.1)', 
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      borderRadius: '6px', 
                      fontSize: '0.85rem', 
                      color: '#ff9800',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'start',
                      textAlign: 'left'
                  }}>
                      <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                          <strong>Important:</strong> Please ensure files are uploaded in the correct sequential order.
                      </div>
                  </div>
              )}

              <form onSubmit={handleSubmitDesign}>
                  {/* Drag Drop Zone for Links */}
                  <div 
                    style={{
                        border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        padding: '2rem',
                        textAlign: 'center',
                        backgroundColor: dragActive ? 'var(--primary-light)' : 'transparent',
                        marginBottom: '1.5rem',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer' // Indicate clickable
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()} // Trigger file browser
                  >
                      <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        style={{ display: 'none' }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                         {filesToUpload.length > 0 ? (
                            <>
                                <FileText size={48} color="var(--primary)" />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                        {filesToUpload.length} File{filesToUpload.length > 1 ? 's' : ''} Selected
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', maxHeight: '60px', overflowY: 'auto' }}>
                                        {filesToUpload.map(f => f.name).join(', ')}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                                        Total Size: {(filesToUpload.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={(e) => { 
                                            e.stopPropagation(); // Stop click from triggering upload dialog
                                            setFilesToUpload([]); 
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="btn btn-xs btn-outline"
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        Clear Files
                                    </button>
                                </div>
                            </>
                         ) : designUrl ? (
                            <>
                                <FileText size={48} color="var(--primary)" />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all', fontSize: '0.9rem' }}>
                                        {designUrl}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Link Ready</div>
                                </div>
                            </>
                         ) : (
                            <>
                                <UploadCloud size={48} />
                                <div>
                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Drag & Drop</span> Files or Drive Link here
                                </div>
                                <div style={{ fontSize: '0.75rem' }}>Supports Direct File Uploads (Multiple) & Drive Links</div>
                            </>
                         )}
                      </div>
                  </div>

                  {/* Link Input - Only show if no files selected */}
                  {filesToUpload.length === 0 && (
                  <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                      <div style={{ 
                          display: 'flex', alignItems: 'center', gap: '8px', 
                          fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px',
                          textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600
                      }}>
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
                        OR PASTE LINK
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="https://drive.google.com/..."
                        value={designUrl}
                        onChange={(e) => setDesignUrl(e.target.value)}
                        style={{ width: '100%' }}
                      />
                  </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={!designUrl && filesToUpload.length === 0}>
                          {filesToUpload.length > 0 ? `Upload ${filesToUpload.length} File${filesToUpload.length > 1 ? 's' : ''}` : 'Submit Design'}
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--status-uploaded)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <UploadCloud size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Design Uploaded!</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Your design has been successfully submitted for review.
                </p>
                <button 
                    onClick={handleSuccessClose} 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    OK
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default DesignerDashboard;
