import React, { useState, useEffect } from 'react';
import { dataService } from '../utils/dataService';
import { Save, X, Edit2, Check, RefreshCw, Magnet, Plus, Sparkles, Trash2 } from 'lucide-react';

const LeadMagnets = () => {
    const [magnets, setMagnets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ word: '', text: '' });
    const [saving, setSaving] = useState(false);
    
    // Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ word: '', text: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false); // Confirmation State

    const fetchMagnets = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        const data = await dataService.getLeadMagnets();
        setMagnets(data);
        if (showLoading) setLoading(false);
    };

    useEffect(() => {
        fetchMagnets(true);
    }, []);

    const handleEditClick = (magnet) => {
        setEditingId(magnet.id);
        setEditForm({ word: magnet.word, text: magnet.text });
        setIsCreating(false);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ word: '', text: '' });
    };

    const handleSave = async (id) => {
        setSaving(true);
        const success = await dataService.updateLeadMagnet(id, editForm.word, editForm.text);
        
        if (success) {
            setMagnets(magnets.map(m => 
                m.id === id ? { ...m, word: editForm.word, text: editForm.text } : m
            ));
            setEditingId(null);
        } else {
            alert('Failed to update. Please try again.');
        }
        setSaving(false);
    };

    const handleCreateClick = () => {
        if (!createForm.word || !createForm.text) {
            alert('Please fill in both Keyword and Reply Text.');
            return;
        }
        setIsConfirming(true);
    };

    const handleConfirmCreate = async () => {
        setSaving(true);
        // Ensure uppercase is shown in confirmation if we forced it, 
        // but dataService handles it. Here we just send what user typed 
        // and let dataService do the transformation.
        const returnedId = await dataService.createLeadMagnet(createForm.word, createForm.text);
        
        if (returnedId) {
            const newItem = {
                id: returnedId, // Use the real ID from service
                word: createForm.word.toUpperCase(), // Display as uppercase
                text: createForm.text
            };
            setMagnets([newItem, ...magnets]);
            setIsCreating(false);
            setIsConfirming(false);
            setCreateForm({ word: '', text: '' });
        } else {
            alert('Failed to create. Please try again.');
        }
        setSaving(false);
    };

    const handleAutoGenerate = async () => {
        if (!createForm.word) {
            alert('Please enter a keyword first to generate a reply.');
            return;
        }
        
        setIsGenerating(true);
        const generatedText = await dataService.generateLeadMagnetReply(createForm.word, createForm.text);
        setCreateForm(prev => ({ ...prev, text: generatedText }));
        setIsGenerating(false);
    };

    const styles = {
        container: {
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            color: 'var(--text-main)',
            position: 'relative' // For modal context
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
        },
        titleGroup: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        },
        iconBox: {
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0,
            color: 'var(--text-main)'
        },
        subtitle: {
            color: 'var(--text-muted)',
            margin: '0.25rem 0 0 0',
            fontSize: '0.875rem'
        },
        headerActions: {
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
        },
        refreshBtn: {
            padding: '0.5rem',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            transition: 'color 0.2s',
            border: 'none',
            background: 'transparent'
        },
        createBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none'
        },
        card: {
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            marginBottom: '1rem' 
        },
        createCard: {
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--primary)', 
            boxShadow: 'var(--shadow-md)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
        },
        createFormTitle: {
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        createFormGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '1.5rem',
            marginBottom: '1.5rem'
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        },
        label: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-muted)'
        },
        gridHeader: {
            display: 'grid',
            gridTemplateColumns: '50px 200px 1fr 100px',
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--bg-body)', 
            color: 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            gap: '1rem'
        },
        gridRow: {
            display: 'grid',
            gridTemplateColumns: '50px 200px 1fr 100px',
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            gap: '1rem',
            alignItems: 'start'
        },
        input: {
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-main)',
            fontFamily: 'inherit',
            fontSize: '0.875rem'
        },
        textarea: {
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-main)',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            minHeight: '80px',
            resize: 'vertical'
        },
        keywordBadge: {
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-main)',
            border: '1px solid var(--border)',
            fontSize: '0.875rem',
            fontWeight: 500
        },
        textDisplay: {
            whiteSpace: 'pre-wrap',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            lineHeight: 1.5
        },
        actions: {
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
        },
        actionBtn: (color = 'var(--text-muted)') => ({
            padding: '0.5rem',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: color,
            border: '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            background: 'transparent'
        }),
        generateBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)',
            border: 'none',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            marginTop: '0.5rem',
            alignSelf: 'flex-start',
            width: 'fit-content'
        },
        footerActions: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
        },
        btnSecondary: {
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--text-main)',
            cursor: 'pointer'
        },
        btnPrimary: {
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        },
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modalContent: {
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '500px',
            width: '90%'
        },
        modalTitle: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: 'var(--text-main)'
        },
        modalDetail: {
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-body)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)'
        }
    };

    if (loading) {
        return (
            <div style={{ height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ 
                    width: '3rem', height: '3rem', 
                    border: '3px solid var(--border)', 
                    borderTopColor: 'var(--primary)', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {isConfirming && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Confirm Lead Magnet Creation</h3>
                        <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>
                            Are you sure you want to create this Lead Magnet?
                        </p>
                        
                        <div style={styles.modalDetail}>
                            <div style={{marginBottom: '0.5rem'}}>
                                <span style={styles.label}>Keyword:</span>
                                <div style={{fontWeight: 'bold', fontSize: '1rem', marginTop: '0.25rem'}}>
                                    {createForm.word.toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <span style={styles.label}>Reply Text:</span>
                                <div style={{marginTop: '0.25rem', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto'}}>
                                    {createForm.text}
                                </div>
                            </div>
                        </div>

                        <div style={styles.footerActions}>
                            <button 
                                onClick={() => setIsConfirming(false)} 
                                style={styles.btnSecondary}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmCreate} 
                                style={styles.btnPrimary}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>Creating...</>
                                ) : (
                                    <>Confirm & Create</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconBox}>
                        <Magnet size={24} />
                    </div>
                    <div>
                        <h1 style={styles.title}>Lead Magnet Automation</h1>
                        <p style={styles.subtitle}>Manage automated responses for specific keywords.</p>
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <button 
                        onClick={fetchMagnets} 
                        style={styles.refreshBtn}
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} />
                    </button>
                    {!isCreating && (
                        <button 
                            onClick={() => setIsCreating(true)} 
                            style={styles.createBtn}
                        >
                            <Plus size={18} /> Add New
                        </button>
                    )}
                </div>
            </div>

            {isCreating && (
                <div style={styles.createCard}>
                    <div style={styles.createFormTitle}>
                        <span>Create New Lead Magnet</span>
                        <button 
                            onClick={() => setIsCreating(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div style={styles.createFormGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Keyword</label>
                            <input
                                type="text"
                                style={styles.input}
                                placeholder="e.g. DISCOUNT2026"
                                value={createForm.word}
                                onChange={(e) => setCreateForm({...createForm, word: e.target.value})}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Reply Text</label>
                            <textarea
                                style={styles.textarea}
                                placeholder="Enter the text to reply with..."
                                value={createForm.text}
                                onChange={(e) => setCreateForm({...createForm, text: e.target.value})}
                            />
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                <button 
                                    onClick={handleAutoGenerate}
                                    style={{...styles.generateBtn, marginTop: '0.5rem'}}
                                    disabled={isGenerating}
                                >
                                    <Sparkles size={14} />
                                    {isGenerating ? 'Generating...' : 'Auto Generate Reply'}
                                </button>
                                <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                                    *Uses keyword & any existing text as context
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={styles.footerActions}>
                        <button 
                            onClick={() => setIsCreating(false)} 
                            style={styles.btnSecondary}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCreateClick} 
                            style={styles.btnPrimary}
                            disabled={saving}
                        >
                            <Plus size={18} /> Review & Create
                        </button>
                    </div>
                </div>
            )}

            <div style={styles.card}>
                <div style={styles.gridHeader}>
                    <div style={{textAlign: 'center'}}>#</div>
                    <div>Keyword</div>
                    <div>Reply Text</div>
                    <div style={{textAlign: 'center'}}>Actions</div>
                </div>

                {magnets.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No lead magnet configurations found.
                    </div>
                ) : (
                    <div>
                        {magnets.map((magnet) => {
                            const isEditing = editingId === magnet.id;
                            return (
                                <div key={magnet.id} style={{
                                    ...styles.gridRow,
                                    backgroundColor: isEditing ? 'var(--primary-light)' : 'transparent',
                                    transition: 'background-color 0.2s'
                                }}>
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '0.5rem', fontSize: '0.75rem' }}>
                                        {/* Display partial ID if it's long, or full if short */}
                                        {magnet.id.toString().length > 10 ? magnet.id.toString().substring(0, 8) + '...' : magnet.id}
                                    </div>
                                    
                                    <div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.word}
                                                onChange={(e) => setEditForm({...editForm, word: e.target.value})}
                                                style={styles.input}
                                                placeholder="Keyword"
                                                autoFocus
                                            />
                                        ) : (
                                            <span style={styles.keywordBadge}>
                                                {magnet.word}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        {isEditing ? (
                                            <textarea
                                                value={editForm.text}
                                                onChange={(e) => setEditForm({...editForm, text: e.target.value})}
                                                style={styles.textarea}
                                                placeholder="Reply text..."
                                            />
                                        ) : (
                                            <div style={styles.textDisplay}>
                                                {magnet.text || <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>No reply text configured</span>}
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.actions}>
                                        {isEditing ? (
                                            <>
                                                <button 
                                                    onClick={() => handleSave(magnet.id)}
                                                    disabled={saving}
                                                    style={{ ...styles.actionBtn('var(--status-approved)'), backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                                    title="Save"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button 
                                                    onClick={handleCancelEdit}
                                                    disabled={saving}
                                                    style={{ ...styles.actionBtn('var(--status-rejected)'), backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                                    title="Cancel"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => handleEditClick(magnet)}
                                                style={styles.actionBtn()}
                                                title="Edit"
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-body)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


export default LeadMagnets;
