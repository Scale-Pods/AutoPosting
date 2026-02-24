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
  BellRing,
  Palette,
  Briefcase,
  Sun,
  Moon,
  Settings,
  Magnet,
  PanelLeft,
  X
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
    <Icon size={20} className="mr-3" />
    <span>{label}</span>
  </NavLink>
);

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role;

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isDark, setIsDark] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [calendarViewType, setCalendarViewType] = useState(user?.role?.toLowerCase() === 'client' ? 'uploadDate' : 'deadline'); 
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('mw_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    localStorage.setItem('mw_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const fetchAndCheckUpdates = async () => {
    if (!user) return;
    const newTasks = await dataService.getTasks();
    if (!newTasks || newTasks.length === 0) return;

    const lastState = JSON.parse(localStorage.getItem('last_tasks_state') || '[]');
    const newNotes = [];
    const role = (user.role || '').toLowerCase();

    newTasks.forEach(task => {
        const oldTask = lastState.find(t => t.id === task.id);
        
        if (role === 'client') {
            if (task.status === 'Design Uploaded' && (!oldTask || oldTask.status !== 'Design Uploaded')) {
                newNotes.push({
                    id: `note-${Date.now()}-${task.id}`,
                    title: 'Design Uploaded',
                    message: `New design ready for ${task.campaignName}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                    taskId: task.id
                });
            }
        } else if (role === 'designer') {
            if (!oldTask) {
                newNotes.push({
                    id: `note-${Date.now()}-${task.id}`,
                    title: 'New Campaign Assigned',
                    message: `You have been assigned to ${task.campaignName}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                    taskId: task.id
                });
            }
        }
    });

    if (newNotes.length > 0) {
        setNotifications(prev => {
            // Avoid duplicate notifications for the same event
            const filteredNew = newNotes.filter(n => !prev.some(p => p.taskId === n.taskId && p.title === n.title));
            return [...filteredNew, ...prev].slice(0, 20);
        });
    }

    setCalendarTasks(newTasks);
    localStorage.setItem('last_tasks_state', JSON.stringify(newTasks));
  };

  useEffect(() => {
    if (user) {
        fetchAndCheckUpdates();
        const interval = setInterval(fetchAndCheckUpdates, 30000); 
        return () => clearInterval(interval);
    }
  }, [user]);

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
  }, [user, userRole]);

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
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '8px',
                        paddingRight: '4px'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {calendarViewType === 'uploadDate' ? 'Upload Schedule' : 'Deadlines'}
                        </div>
                        
                        {userRole === 'client' && (
                            <div style={{ 
                                display: 'flex', 
                                background: 'var(--bg-body)', 
                                borderRadius: '12px', 
                                padding: '2px',
                                border: '1px solid var(--border)'
                            }}>
                                <button 
                                    onClick={() => setCalendarViewType('uploadDate')}
                                    style={{
                                        fontSize: '0.65rem',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: calendarViewType === 'uploadDate' ? 'var(--primary)' : 'transparent',
                                        color: calendarViewType === 'uploadDate' ? 'white' : 'var(--text-muted)',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Show Upload Dates"
                                >
                                    Upload
                                </button>
                                <button 
                                    onClick={() => setCalendarViewType('deadline')}
                                    style={{
                                        fontSize: '0.65rem',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: calendarViewType === 'deadline' ? 'var(--primary)' : 'transparent',
                                        color: calendarViewType === 'deadline' ? 'white' : 'var(--text-muted)',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Show Deadlines"
                                >
                                    Deadlines
                                </button>
                            </div>
                        )}
                    </div>
                    <CalendarView 
                        tasks={calendarTasks} 
                        compact={true} 
                        dateKey={calendarViewType} 
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

             <div style={{ position: 'relative' }}>
               <button 
                 onClick={() => setShowNotifications(!showNotifications)}
                 style={{ 
                    position: 'relative', 
                    color: showNotifications ? 'var(--primary)' : 'var(--text-muted)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: showNotifications ? 'var(--primary-light)' : 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s'
                 }}
                 title="Notifications"
               >
                 {notifications.some(n => !n.read) ? <BellRing size={20} /> : <Bell size={20} />}
                 {notifications.some(n => !n.read) && (
                   <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--primary)', border: '2px solid var(--bg-card)', borderRadius: '50%' }}></span>
                 )}
               </button>

               {showNotifications && (
                 <>
                   {/* Click away overlay */}
                   <div 
                     onClick={() => setShowNotifications(false)} 
                     style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                   />
                   
                   <div style={{ 
                       position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '320px', 
                       background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', 
                       boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
                       animation: 'slideDown 0.2s ease-out'
                   }}>
                     <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
                       <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                       {notifications.some(n => !n.read) && (
                         <button 
                           onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))} 
                           style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                         >
                           Mark all read
                         </button>
                       )}
                     </div>
                     <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                       {notifications.length === 0 ? (
                           <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                               <Bell size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                               <p>No notifications yet.</p>
                           </div>
                       ) : (
                           notifications.map(n => (
                               <div 
                                   key={n.id} 
                                   style={{ 
                                       padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                       background: n.read ? 'transparent' : 'var(--primary-light)',
                                       display: 'flex', flexDirection: 'column', gap: '4px',
                                       transition: 'background 0.2s'
                                   }}
                                   onClick={() => {
                                       setNotifications(notifications.map(note => note.id === n.id ? {...note, read: true} : note));
                                       setShowNotifications(false);
                                       if (n.taskId) {
                                           // Find the task in calendarTasks to potentially open modal
                                           const task = calendarTasks.find(t => t.id === n.taskId);
                                           if (task) {
                                               setSelectedDate(task.uploadDate || task.deadline);
                                               setSelectedDateTasks([task]);
                                           }
                                       }
                                   }}
                               >
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                                       <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                           {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></span>}
                                           {n.title}
                                       </span>
                                       <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{n.time}</span>
                                   </div>
                                   <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{n.message}</span>
                               </div>
                           ))
                       )}
                     </div>
                     {notifications.length > 0 && (
                        <div style={{ padding: '8px', textAlign: 'center', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
                            <button 
                                onClick={() => setNotifications([])}
                                style={{ fontSize: '0.75rem', color: 'var(--status-rejected)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Clear all
                            </button>
                        </div>
                     )}
                   </div>
                 </>
               )}
             </div>

           </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
           <Outlet context={{ refreshCalendar: fetchAndCheckUpdates }} />
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
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{task.campaignName}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>{task.status}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.postType}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <strong>{calendarViewType === 'uploadDate' ? 'Upload' : 'Deadline'}:</strong> {task[calendarViewType]} 
                                {calendarViewType === 'uploadDate' && task.uploadTime && ` at ${task.uploadTime}`}
                            </div>
                            {task.designerName && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Designer: {task.designerName}</div>}
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
