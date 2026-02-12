import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarView = ({ tasks, onDateClick, compact = false, dateKey = 'deadline' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Empty slots for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Generate days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    // Find tasks for this date
    const dayTasks = tasks.filter(t => t[dateKey] === dateStr); // Use dynamic dateKey
    const hasTask = dayTasks.length > 0;

    days.push(
      <div 
        key={i} 
        className={`calendar-day ${hasTask ? 'has-task' : ''}`}
        onClick={() => onDateClick(dateStr, dayTasks)}
        style={{
            border: compact ? 'none' : '1px solid var(--border)',
            minHeight: compact ? '30px' : '80px',
            padding: compact ? '2px' : '8px',
            cursor: 'pointer',
            backgroundColor: hasTask ? 'var(--primary-light)' : (compact ? 'transparent' : 'var(--bg-card)'),
            color: hasTask && compact ? 'var(--primary)' : 'inherit',
            position: 'relative',
            borderRadius: compact ? '50%' : '0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: compact ? '0.75rem' : '0.875rem',
            fontWeight: hasTask ? 600 : 400
        }}
        onMouseEnter={e => {
            if (!compact) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.zIndex = '10';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }
        }}
        onMouseLeave={e => {
            if (!compact) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.zIndex = '1';
                e.currentTarget.style.boxShadow = 'none';
            }
        }}
      >
        <div>{i}</div>
        
        {/* Task Dots/Previews - Only show full details if NOT compact */}
        {!compact && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: '4px' }}>
                {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} style={{ 
                        fontSize: '0.65rem', 
                        padding: '2px 4px', 
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'left'
                    }}>
                        {task.campaignName}
                    </div>
                ))}
                {dayTasks.length > 3 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        +{dayTasks.length - 3} more
                    </div>
                )}
            </div>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "" : "card"} style={{ marginBottom: compact ? '1rem' : '2rem', padding: compact ? '0.5rem' : '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: compact ? '0.9rem' : '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!compact && <CalendarIcon />}
            {monthNames[currentDate.getMonth()]} {compact ? '' : currentDate.getFullYear()}
        </h2>
        <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: '2px' }}><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: '2px' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: compact ? '2px' : '8px' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', paddingBottom: '0.25rem', fontSize: '0.75rem' }}>
                {d}
            </div>
        ))}
        {days}
      </div>
    </div>
  );
};

export default CalendarView;
