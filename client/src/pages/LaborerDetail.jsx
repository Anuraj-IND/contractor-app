import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Badge from '../components/common/Badge';
import Table from '../components/common/Table';
import { 
  Calendar, 
  DollarSign, 
  Building2, 
  Phone, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

const LaborerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Get laborer details
  const { data: laborer, isLoading: laborerLoading } = useQuery({
    queryKey: ['laborer', id],
    queryFn: async () => {
      const res = await api.get(`/laborers/${id}`);
      return res.data.laborer;
    }
  });

  // Get laborer balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['laborer-balance', id],
    queryFn: async () => {
      const res = await api.get(`/laborers/${id}/balance`);
      return res.data.balance;
    }
  });

  // Get projects assigned to this laborer
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['laborer-projects', id],
    queryFn: async () => {
      const res = await api.get(`/projects?laborerId=${id}`);
      return res.data.projects;
    }
  });

  // Get attendance history
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['laborer-attendance', id],
    queryFn: async () => {
      const res = await api.get(`/attendance?laborerId=${id}`);
      return res.data.attendance;
    }
  });

  if (laborerLoading) return <PageWrapper title="Loading..."><div className="skeleton" style={{ height: '400px' }}></div></PageWrapper>;
  if (!laborer) return <PageWrapper title="Not Found"><div>Laborer not found</div></PageWrapper>;

  const attendanceColumns = [
    { header: 'Date', render: (row) => formatDate(row.date) },
    { header: 'Project', render: (row) => row.projectId?.title || 'N/A' },
    { 
      header: 'Status', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {row.present ? (
            <><CheckCircle2 size={16} className="text-success" /> <span>Present</span></>
          ) : (
            <><XCircle size={16} className="text-danger" /> <span>Absent</span></>
          )}
        </div>
      )
    },
    { header: 'Wage', render: (row) => formatCurrency(row.dailyWage || laborer.defaultDailyWage) }
  ];

  return (
    <PageWrapper title={`Laborer: ${laborer.name}`}>
      <button 
        onClick={() => navigate('/laborers')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'none', 
          border: 'none', 
          color: 'var(--accent)', 
          cursor: 'pointer',
          marginBottom: '1.5rem',
          padding: 0
        }}
      >
        <ArrowLeft size={18} /> Back to Laborers
      </button>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(66, 153, 225, 0.1)', color: '#4299E1' }}>
            <Phone size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Phone</p>
            <p className="stat-value" style={{ fontSize: '1.25rem' }}>{laborer.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(72, 187, 120, 0.1)', color: '#48BB78' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Default Wage</p>
            <p className="stat-value">{formatCurrency(laborer.defaultDailyWage)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(237, 137, 54, 0.1)', color: '#ED8936' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Paid</p>
            <p className="stat-value">{balanceLoading ? '...' : formatCurrency(balanceData?.totalPaid || 0)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#F56565' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Left to Pay</p>
            <p className={`stat-value ${(balanceData?.balance || 0) > 0 ? 'text-danger' : 'text-success'}`}>
              {balanceLoading ? '...' : formatCurrency(balanceData?.balance || 0)}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Assigned Projects */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="var(--accent)" /> Assigned Projects
          </h3>
          {projectsLoading ? (
            <div className="skeleton" style={{ height: '200px' }}></div>
          ) : projects && projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {projects.map(project => (
                <div 
                  key={project._id}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  style={{ 
                    padding: '1rem', 
                    backgroundColor: 'var(--bg-input)', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    border: '1px solid var(--border)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 600 }}>{project.title}</p>
                    <Badge status={project.status} size="sm" />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {project.siteAddress}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No projects assigned to this laborer.
            </p>
          )}
        </div>

        {/* Attendance History */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--accent)" /> Recent Attendance
          </h3>
          <Table 
            columns={attendanceColumns} 
            data={attendance?.slice(0, 10)} 
            loading={attendanceLoading}
            emptyMessage="No attendance records found"
          />
          {attendance && attendance.length > 10 && (
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Showing last 10 records
            </p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default LaborerDetail;
