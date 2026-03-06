import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import { Calendar, User, Building2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/formatCurrency';

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearch] = useState('');

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['admin-attendance', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/attendance?date=${selectedDate}`);
      return res.data.attendance;
    }
  });

  const filteredAttendance = attendanceData?.filter(record => 
    record.laborerId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.projectId?.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns = [
    { 
      header: 'Worker Name', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-input)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <User size={16} color="var(--accent)" />
          </div>
          <span style={{ fontWeight: 600 }}>{row.laborerId?.name || 'Unknown'}</span>
        </div>
      )
    },
    { 
      header: 'Assigned Project', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={14} color="var(--text-muted)" />
          <span>{row.projectId?.title || 'No Project'}</span>
        </div>
      )
    },
    { 
      header: 'Wage', 
      render: (row) => formatCurrency(row.wageForDay || 0) 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge status={row.present ? 'success' : 'danger'}>
          {row.present ? 'Present' : 'Absent'}
        </Badge>
      )
    },
    {
      header: 'Notes',
      accessor: 'note',
      render: (row) => row.note || '-'
    }
  ];

  return (
    <PageWrapper title="Attendance History">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <p style={{ color: 'var(--text-muted)' }}>
            View all workers present on a specific date.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Calendar
                size={18}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--accent)'
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search worker or site..."
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '250px' }}
              />
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats for the day */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem 1.5rem', flex: 1, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Workers</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{filteredAttendance.length}</h3>
          </div>
          <div className="card" style={{ padding: '1rem 1.5rem', flex: 1, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Present</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{filteredAttendance.filter(a => a.present).length}</h3>
          </div>
          <div className="card" style={{ padding: '1rem 1.5rem', flex: 1, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Absent</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{filteredAttendance.filter(a => !a.present).length}</h3>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table 
          columns={columns} 
          data={filteredAttendance} 
          loading={isLoading} 
          emptyMessage={`No attendance records found for ${format(new Date(selectedDate), 'dd MMM yyyy')}`} 
          rowStyle={(row) => ({
            backgroundColor: row.present ? 'rgba(47, 133, 90, 0.1)' : 'rgba(229, 62, 62, 0.1)'
          })}
        />
      </div>
    </PageWrapper>
  );
};

export default Attendance;
