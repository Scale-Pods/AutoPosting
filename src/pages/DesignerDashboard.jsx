import React, { useEffect, useState, useRef } from 'react';
import { dataService } from '../utils/dataService';
import { UploadCloud, Clock, AlertCircle, FileText, ArrowUp, ArrowDown, Trash2, Info, Eye, Hash, Calendar, MessageSquare, Maximize2, Minimize2, ExternalLink, Check, X, ZoomIn, ZoomOut } from 'lucide-react';

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
  const [thumbnailFile, setThumbnailFile] = useState(null); // [NEW] Thumbnail file
  const [thumbnailUrl, setThumbnailUrl] = useState(''); // [NEW] Thumbnail link
  const fileInputRef = useRef(null); // Ref for hidden file input
  const thumbInputRef = useRef(null); // Ref for thumbnail input
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // [NEW] Success Modal
  const [selectedTask, setSelectedTask] = useState(null); // [NEW] For details modal
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!selectedTask) {
      setZoomLevel(1);
    }
  }, [selectedTask]);


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
    setThumbnailFile(null);
    setThumbnailUrl('');
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    if (thumbInputRef.current) thumbInputRef.current.value = '';
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

  const moveFileUp = (index) => {
    if (index === 0) return;
    setFilesToUpload(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const moveFileDown = (index) => {
    if (index === filesToUpload.length - 1) return;
    setFilesToUpload(prev => {
      const newFiles = [...prev];
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      return newFiles;
    });
  };

  const removeFile = (index) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };



   const verifyRemoteUpload = async (taskId) => {
    setIsVerifying(true);
    let attempts = 0;
    const maxAttempts = 18; // 3 minutes total (10s intervals)
    
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            attempts++;
            console.log(`Verification attempt ${attempts} for task ${taskId}...`);
            
            try {
                const remoteTasks = await dataService.getTasks();
                const updatedTask = remoteTasks.find(t => t.id === taskId);
                
                // Check if the remote task now has a valid URL (not our local placeholder)
                // and a thumbnail URL.
                if (updatedTask && updatedTask.designUrl && updatedTask.thumbnailUrl && 
                    !updatedTask.designUrl.includes('(Uploaded)')) {
                    
                    console.log('Remote verification successful!');
                    clearInterval(interval);
                    setIsVerifying(false);
                    resolve(true);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
            
            if (attempts >= maxAttempts) {
                console.warn('Verification timed out.');
                clearInterval(interval);
                setIsVerifying(false);
                resolve(false);
            }
        }, 10000); // 10 seconds
    });
   };

   const handleSubmitDesign = async (e) => {
    e.preventDefault();
    
    const hasDesign = designUrl || filesToUpload.length > 0;
    const hasThumbnail = thumbnailUrl || thumbnailFile;

    if (!hasDesign || !hasThumbnail) {
        alert('Both Design (Link/Files) and Thumbnail (Link/File) are mandatory.');
        return;
    }

    setIsUploading(true);
    const taskId = uploadingTask.id;

    try {
        let uploadResult = null;

        // Phase 1: Upload to Webhook
        if (filesToUpload.length > 0 || thumbnailFile) {
             uploadResult = await dataService.uploadDesignFile(uploadingTask, filesToUpload, thumbnailFile || thumbnailUrl);
        } else {
             if (!designUrl.includes('drive.google.com') && !designUrl.includes('docs.google.com')) {
                 alert('Please provide a valid Google Drive link.');
                 setIsUploading(false);
                 return;
             }
             uploadResult = await dataService.uploadDesign(taskId, designUrl, thumbnailUrl);
        }

        if (uploadResult) {
            // Phase 2: Wait for Sheet Sync (Polling)
            const verified = await verifyRemoteUpload(taskId);
            
            if (verified) {
                handleCloseModal();
                setShowSuccessModal(true);
            } else {
                alert('Design sent, but we couldn\'t verify the sheet update yet. Please refresh in a minute.');
                handleCloseModal();
                fetchTasks(true);
            }
        } else {
            alert('Initial transfer to n8n failed. Please try again.');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('An unexpected error occurred during submission.');
    } finally {
        setIsUploading(false);
    }
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
              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Campaign</th>
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
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{task.campaignName || 'Untitled'}</td>
                <td style={{ padding: '1rem', maxWidth: '300px' }}>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={task.designUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '6px 10px' }} title="View Design">
                            <Eye size={16} />
                        </a>
                        <button className="btn btn-ghost" onClick={() => setSelectedTask(task)} style={{ padding: '6px 10px' }} title="View Details">
                            <Info size={16} />
                        </button>
                    </div>
                  ) : (
                      task.status === 'Design Uploaded' ? (
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500 }}>
                                 <Clock size={16} /> Waiting
                              </div>
                              <button className="btn btn-ghost" onClick={() => setSelectedTask(task)} style={{ padding: '6px 10px' }} title="View Details">
                                <Info size={16} />
                              </button>
                           </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" onClick={() => handleUploadClick(task)} style={{ flex: 1 }}>
                              <UploadCloud size={16} /> Upload
                            </button>
                            <button className="btn btn-outline" onClick={() => setSelectedTask(task)} style={{ padding: '8px' }} title="View Details">
                                <Info size={16} />
                            </button>
                        </div>
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

              <form onSubmit={handleSubmitDesign} style={{ position: 'relative' }}>
                  {/* Processing Overlay */}
                  {(isUploading || isVerifying) && (
                      <div style={{
                          position: 'absolute', inset: -20, background: 'rgba(255,255,255,0.8)', 
                          zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                          justifyContent: 'center', backdropFilter: 'blur(4px)', borderRadius: '12px',
                          textAlign: 'center', padding: '2rem'
                      }}>
                          <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '48px', height: '48px', marginBottom: '1.5rem' }}></div>
                          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                              {isVerifying ? 'Verifying Submission...' : 'Uploading to Sheets...'}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '250px', lineHeight: 1.5 }}>
                              {isVerifying 
                                ? 'Almost there! Confirming your data has been safely appended to the database.' 
                                : 'Sending your design to our secure servers. This might take a few moments.'}
                          </div>
                          {isVerifying && (
                              <div style={{ marginTop: '1rem', padding: '4px 12px', background: 'var(--bg-subtle)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                  Auto-checking every 10s
                              </div>
                          )}
                      </div>
                  )}

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
                        cursor: isUploading ? 'default' : 'pointer' // Indicate clickable
                    }}
                    onDragEnter={isUploading ? null : handleDrag}
                    onDragLeave={isUploading ? null : handleDrag}
                    onDragOver={isUploading ? null : handleDrag}
                    onDrop={isUploading ? null : handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()} // Trigger file browser
                  >
                      <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        disabled={isUploading}
                        style={{ display: 'none' }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                         {filesToUpload.length > 0 ? (
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <FileText size={32} color="var(--primary)" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                            {filesToUpload.length} File{filesToUpload.length > 1 ? 's' : ''} Selected
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                                            Total Size: {(filesToUpload.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                    {!isUploading && (
                                        <button 
                                            type="button" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setFilesToUpload([]); 
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="btn btn-outline"
                                            style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.75rem', height: 'auto' }}
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                
                                <div style={{ 
                                    maxHeight: '200px', 
                                    overflowY: 'auto', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: '6px',
                                    background: 'var(--bg-body)',
                                    marginBottom: '1rem'
                                }}>
                                    {filesToUpload.map((file, index) => (
                                        <div 
                                            key={`${file.name}-${index}`}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                padding: '8px 12px',
                                                borderBottom: index === filesToUpload.length - 1 ? 'none' : '1px solid var(--border)',
                                                fontSize: '0.85rem'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', width: '20px' }}>{index + 1}.</span>
                                            <div style={{ 
                                                flex: 1, 
                                                whiteSpace: 'nowrap', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                textAlign: 'left',
                                                color: 'var(--text-main)'
                                            }} title={file.name}>
                                                {file.name}
                                            </div>
                                            {!isUploading && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); moveFileUp(index); }}
                                                        disabled={index === 0}
                                                        style={{ padding: '4px', border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? 'var(--border)' : 'var(--text-muted)' }}
                                                    >
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); moveFileDown(index); }}
                                                        disabled={index === filesToUpload.length - 1}
                                                        style={{ padding: '4px', border: 'none', background: 'none', cursor: index === filesToUpload.length - 1 ? 'default' : 'pointer', color: index === filesToUpload.length - 1 ? 'var(--border)' : 'var(--text-muted)' }}
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                        style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                        disabled={isUploading}
                        style={{ width: '100%' }}
                      />
                  </div>
                  )}

                  {/* Thumbnail Section */}
                  <div style={{ 
                      marginTop: '2rem', 
                      padding: '1.5rem', 
                      background: 'var(--bg-subtle)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border)',
                      marginBottom: '1.5rem'
                  }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                          <FileText size={18} color="var(--primary)" />
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Thumbnail / Cover Image (Mandatory)</h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div 
                              onClick={() => !isUploading && thumbInputRef.current?.click()}
                              style={{ 
                                  border: `1px dashed ${thumbnailFile ? 'var(--primary)' : 'var(--border)'}`,
                                  borderRadius: '6px',
                                  padding: '1rem',
                                  textAlign: 'center',
                                  cursor: isUploading ? 'default' : 'pointer',
                                  background: 'var(--bg-card)',
                                  fontSize: '0.8rem'
                              }}
                          >
                              <input 
                                  type="file" 
                                  ref={thumbInputRef} 
                                  accept="image/*"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                          if (!file.type.startsWith('image/')) {
                                              alert('Please upload an image file for the thumbnail.');
                                              return;
                                          }
                                          setThumbnailFile(file);
                                          setThumbnailUrl('');
                                      }
                                  }} 
                                  style={{ display: 'none' }} 
                              />
                              {thumbnailFile ? (
                                  <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                                      ✅ {thumbnailFile.name}
                                  </div>
                              ) : (
                                  <div style={{ color: 'var(--text-muted)' }}>
                                      Click to Upload Thumbnail Image
                                  </div>
                              )}
                          </div>

                          <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '8px', 
                              fontSize: '0.65rem', color: 'var(--text-muted)',
                              textTransform: 'uppercase', letterSpacing: '0.5px'
                          }}>
                            <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
                            OR PASTE THUMBNAIL LINK
                            <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
                          </div>

                          <input 
                              type="text" 
                              placeholder="Thumbnail Drive Link..."
                              value={thumbnailUrl}
                              disabled={isUploading}
                              onChange={(e) => {
                                  setThumbnailUrl(e.target.value);
                                  setThumbnailFile(null);
                              }}
                              style={{ width: '100%', fontSize: '0.85rem' }}
                          />
                      </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-ghost" onClick={handleCloseModal} disabled={isUploading}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={isUploading}>
                          {isUploading ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="spinner"></div> Processing...
                              </div>
                          ) : (
                              filesToUpload.length > 0 ? `Upload ${filesToUpload.length} File${filesToUpload.length > 1 ? 's' : ''}` : 'Submit Design'
                          )}
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

      {/* Task Details Modal */}
      {selectedTask && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', zIndex: 60, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            background: 'var(--bg-card)', padding: isPreviewExpanded ? '1.5rem' : '2.5rem', borderRadius: '24px', 
            width: '100%', maxWidth: isPreviewExpanded ? '1200px' : '1000px', maxHeight: '95vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.025em' }}>{selectedTask.campaignName}</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <StatusBadge status={selectedTask.status} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>• {selectedTask.postType || 'Static'}</span>
                  </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                    className="btn btn-ghost"
                    style={{ padding: '8px', color: 'var(--primary)' }}
                    title={isPreviewExpanded ? "Show Details" : "Focus Preview"}
                >
                    {isPreviewExpanded ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                </button>
                <button 
                    onClick={() => { setSelectedTask(null); setIsPreviewExpanded(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                >
                    <X size={28} />
                </button>
              </div>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isPreviewExpanded ? '1fr' : 'max(360px, 35%) 1fr', 
                gap: '2.5rem',
                animation: 'fadeIn 0.3s ease-out'
            }}>
               {/* Left Column: Details */}
               {!isPreviewExpanded && (
               <div>
                  {selectedTask.status === 'Rejected' && selectedTask.feedback && (
                    <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#FFF5F5', border: '1.5px solid #FED7D7', borderRadius: '16px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#C53030', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            <AlertCircle size={16} /> REVISION FEEDBACK
                        </label>
                        <div style={{ color: '#9B2C2C', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>{selectedTask.feedback}</div>
                    </div>
                  )}

                  <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>Campaign Brief</label>
                      <div style={{ background: 'var(--bg-body)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', whiteSpace: 'pre-line', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                        {selectedTask.brief || 'No instructions provided.'}
                      </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>Delivery Details</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                         <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEADLINE</span> <br/>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedTask.deadline || 'Flexible'}</span>
                         </div>
                         <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLIENT</span> <br/>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedTask.clientName || 'N/A'}</span>
                         </div>
                      </div>
                  </div>

                  {(selectedTask.caption || selectedTask.hashtags) && (
                    <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '16px', border: '1px solid var(--primary)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 800 }}>
                            <MessageSquare size={18} /> SOCIAL METADATA
                        </h4>
                        
                        {selectedTask.caption && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Caption</label>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>"{selectedTask.caption}"</div>
                            </div>
                        )}
                        
                        {selectedTask.hashtags && (
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Hashtags</label>
                                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <Hash size={14} style={{ marginTop: '2px' }} /> {selectedTask.hashtags}
                                </div>
                            </div>
                        )}
                    </div>
                  )}
               </div>
               )}

               {/* Right Column: Preview */}
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <label style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Your Submission</label>
                            {selectedTask.designUrl && !selectedTask.designUrl.includes('drive.google.com') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '4px' }} title="Zoom Out"><ZoomOut size={16} /></button>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>{Math.round(zoomLevel * 100)}%</span>
                                    <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '4px' }} title="Zoom In"><ZoomIn size={16} /></button>
                                </div>
                            )}
                        </div>
                        {selectedTask.designUrl && (
                            <a href={selectedTask.designUrl} target="_blank" rel="noopener noreferrer" 
                               style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                Open Full Size <ExternalLink size={14} />
                            </a>
                        )}
                   </div>
                   
                   {selectedTask.designUrl ? (
                        <div style={{ 
                            borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--border)',
                            background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                            minHeight: isPreviewExpanded ? '700px' : '500px',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                            position: 'relative'
                        }}>
                             {(() => {
                                 const url = selectedTask.designUrl;
                                 
                                 if (url && typeof url === 'string' && url.includes(' (Uploaded)')) {
                                     const filePart = url.split(': ')[1]?.replace(' (Uploaded)', '');
                                     const files = filePart ? filePart.split(', ') : [];
                                     return (
                                         <div style={{ padding: '2.5rem 1.5rem', width: '100%', background: 'var(--bg-card)', color: 'var(--text-main)', height: '100%', overflowY: 'auto' }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', borderBottom: '2px solid var(--primary-light)', paddingBottom: '1rem' }}>
                                                 <div style={{ background: 'var(--bg-success-subtle)', color: 'var(--text-success)', padding: '8px', borderRadius: '12px' }}>
                                                    <Check size={28} />
                                                 </div>
                                                 <div>
                                                     <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>{files.length} Content Items Uploaded</h3>
                                                     <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Client will review these assets.</p>
                                                 </div>
                                             </div>
                                             <div style={{ display: 'grid', gridTemplateColumns: isPreviewExpanded ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr', gap: '12px' }}>
                                                 {files.map((f, i) => (
                                                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'var(--bg-body)', borderRadius: '12px', border: '1.3px solid var(--border)' }}>
                                                         <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, flexShrink: 0 }}>{i+1}</div>
                                                         <div style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     );
                                 }

                                 if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) {
                                     const isVideoType = (selectedTask.postType && selectedTask.postType.includes('Video')) || selectedTask.postType === 'Reel' || (url && url.match(/\.(mp4|mov)$/i));
                                     return (
                                        <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isVideoType ? (
                                                <video src={url} controls style={{ maxWidth: '100%', maxHeight: '100%', transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }} />
                                            ) : (
                                                <img src={url} alt="Full Preview" style={{ maxWidth: zoomLevel > 1 ? 'none' : '100%', maxHeight: zoomLevel > 1 ? 'none' : (isPreviewExpanded ? '750px' : '550px'), transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out', objectFit: 'contain' }} />
                                            )}
                                        </div>
                                     );
                                 }

                                 const folderMatch = url.match(/\/folders\/([^/?]+)/);
                                 const fileMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
                                 
                                 if (folderMatch) {
                                     return (
                                         <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                                             <iframe 
                                                 title="Folder Preview"
                                                 src={`https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`}
                                                 style={{ width: '100%', flex: 1, minHeight: isPreviewExpanded ? '700px' : '550px', border: 'none', display: 'block' }}
                                             ></iframe>
                                         </div>
                                     );
                                 }

                                 if (fileMatch) {
                                     return (
                                         <iframe 
                                             title="File Preview"
                                             src={`https://drive.google.com/file/d/${fileMatch[1]}/preview`}
                                             style={{ width: '100%', height: isPreviewExpanded ? '750px' : '550px', border: 'none' }}
                                             allow="autoplay; fullscreen"
                                         ></iframe>
                                     );
                                 }

                                 return null;
                              })()}
                        </div>
                   ) : (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-subtle)', border: '2px dashed var(--border)', borderRadius: '20px', color: 'var(--text-muted)', width: '100%' }}>
                             <div style={{ background: 'rgba(52, 152, 219, 0.08)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                 <Clock size={36} style={{ color: 'var(--primary)' }} />
                             </div>
                             <h3 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '10px' }}>Upload Required</h3>
                             <p style={{ fontSize: '0.9rem', maxWidth: '280px', margin: '0 auto', lineHeight: '1.6' }}>Review instructions and upload your designs to start the review process.</p>
                        </div>
                   )}
                   
                   {isPreviewExpanded && (
                       <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                           <button 
                                onClick={() => setIsPreviewExpanded(false)}
                                className="btn btn-outline"
                                style={{ padding: '10px 30px', borderRadius: '12px', fontWeight: 700 }}
                           >
                               Return to Details View
                           </button>
                       </div>
                   )}
               </div>
            </div>

            {/* Footer Actions */}
            <div style={{ 
                marginTop: '2.5rem', 
                paddingTop: '1.5rem', 
                borderTop: '1.5px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
            }}>
                <button 
                    onClick={() => { setSelectedTask(null); setIsPreviewExpanded(false); }} 
                    className="btn btn-ghost"
                    style={{ borderRadius: '10px' }}
                >
                    Close
                </button>
                {selectedTask.status !== 'Approved' && (
                    <button 
                         className="btn btn-primary" 
                         style={{ background: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '0.75rem 2rem' }} 
                         onClick={() => { handleUploadClick(selectedTask); setSelectedTask(null); setIsPreviewExpanded(false); }}
                    >
                         <UploadCloud size={18} /> {selectedTask.status === 'Rejected' ? 'Re-upload Design' : 'Proceed to Upload'}
                    </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerDashboard;
