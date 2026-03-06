import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Camera, Calendar, DollarSign, MapPin, Building2, X, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';

const LaborerHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [uploadingProjectId, setUploadingProjectId] = useState(null);
  const [caption, setCaption] = useState('');
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get logged-in laborer's attendance for the current month (to mark green on calendar)
  const { data: monthlyAttendance } = useQuery({
    queryKey: ['my-monthly-attendance', format(currentMonth, 'yyyy-MM'), user?._id],
    queryFn: async () => {
      const res = await api.get(`/attendance?month=${format(currentMonth, 'M')}&year=${format(currentMonth, 'yyyy')}`);
      return res.data.attendance || [];
    },
    enabled: !!user?._id
  });

  // Get all projects assigned to this laborer
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['laborer-projects', user?._id],
    queryFn: async () => {
      const res = await api.get(`/projects?laborerId=${user._id}`);
      return res.data.projects || [];
    },
    enabled: !!user?._id
  });

  // Get balance summary
  const { data: balanceData } = useQuery({
    queryKey: ['laborer-balance', user?._id],
    queryFn: async () => {
      const res = await api.get(`/laborers/${user._id}/balance`);
      return res.data.balance || { totalEarned: 0, totalPaid: 0, balance: 0 };
    },
    enabled: !!user?._id
  });

  // Get attendance for selected date (for ALL workers)
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['all-attendance', formattedDate],
    queryFn: async () => {
      const res = await api.get(`/attendance?date=${formattedDate}`);
      return res.data.attendance || [];
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ projectId, file, caption }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('projectId', projectId);
      if (caption) formData.append('caption', caption);
      
      const res = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Image uploaded successfully');
      setUploadingProjectId(null);
      setCaption('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    }
  });

  const handleImageUpload = (projectId, e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImageMutation.mutate({ projectId, file, caption });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  // Calendar Rendering Helpers
  const renderHeader = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{format(currentMonth, 'MMMM yyyy')}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-input)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-input)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>
        {days.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        // Check if user was present on this day
        const isPresent = monthlyAttendance?.some(a => isSameDay(new Date(a.date), cloneDay) && a.present);
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        
        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            style={{
              height: '45px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.875rem',
              borderRadius: '8px',
              backgroundColor: isSelected 
                ? 'var(--accent)' 
                : isPresent 
                  ? 'rgba(47, 133, 90, 0.4)' // Success green with transparency
                  : 'transparent',
              color: isSelected 
                ? '#000' 
                : !isSameMonth(day, monthStart) 
                  ? 'var(--text-muted)' 
                  : 'var(--text-primary)',
              fontWeight: (isSelected || isPresent) ? 700 : 400,
              opacity: !isSameMonth(day, monthStart) ? 0.3 : 1,
              border: isToday && !isSelected ? '1px solid var(--accent)' : 'none'
            }}
          >
            <span>{format(day, 'd')}</span>
            {isPresent && !isSelected && (
              <div style={{ 
                width: '4px', 
                height: '4px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--success)',
                marginTop: '2px' 
              }} />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.5rem 1rem',
        borderBottom: `1px solid var(--border)`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{greeting}, {user?.name} 👋</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: 'auto' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* BIG CALENDAR SECTION */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'rgba(47, 133, 90, 0.4)', borderRadius: '2px' }} />
              <span>Present</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '10px', height: '10px', border: '1px solid var(--accent)', borderRadius: '2px' }} />
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* ATTENDANCE DISPLAY FOR SELECTED DATE */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--accent)" /> 
            Attendance: {format(selectedDate, 'dd MMM yyyy')}
          </h3>
          
          {attendanceLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Loading attendance...</p>
          ) : attendanceData && attendanceData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attendanceData.map((record) => (
                <div 
                  key={record._id} 
                  style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'var(--bg-input)', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: `4px solid ${record.present ? 'var(--success)' : 'var(--danger)'}`
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600 }}>{record.laborerId?.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Site: {record.projectId?.title || 'Unknown'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {record.present ? (
                      <Badge status="success">Present</Badge>
                    ) : (
                      <Badge status="danger">Absent</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              <p>No attendance records for this date.</p>
            </div>
          )}
        </div>

        {/* Earnings Summary */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="var(--accent)" /> My Earnings
          </h3>
          {balanceData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Total Received</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>
                  {formatCurrency(balanceData.totalPaid)}
                </p>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Remaining</p>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: balanceData.balance > 0 ? 'var(--danger)' : 'var(--success)'
                }}>
                  {balanceData.balance > 0 ? formatCurrency(balanceData.balance) : '✓ Cleared'}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Loading earnings...</p>
          )}
        </div>

        {/* All Assigned Projects */}
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}>
          <Building2 size={20} color="var(--accent)" /> My Assigned Projects ({projectsData?.length || 0})
        </h3>
        
        {projectsLoading ? (
          <div className="card skeleton" style={{ height: '150px' }} />
        ) : projectsData && projectsData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projectsData.map((project) => (
              <div key={project._id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{project.title}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {project.siteAddress}
                    </p>
                  </div>
                  <Badge status={project.status} size="sm" />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {project.serviceType?.map((type, idx) => (
                    <Badge key={idx} status="info" size="sm">{type}</Badge>
                  ))}
                  <Badge status="secondary" size="sm">{project.areaSqFt} sqft</Badge>
                </div>

                <div style={{ 
                  borderTop: `1px solid var(--border)`,
                  paddingTop: '1rem',
                  marginTop: '0.5rem'
                }}>
                  {uploadingProjectId === project._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Upload Site Photo</p>
                        <button 
                          onClick={() => setUploadingProjectId(null)} 
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Add a caption (optional)" 
                        className="form-control"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        style={{ fontSize: '0.875rem' }}
                      />
                      <label className="btn btn-primary" style={{ width: '100%', cursor: 'pointer' }}>
                        {uploadImageMutation.isPending ? 'Uploading...' : 'Select & Upload Photo'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(project._id, e)}
                          style={{ display: 'none' }}
                          disabled={uploadImageMutation.isPending}
                        />
                      </label>
                    </div>
                  ) : (
                    <Button 
                      variant="secondary" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => setUploadingProjectId(project._id)}
                    >
                      <Camera size={18} /> Upload Site Photo
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>No projects assigned yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaborerHome;
