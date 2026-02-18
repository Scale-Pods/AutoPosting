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
  Settings,
  Magnet,
  PanelLeft // Added
} from 'lucide-react';
import '../styles/global.css';
import CalendarView from './CalendarView';
import { dataService } from '../utils/dataService';

// Styles could be in a module, but keeping it simple with inline/global for this prototype
// In a real app, I'd use CSS modules or styled-components

const SidebarItem = ({ to, icon: Icon, label, onClick, end = false }) => (
  <NavLink 
    to={to} 
    end={end}
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
  // Initialize Sidebar state based on screen width
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isDark, setIsDark] = useState(false);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

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
      {/* Mobile Overlay - Only show if sidebar is open AND we are on mobile (screen < 768px) */}
      {isSidebarOpen && window.innerWidth < 768 && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          className="md:hidden"
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
        left: 0, // Always 0, we control visibility via transform or display
        zIndex: 50,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        // Mobile Logic: If open -> translate 0. If closed -> translate -100%.
        // Desktop Logic: If open -> sticky/visible (handled by media query override below?). 
        // actually simpler to use transform for mobile and width/display for desktop.
        transform: (window.innerWidth < 768 && !isSidebarOpen) ? 'translateX(-100%)' : 'none',
      }}
      className="md:relative" 
      // We will handle desktop toggling via inline style override or a class
      id="sidebar"
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
          <div>
             <img 
              src="/logo-light.png"
              alt="ScalePods Logo" 
              style={{ 
                width: '100%', 
                maxWidth: '180px', 
                height: 'auto', 
                margin: '0 auto', 
                display: 'block',
                filter: isDark ? 'none' : 'invert(1)'
              }}
             />
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          {userRole === 'designer' && (
             <>
               <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Workspace</div>
               <SidebarItem to="/designer" icon={LayoutDashboard} label="Assigned Tasks" end onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
               <SidebarItem to="/designer/sent" icon={CheckCircle} label="Sent for Review" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
               <SidebarItem to="/designer/rejected" icon={XCircle} label="Rejected Tasks" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
             </>
          )}

          {userRole === 'client' && (
             <>
               <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Campaigns</div>
               <SidebarItem to="/client" icon={Briefcase} label="All Campaigns" end onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
               <SidebarItem to="/client/lead-magnets" icon={Magnet} label="Lead Magnets" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
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
                    <SidebarItem 
                        to="/client/settings" 
                        icon={Settings} 
                        label="Settings" 
                        onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} 
                    />
                )}
              </>
           )}

           <div 
             onMouseEnter={() => setIsLogoutHovered(true)}
             onMouseLeave={() => setIsLogoutHovered(false)}
             onClick={handleLogout}
             style={{ 
               cursor: 'pointer',
               marginTop: '1rem',
               background: isLogoutHovered ? 'var(--status-rejected)' : 'var(--bg-card)', 
               borderRadius: 'var(--radius)', 
               border: isLogoutHovered ? '1px solid var(--status-rejected)' : '1px solid var(--border)',
               boxShadow: isLogoutHovered ? 'var(--shadow-md)' : 'none',
               transform: isLogoutHovered ? 'translateY(-2px)' : 'none',
               transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               height: '64px',
               position: 'relative',
               overflow: 'hidden',
               userSelect: 'none'
             }}
           >
             {/* Logout Content (Absolute) */}
             <div style={{ 
                position: 'absolute',
                inset: 0,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                fontWeight: 600,
                color: 'white',
                opacity: isLogoutHovered ? 1 : 0,
                transform: isLogoutHovered ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
             }}>
                <LogOut size={18} />
                <span>Logout</span>
             </div>

             {/* User Info Content */}
             <div style={{ 
                height: '100%',
                padding: '0.75rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                width: '100%',
                opacity: isLogoutHovered ? 0 : 1,
                transform: isLogoutHovered ? 'translateY(-20px)' : 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
             }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  {user?.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{userRole}</div>
                </div>
             </div>
           </div>
        </div>
      </aside>

      {/* Desktop Sidebar shim for layout flow (since fixed sidebar is taken out of flow) */}
       <div className="sidebar-shim" style={{ width: 'var(--sidebar-width)', flexShrink: 0, display: 'none' }}></div>
       <style>{`
           @media (min-width: 768px) {
             #sidebar { 
               display: ${isSidebarOpen ? 'flex' : 'none'} !important; 
               position: sticky !important; 
               top: 0 !important;
             }
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
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               style={{ padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
               title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
             >
               {isSidebarOpen ? <PanelLeft size={24} /> : <Menu size={24} />}
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
