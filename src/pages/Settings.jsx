import React, { useState, useEffect } from 'react';
import { dataService } from '../utils/dataService';
import { UserPlus, Mail, User } from 'lucide-react';

const Settings = () => {
  const [designers, setDesigners] = useState([]);
  const [newDesigner, setNewDesigner] = useState({ name: '', email: '' });
  const [isFormOpen, setIsFormOpen] = useState(false); // [NEW] Toggle state

  const loadDesigners = async () => {
    const list = await dataService.getDesigners();
    setDesigners(list || []);
  };

  useEffect(() => {
    loadDesigners();
  }, []);

  const handleAddDesigner = async (e) => {
    e.preventDefault();
    if (!newDesigner.name || !newDesigner.email) return;
    
    await dataService.addDesigner(newDesigner);
    setNewDesigner({ name: '', email: '' });
    setIsFormOpen(false); // Close after save
    loadDesigners();
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Settings</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage your team and preferences.</p>

      <div className="card" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            style={{ 
                width: '100%',
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                color: 'var(--text-main)'
            }}
        >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <UserPlus size={20} /> Add New Designer
            </h2>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{isFormOpen ? '−' : '+'}</span>
        </button>
        
        {isFormOpen && (
            <form onSubmit={handleAddDesigner} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={newDesigner.name}
                    onChange={e => setNewDesigner({...newDesigner, name: e.target.value})}
                    style={{ width: '100%', paddingLeft: '34px' }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Email</label>
                 <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    placeholder="e.g. john@company.com"
                    value={newDesigner.email}
                    onChange={e => setNewDesigner({...newDesigner, email: e.target.value})}
                    style={{ width: '100%', paddingLeft: '34px' }}
                  />
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Save Designer</button>
            </form>
        )}
      </div>

      <div className="card">
         <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Current Designers</h2>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {designers.map(d => (
              <div key={d.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--border)', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-body)'
              }}>
                 <div>
                   <div style={{ fontWeight: 600 }}>{d.name}</div>
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{d.email}</div>
                 </div>
                 <div style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-success-subtle)', color: 'var(--text-success)' }}>Active</div>
              </div>
            ))}
            {designers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No designers added yet.</p>}
         </div>
      </div>
    </div>
  );
};

export default Settings;
