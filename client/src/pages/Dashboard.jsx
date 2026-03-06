import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { AlertTriangle, TrendingUp, DollarSign, Users, Building2, Calendar } from 'lucide-react';
import Skeleton from '../components/common/Skeleton';
import Badge from '../components/common/Badge';
import { formatDate } from '../utils/formatDate';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay
} from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, loading }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color
        }}>
          <Icon size={24} />
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{title}</p>
          {loading ? (
            <Skeleton width="120px" height="28px" />
          ) : (
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{value}</h3>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.stats;
    }
  });

  const { data: alertsData } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const res = await api.get('/dashboard/alerts');
      return res.data.alerts;
    },
    refetchInterval: 60000
  });

  const { data: recentData } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: async () => {
      const res = await api.get('/dashboard/recent');
      return res.data.recent;
    }
  });

  useEffect(() => {
    if (alertsData?.imageDeletionWarnings?.length > 0) {
      setAlerts(alertsData.imageDeletionWarnings);
    }
  }, [alertsData]);

  const stats = [
    {
      title: 'Active Projects',
      value: statsData?.activeProjects || 0,
      icon: Building2,
      color: '#2C4A7C'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(statsData?.totalRevenueCollected || 0),
      icon: TrendingUp,
      color: '#2F855A'
    },
    {
      title: 'Customer Receivable',
      value: formatCurrency(statsData?.totalCustomerPending || 0),
      icon: DollarSign,
      color: statsData?.totalCustomerPending > 0 ? '#D97706' : '#2F855A'
    },
    {
      title: 'Supplier Due',
      value: formatCurrency(statsData?.totalSupplierDue || 0),
      icon: Users,
      color: statsData?.totalSupplierDue > 0 ? '#E53E3E' : '#2F855A'
    },
    {
      title: 'Labor Remaining',
      value: formatCurrency(statsData?.totalLaborPending || 0),
      icon: Users,
      color: statsData?.totalLaborPending > 0 ? '#D97706' : '#2F855A'
    }
  ];

  return (
    <PageWrapper title="Dashboard">
      {/* Image Deletion Warning Banner */}
      {alerts?.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(229, 62, 62, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <AlertTriangle size={24} color="var(--danger)" />
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Warning: {alerts.length} site images will be deleted soon
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Download them before they are permanently removed
            </p>
          </div>
          <a href="/images?expiring=true" className="btn btn-danger btn-sm">
            View Images
          </a>
        </div>
      )}

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} loading={statsLoading} />
        ))}
      </div>

      {/* Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Recent Projects */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Recent Projects</h3>
          {statsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[...Array(3)].map((_, idx) => (
                <Skeleton key={idx} height="60px" />
              ))}
            </div>
          ) : recentData?.recentProjects?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentData.recentProjects.map((project) => (
                <div
                  key={project._id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600 }}>{project.title}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {project.customerId?.name}
                    </p>
                  </div>
                  <Badge status={project.status} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No projects yet</p>
          )}
        </div>

        {/* Mini Attendance Calendar */}
        <div 
          className="card" 
          onClick={() => navigate('/attendance')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Attendance Calendar</h3>
            <Calendar size={20} color="var(--accent)" />
          </div>
          
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{format(new Date(), 'MMMM yyyy')}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, paddingBottom: '4px' }}>
                {day}
              </div>
            ))}
            {(() => {
              const monthStart = startOfMonth(new Date());
              const monthEnd = endOfMonth(monthStart);
              const startDate = startOfWeek(monthStart);
              const endDate = endOfWeek(monthEnd);
              const days = eachDayOfInterval({ start: startDate, end: endDate });
              
              return days.map((day, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    backgroundColor: isSameDay(day, new Date()) ? 'var(--accent)' : 'var(--bg-input)',
                    color: isSameDay(day, new Date()) ? '#000' : isSameMonth(day, monthStart) ? 'var(--text-primary)' : 'var(--text-muted)',
                    opacity: isSameMonth(day, monthStart) ? 1 : 0.3,
                    fontWeight: isSameDay(day, new Date()) ? 700 : 400
                  }}
                >
                  {format(day, 'd')}
                </div>
              ));
            })()}
          </div>
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
              Click to view full attendance history →
            </span>
          </div>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Active Sites Today</h3>
        {statsLoading ? (
          <Skeleton height="100px" />
        ) : recentData?.todayAttendance?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {recentData.todayAttendance.map((record) => (
              <div
                key={record._id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '6px'
                }}
              >
                <p style={{ fontWeight: 600 }}>{record.projectId?.title}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {record.laborerId?.name} - {record.present ? 'Present' : 'Absent'}
                </p>
                {record.present && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--success)' }}>
                    Wage: {formatCurrency(record.wageForDay)}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No attendance marked for today</p>
        )}
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
