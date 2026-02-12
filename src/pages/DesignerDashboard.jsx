import React, { useEffect, useState } from 'react';
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
  const [dragActive, setDragActive] = useState(false);


  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const allTasks = await dataService.getTasks();
    setTasks(allTasks); 
    setLoading(false);
  };

  const handleUploadClick = (task) => {
    setUploadingTask(task);
    setDesignUrl('');
  };

  const handleCloseModal = () => {
    setUploadingTask(null);
    setDesignUrl('');
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
    
    // Check for file drops first
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        alert("Direct file uploads are not supported. Please upload your design to Google Drive and drop the shareable link here.");
        return;
    }

    // Try to get data as URL text
    const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    
    if (droppedText) {
        if (droppedText.includes('drive.google.com')) {
            setDesignUrl(droppedText);
        } else {
            alert('Please drop a valid Google Drive link.');
        }
    }
  };



  const handleSubmitDesign = async (e) => {
    e.preventDefault();
    if (!designUrl) return;

    if (!designUrl.includes('drive.google.com')) {
        alert('Please provide a valid Google Drive link.');
        return;
    }

    await dataService.uploadDesign(uploadingTask.id, designUrl);
    handleCloseModal();
    fetchTasks();
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
                        transition: 'all 0.2s ease'
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                         {designUrl ? (
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
                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Drag & Drop</span> a Google Drive Link here
                                </div>
                                <div style={{ fontSize: '0.75rem' }}>Works with Drive Folders & Media Files</div>
                            </>
                         )}
                      </div>
                  </div>

                  {/* Link Input */}
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

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={!designUrl}>Submit Design</button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DesignerDashboard;
