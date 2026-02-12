import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  XCircle, 
  CheckCircle, 
  LogOut, 
  Menu,
  Bell,
  Palette,
  Briefcase,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import '../styles/global.css';
import CalendarView from './CalendarView';
import { dataService } from '../utils/dataService';

// Styles could be in a module, but keeping it simple with inline/global for this prototype
// In a real app, I'd use CSS modules or styled-components

const SidebarItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `btn btn-ghost w-full justify-start text-left mb-1 ${isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`
    }
    style={({ isActive }) => ({
       backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
       color: isActive ? 'var(--primary)' : 'var(--text-muted)'
    })}
    onClick={onClick}
  >
    <Icon size={20} />
    <span style={{ marginLeft: '12px' }}>{label}</span>
  </NavLink>
);

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);

  // Robust role check
  const userRole = (user?.role || '').toLowerCase();

  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('mw_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      setIsDark(true);
    }

    // Fetch tasks for calendar (for both client and designer now)
    if (userRole === 'client' || userRole === 'designer') {
        dataService.getTasks().then(setCalendarTasks);
    }
  }, [user]);

  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.remove('dark');
      localStorage.setItem('mw_theme', 'light');
      setIsDark(false);
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('mw_theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null; // Should be handled by route protection, but safety check

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} 
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: mobileMenuOpen ? 0 : '-100%',
        zIndex: 50,
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="md:relative md:left-0"
      id="sidebar"
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
             <img 
              src="https://framerusercontent.com/images/sTvMZBHEzwH4fTjPgKO2PS3htho.png?scale-down-to=2048&width=2363&height=2363" 
              alt="Logo" 
              style={{ width: '80%', height: '50px', objectFit: 'cover', objectPosition: 'center' }}
             />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>Auto Post System</div>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          {userRole === 'designer' && (
             <>
               <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Workspace</div>
               <SidebarItem to="/designer" icon={LayoutDashboard} label="Assigned Tasks" onClick={() => setMobileMenuOpen(false)} />
               <SidebarItem to="/designer/sent" icon={CheckCircle} label="Sent for Review" onClick={() => setMobileMenuOpen(false)} />
               <SidebarItem to="/designer/rejected" icon={XCircle} label="Rejected Tasks" onClick={() => setMobileMenuOpen(false)} />
             </>
          )}

          {userRole === 'client' && (
             <>
               <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Campaigns</div>
               <SidebarItem to="/client" icon={Briefcase} label="All Campaigns" onClick={() => setMobileMenuOpen(false)} />
             </>
          )}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
           {(userRole === 'client' || userRole === 'designer') && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        {userRole === 'client' ? 'Upload Schedule' : 'Deadlines'}
                    </div>
                    <CalendarView 
                        tasks={calendarTasks} 
                        compact={true} 
                        dateKey={userRole === 'client' ? 'uploadDate' : 'deadline'} // Use uploadDate for clients, deadline for designers
                        onDateClick={(date, dayTasks) => {
                            setSelectedDate(date);
                            setSelectedDateTasks(dayTasks);
                        }} 
                    />
                </div>

                {userRole === 'client' && (
                    <NavLink 
                        to="/client/settings" 
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) => 
                        `btn btn-ghost w-full justify-center mb-2 ${isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`
                        }
                        style={({ isActive }) => ({
                            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                        })}
                    >
                        <Settings size={20} />
                        <span style={{ marginLeft: '12px' }}>Settings</span>
                    </NavLink>
                )}
              </>
           )}

           <button 
             onClick={handleLogout} 
             className="btn btn-outline"
             style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)' }}
           >
             <LogOut size={16} /> Logout
           </button>
        </div>
      </aside>

      {/* Desktop Sidebar shim for layout flow (since fixed sidebar is taken out of flow) */}
       <div className="sidebar-shim" style={{ width: 'var(--sidebar-width)', flexShrink: 0, display: 'none' }}></div>
       <style>{`
          @media (min-width: 768px) {
            #sidebar { left: 0 !important; position: sticky !important; }
            /* Shim removed as sticky takes space */
          }
       `}</style>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{ 
          height: 'var(--header-height)', 
          backgroundColor: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <button 
               className="md:hidden" 
               onClick={() => setMobileMenuOpen(true)}
               style={{ padding: '4px' }}
             >
               <Menu size={24} />
             </button>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
               {userRole === 'designer' ? 'Designer Workspace' : 'Client Dashboard'}
             </h2>
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <button onClick={toggleTheme} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} title="Toggle Theme">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <button style={{ position: 'relative', color: 'var(--text-muted)' }}>
               <Bell size={20} />
               <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'red', borderRadius: '50%' }}></span>
             </button>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user?.name?.[0] || '?'}
                </div>
                <span className="hidden md:block" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.name}</span>
             </div>
           </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
           <Outlet />
        </main>
      {/* Date Details Modal (Global) */}
      {selectedDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
           <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedDate}</h2>
                 <button onClick={() => setSelectedDate(null)} className="btn btn-ghost" style={{ padding: '4px' }}><XCircle size={20} /></button>
              </div>

              {selectedDateTasks.length === 0 ? (
                 <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nothing scheduled.
                 </div>
              ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedDateTasks.map(task => (
                        <div key={task.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-body)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.campaignName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.status}</div>
                            {task.designerName && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Designer: {task.designerName}</div>}
                        </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
      )}

    </div>
  </div>
  );
};


export default DashboardLayout;
