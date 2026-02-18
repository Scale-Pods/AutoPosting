import React, { useEffect, useState } from 'react';
import { dataService } from '../utils/dataService';
import { Check, X, Plus, Trash2, Clock, Calendar } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

const StatusBadge = ({ status }) => {
  const normalized = status.replace(' ', '.');
  return <span className={`badge status-${normalized}`}>{status}</span>;
};

const ClientDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [comment, setComment] = useState('');
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null); // [NEW] Task Details Modal
  const [generatingCaption, setGeneratingCaption] = useState(false); // [NEW]

  const togglePreview = (id) => {
    setActivePreviewId(prev => prev === id ? null : id);
  };
  
  // New Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // [NEW] Success Modal
  const [designers, setDesigners] = useState([]); // [NEW]
  const [newCampaign, setNewCampaign] = useState({
    clientName: 'Client', // Default
    campaignName: '',
    brief: '',
    deadline: '',
    uploadDate: '', // [NEW]
    uploadTime: '', // [NEW]
    designerId: '', // [NEW]
    postType: 'Static', // [FIX] Ensure default
    status: 'New'
  });

  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const allTasks = await dataService.getTasks();
    const allDesigners = await dataService.getDesigners(); 
    setTasks(allTasks);
    setDesigners(allDesigners);
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    fetchTasks(true);
  }, []);

  const handleApprove = async (id) => {
    if (confirm('Are you sure you want to approve this design?')) {
        // Optimistic Update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Approved' } : t));
        
        await dataService.approveDesign(id);
        // Background fetch to sync
        fetchTasks(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const designerObj = designers.find(d => String(d.id) === String(newCampaign.designerId));
    
    // Create optimistic task object (temporary ID until confirmed)
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      id: tempId,
      ...newCampaign,
      designerName: designerObj ? designerObj.name : 'Unassigned',
      designerEmail: designerObj ? designerObj.email : '',
      createdAt: new Date().toISOString(),
      status: 'New'
    };

    // Optimistic Update
    setTasks(prev => [optimisticTask, ...prev]);
    setIsModalOpen(false);
    
    // Reset Form
    setNewCampaign({
        clientName: 'Client',
        campaignName: '',
        brief: '',
        deadline: '',
        uploadDate: '',
        uploadTime: '',
        designerId: '',
        postType: 'Static',
        status: 'New'
    });

    // Actual API Call
    const createdTask = await dataService.createTask(optimisticTask);
    
    // Replace temp task with real one (if ID changed or just to sync)
    if (createdTask) {
        setTasks(prev => prev.map(t => t.id === tempId ? createdTask : t));
    }

    // Show Success Modal
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
      setShowSuccessModal(false);
      fetchTasks(true); // Refetch from webhook/backend
  };

  const handleDelete = async (id, campaignName) => {
    if (confirm(`Are you sure you want to delete "${campaignName}"?`)) {
      setTasks(prev => prev.filter(t => t.id !== id)); // Optimistic delete
      await dataService.deleteTask(id, campaignName);
      fetchTasks(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return alert('Please provide feedback for rejection.');
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === reviewingId ? { ...t, status: 'Rejected', feedback: comment } : t));
    
    const idToReject = reviewingId;
    setReviewingId(null);
    setComment('');

    await dataService.rejectDesign(idToReject, comment);
    fetchTasks(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Campaign Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track progress and approve designs.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={20} /> Create Campaign
        </button>
      </div>

      {/* Sections */ }
      
      {[
          { title: 'Yet to be Reviewed', list: tasks.filter(t => t.status === 'Design Uploaded'), color: 'var(--primary)', empty: 'No designs waiting for review.' },
          { title: 'Approved', list: tasks.filter(t => t.status === 'Approved'), color: 'var(--status-approved)', empty: 'No approved campaigns yet.' },
          { title: 'Rejected', list: tasks.filter(t => t.status === 'Rejected'), color: 'var(--status-rejected)', empty: 'No rejected campaigns.' },
          { title: 'Waiting for Design', list: tasks.filter(t => t.status === 'New'), color: 'var(--text-muted)', empty: 'No new briefs pending.' }
      ].map((section, idx) => (
        section.list.length >= 0 && (
        <div key={idx} style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{section.title}</h2>
                <span className="badge" style={{ background: section.color, color: 'white' }}>{section.list.length}</span>
            </div>
            
            {section.list.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                    {section.empty}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {section.list.map(task => (
                    <div 
                        key={task.id} 
                        className="card" 
                        onClick={() => setSelectedTask(task)} // Open Modal on Click
                        style={{ display: 'flex', flexDirection: 'column', position: 'relative', padding: '1rem', cursor: 'pointer' }}
                    >
                        {task.status !== 'Deleted' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(task.id, task.campaignName); }}
                            style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#EF4444', 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer',
                                padding: '4px',
                                zIndex: 10
                            }}
                            title="Delete Campaign"
                        >
                            <Trash2 size={14} />
                        </button>
                        )}

                        {/* Card Header: Realigned and Text Wrapping Enabled */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem', paddingRight: '20px' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <h3 style={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.95rem', 
                                    lineHeight: '1.3', 
                                    wordBreak: 'break-word' // Allow wrap
                                }}>
                                    {task.campaignName || 'Campaign'}
                                </h3>
                                <div style={{ flexShrink: 0 }}>
                                    <StatusBadge status={task.status} />
                                </div>
                             </div>

                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{task.designerName || 'Unassigned'}</span>
                             </div>
                             {task.brief && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
                                    {task.brief.substring(0, 60)}{task.brief.length > 60 ? '...' : ''}
                                </div>
                             )}
                        </div>

                        {/* Design Preview Area */}
                        
                        {(() => {
                            const extractDriveId = (url) => {
                                if (!url || typeof url !== 'string') return null;
                                const match = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/) || url.match(/\/folders\/([^/?]+)/);
                                return match ? match[1] : null;
                            };

                            // Prioritize thumbnailUrl for card preview
                            const thumbId = extractDriveId(task.thumbnailUrl);
                            const designId = extractDriveId(task.designUrl);
                            const driveId = thumbId || designId;

                            const isFolder = task.designUrl && typeof task.designUrl === 'string' && task.designUrl.includes('/folders/');
                            const isVertical = task.postType === 'Reel' || task.postType === 'Story (Reel)';
                            const isVideoType = isVertical || (task.postType && task.postType.includes && task.postType.includes('Video'));
                            
                            // Use 1/1 for cards if not vertical to keep grid clean
                            const containerRatio = isVertical ? '9/16' : '1/1';

                            return (
                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 'auto' }}>
                                    <div style={{ 
                                        width: '100%',
                                        height: isVertical ? '280px' : 'auto',
                                        aspectRatio: containerRatio,
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        border: task.designUrl ? '1px solid var(--border)' : '1px dashed var(--border)',
                                        background: '#000', // Black background for videos/images to avoid grey
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {task.designUrl ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                {driveId || (task.thumbnailUrl && task.thumbnailUrl.startsWith('http')) ? (
                                                    <img 
                                                        src={driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200` : task.thumbnailUrl}
                                                        alt="Design Preview"
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: (thumbId || !isFolder) ? 'cover' : 'contain', 
                                                            display: 'block' 
                                                        }}
                                                        onError={(e) => { 
                                                            e.target.onerror = null; 
                                                            const designText = (task.designUrl && typeof task.designUrl === 'string' && !task.designUrl.includes('drive.google.com')) 
                                                                ? task.designUrl.replace(' (Uploaded)', '') 
                                                                : (task.campaignName || 'Unnamed Campaign');

                                                            e.target.parentNode.innerHTML = `
                                                                <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at top left, #1E293B, #0F172A); color: white; padding: 24px; text-align: center; border: 1px solid rgba(159, 212, 138, 0.1);">
                                                                    <div style="background: rgba(159, 212, 138, 0.1); width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(159, 212, 138, 0.2); box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9FD48A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                            ${isFolder ? '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>'}
                                                                        </svg>
                                                                    </div>
                                                                    <div style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #9FD48A; margin-bottom: 8px; opacity: 0.9;">
                                                                        ${isFolder ? 'Carousel Folder' : 'Design Assets'}
                                                                    </div>
                                                                    <div style="font-size: 0.9rem; font-weight: 600; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; color: #F8FAFC;">
                                                                        ${designText}
                                                                    </div>
                                                                    <div style="margin-top: 12px; font-size: 0.7rem; color: #94A3B8; display: flex; alignItems: center; gap: 4px;">
                                                                        Click to Review Contents ↗
                                                                    </div>
                                                                </div>
                                                            `;
                                                        }} 
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', color: 'var(--text-muted)', gap: '12px' }}>
                                                        <Plus size={32} />
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Explore Contents ↗</span>
                                                    </div>
                                                )}
                                                
                                                {/* Play Overlay for Videos */}
                                                {isVideoType && (
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                                            <Check size={20} /> {/* Simple indicator */}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ 
                                                    position: 'absolute', bottom: '8px', right: '8px', zIndex: 10
                                                }}>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); window.open(task.designUrl, '_blank'); }}
                                                        className="btn btn-sm"
                                                        style={{ background: 'rgba(255,255,255,0.9)', color: '#000', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', fontSize: '0.7rem', padding: '4px 8px', height: 'auto', fontWeight: 600 }}
                                                    >
                                                        {isFolder ? 'Folder ↗' : (isVideoType ? 'Video ↗' : 'Drive ↗')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                                                <Clock size={24} style={{ marginBottom: '8px', opacity: 0.5 }} /> <br/>
                                                Pending Design
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Actions */}
                        <div style={{ marginTop: 'auto', width: '100%' }}>
                            {task.status === 'Design Uploaded' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {reviewingId === task.id ? (
                                <div style={{ background: 'var(--bg-error-subtle)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-error-subtle)', width: '100%', boxSizing: 'border-box' }}>
                                    <textarea 
                                        placeholder="Reason for rejection..." 
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: '100%', marginBottom: '0.5rem', minHeight: '60px', fontSize: '0.875rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleReject(e); }} 
                                            className="btn btn-danger" 
                                            style={{ flex: 1, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                        >
                                            Confirm
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setReviewingId(null); }} 
                                            className="btn btn-outline" 
                                            style={{ flex: 1, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                                ) : (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleApprove(task.id); }} 
                                        className="btn" 
                                        style={{ flex: 1, background: 'var(--status-approved)', color: '#065F46', padding: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                    <Check size={16} /> Approve
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setReviewingId(task.id); }} 
                                        className="btn" 
                                        style={{ flex: 1, background: 'var(--status-rejected)', color: '#991B1B', padding: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                    <X size={16} /> Reject
                                    </button>
                                </div>
                                )}
                            </div>
                            )}
                            {task.status === 'Approved' && (
                            <div style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 500 }}>
                                {task.caption || task.hashtags ? (
                                    <span style={{ color: 'var(--status-approved)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <Check size={16} /> Ready for Upload
                                    </span>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>Waiting for caption generation...</span>
                                )}
                            </div>
                            )}
                            {task.status === 'New' && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Waiting for Designer...
                            </div>
                            )}
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </div>
        )
      ))}

      {/* Task Details Modal */}
      {selectedTask && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 60, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' 
        }}>
          <div style={{ 
            background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', 
            width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{selectedTask.campaignName}</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <StatusBadge status={selectedTask.status} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>• {selectedTask.postType || 'Static'}</span>
                  </div>
              </div>
              <button 
                  onClick={() => setSelectedTask(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
              >
                  <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               {/* Left Column: Details */}
               <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Brief</label>
                      <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-line' }}>
                        {selectedTask.brief}
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Details</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                         <div>
                            <span style={{ color: 'var(--text-muted)' }}>Designer:</span> <br/>
                            <span style={{ fontWeight: 600 }}>{selectedTask.designerName || 'Pending'}</span>
                         </div>
                         <div>
                            <span style={{ color: 'var(--text-muted)' }}>Deadline:</span> <br/>
                            <span style={{ fontWeight: 600 }}>{selectedTask.deadline || 'N/A'}</span>
                         </div>
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                      {/* Caption/Comment Section */}
                      <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Caption / Comment</label>
                              <button 
                                onClick={async () => {
                                    setGeneratingCaption(true);
                                    const { caption, hashtags } = await dataService.generateAICaption(
                                        selectedTask.id, 
                                        selectedTask.campaignName, 
                                        selectedTask.brief, 
                                        selectedTask.designUrl
                                    );
                                    setSelectedTask(prev => ({...prev, caption, hashtags}));
                                    setGeneratingCaption(false);
                                }}
                                className="btn btn-ghost btn-sm"
                                disabled={generatingCaption}
                                style={{ fontSize: '0.75rem', color: 'var(--primary)', padding: '2px 8px', height: 'auto' }}
                              >
                                {generatingCaption ? '⏳ Generating...' : '✨ Auto-Generate Caption'}
                              </button>
                          </div>
                          <textarea 
                            value={selectedTask.caption || ''} 
                            onChange={(e) => setSelectedTask({...selectedTask, caption: e.target.value})}
                            style={{ 
                                width: '100%', 
                                background: 'var(--bg-main)', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                minHeight: '80px',
                                fontFamily: 'inherit',
                                color: 'var(--text-main)', // Ensure visibility based on theme
                            }}
                            placeholder="Write your caption here..."
                          />
                      </div>

                      {/* Hashtags Section */}
                      <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Hashtags</label>
                          </div>
                          <textarea 
                            value={selectedTask.hashtags || ''} 
                            onChange={(e) => setSelectedTask({...selectedTask, hashtags: e.target.value})}
                            style={{ 
                                width: '100%', 
                                background: 'var(--bg-main)', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                minHeight: '60px',
                                fontFamily: 'inherit',
                                color: 'var(--text-main)', // Ensure visibility
                            }}
                            placeholder="#hashtags"
                          />
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={async () => {
                                const success = await dataService.updateCaption(selectedTask.id, selectedTask.caption, selectedTask.hashtags);
                                if (success) {
                                    alert('Caption and Hashtags saved and sent!');
                                } else {
                                    alert('Failed to save.');
                                }
                            }}
                          >
                              Save Changes
                          </button>
                      </div>
                  </div>
               </div>

               {/* Right Column: Preview */}
               <div>
                   <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>Campaign Contents & Preview</label>
                   {selectedTask.designUrl ? (
                        <div style={{ 
                            borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)',
                            background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' 
                        }}>
                             {(() => {
                                const url = selectedTask.designUrl;
                                                                 // Handle Direct Multi-File Upload string: "X Files: name1, name2 (Uploaded)"
                                 if (url && typeof url === 'string' && url.includes(' (Uploaded)')) {
                                     const filePart = url.split(': ')[1]?.replace(' (Uploaded)', '');
                                     const files = filePart ? filePart.split(', ') : [];
                                     return (
                                         <div style={{ padding: '2.5rem 1.5rem', width: '100%', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', borderBottom: '2px solid var(--primary-light)', paddingBottom: '1rem' }}>
                                                 <div style={{ background: 'var(--bg-success-subtle)', color: 'var(--text-success)', padding: '8px', borderRadius: '12px' }}>
                                                    <Check size={28} />
                                                 </div>
                                                 <div>
                                                     <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>{files.length} Content Items Ready</h3>
                                                     <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Review assets for this campaign.</p>
                                                 </div>
                                             </div>
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                                                 {files.map((f, i) => (
                                                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                                         <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{i+1}</div>
                                                         <div style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem' }}>{f}</div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     );
                                 }

                                 if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return null;

                                const folderMatch = url.match(/\/folders\/([^/?]+)/);
                                const fileMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
                                
                                if (folderMatch) {
                                    return (
                                        <div style={{ 
                                            width: '100%', 
                                            background: '#f8fafc', // Light background for the Google Drive list for better visibility
                                            borderRadius: '12px', 
                                            overflow: 'hidden', 
                                            border: '1px solid var(--border)',
                                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                                        }}>
                                            <div style={{ 
                                                padding: '10px 16px', 
                                                background: 'var(--bg-card)', 
                                                borderBottom: '1px solid var(--border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }}></div>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }}></div>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }}></div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Carousel Assets
                                                </span>
                                            </div>
                                            <iframe 
                                                title="Folder Preview"
                                                src={`https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`}
                                                style={{ width: '100%', height: '550px', border: 'none', display: 'block' }}
                                            ></iframe>
                                        </div>
                                    );
                                }

                                if (fileMatch) {
                                    const driveId = fileMatch[1];
                                    const isVideoType = (selectedTask.postType && selectedTask.postType.includes('Video')) || selectedTask.postType === 'Reel' || selectedTask.postType === 'Story (Reel)';
                                    
                                    return (
                                        <iframe 
                                            title="File Preview"
                                            src={`https://drive.google.com/file/d/${driveId}/preview`}
                                            style={{ width: '100%', height: '400px', border: 'none' }}
                                            allow="autoplay; fullscreen"
                                        ></iframe>
                                    );
                                }

                                return null;
                             })() || (
                                ((selectedTask.postType && selectedTask.postType.includes && selectedTask.postType.includes('Video')) || selectedTask.postType === 'Reel' || (selectedTask.designUrl && typeof selectedTask.designUrl === 'string' && selectedTask.designUrl.match(/\.(mp4|mov)$/i))) ? (
                                    <video src={selectedTask.designUrl} controls style={{ maxWidth: '100%', maxHeight: '500px' }} />
                                ) : (
                                    <img src={selectedTask.designUrl} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                                )
                             )}
                        </div>
                   ) : (
                       <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-subtle)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                                   <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--bg-subtle)', border: '2px dashed var(--border)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                            <div style={{ background: 'rgba(52, 152, 219, 0.05)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Clock size={32} style={{ opacity: 0.5, color: '#3498db' }} />
                            </div>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '8px' }}>Content in Production</div>
                            <p style={{ fontSize: '0.85rem', maxWidth: '240px', margin: '0 auto', lineHeight: '1.5' }}>Our designers are currently working on your campaign assets. They will appear here once ready.</p>
                        </div>
                       </div>
                   )}
                   {selectedTask.designUrl && (
                       <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                           <a href={selectedTask.designUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                               Open in New Tab ↗
                           </a>
                       </div>
                   )}
               </div>
            </div>
            
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                 {/* Only show actions if design exists and status is appropriate */}
                 {selectedTask.status === 'Design Uploaded' && (
                     <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                         <button 
                            onClick={() => { setReviewingId(selectedTask.id); setSelectedTask(null); }} 
                            className="btn btn-danger"
                        >
                            Reject Idea
                        </button>
                         <button 
                            onClick={() => { handleApprove(selectedTask.id); setSelectedTask(null); }} 
                            className="btn btn-success"
                        >
                            Approve Campaign
                        </button>
                     </div>
                 )}
            </div>

          </div>
        </div>
      )}
      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Create New Campaign</h2>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Campaign Name / Brief Title</label>
                <input type="text" value={newCampaign.campaignName} onChange={e => setNewCampaign({...newCampaign, campaignName: e.target.value})} placeholder="e.g. Summer Launch" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Brief Details</label>
                <textarea value={newCampaign.brief} onChange={e => setNewCampaign({...newCampaign, brief: e.target.value})} rows="3" placeholder="Describe the requirements..." style={{ width: '100%' }}></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Assign Designer</label>
                <select 
                    value={newCampaign.designerId} 
                    onChange={e => setNewCampaign({...newCampaign, designerId: e.target.value})} 
                    style={{ width: '100%' }}
                >
                    <option value="">-- Select a Designer --</option>
                    {designers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                    ))}
                </select>
              </div>

              <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Post Type</label>
                <select 
                  value={newCampaign.postType || 'Static'} 
                  onChange={e => setNewCampaign({...newCampaign, postType: e.target.value})}
                  style={{ width: '100%' }}
                >
                  <option value="Static">Static</option>
                  <option value="Carousel">Carousel</option>
                  <option value="Reel">Reel</option>
                  <option value="Story (Image)">Story (Image)</option>
                  <option value="Story (Reel)">Story (Reel)</option>
                </select>
              </div>

              <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Design Deadline</label>
                  <input type="date" value={newCampaign.deadline} onChange={e => setNewCampaign({...newCampaign, deadline: e.target.value})} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Upload Date</label>
                  <input type="date" value={newCampaign.uploadDate || ''} onChange={e => setNewCampaign({...newCampaign, uploadDate: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Upload Time</label>
                  <input type="time" value={newCampaign.uploadTime || ''} onChange={e => setNewCampaign({...newCampaign, uploadTime: e.target.value})} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Campaign</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--status-approved)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Check size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Campaign Created!</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Your campaign has been successfully created and sent to the designer.
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

      {/* Rejection Modal Modal - renamed for clarity but keeping structure same as previous `reviewingId` block if it was outside */ }
      {/* Rejection Modal is below */ }

      {/* Rejection Modal */}
      {reviewingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Reject Design</h2>
            <form onSubmit={handleReject}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Reason for Rejection</label>
                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  rows="4" 
                  placeholder="Tell the designer what to change..." 
                  style={{ width: '100%', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}
                  required
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>Confirm Reject</button>
                <button type="button" onClick={() => { setReviewingId(null); setComment(''); }} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDashboard;
