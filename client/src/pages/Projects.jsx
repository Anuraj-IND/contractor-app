import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';
import { useDebounce } from '../hooks/useDebounce';

const Projects = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm();

  const watchArea = watch('areaSqFt');
  const watchRate = watch('ratePerSqFt');

  useEffect(() => {
    const area = parseFloat(watchArea) || 0;
    const rate = parseFloat(watchRate) || 0;
    if (area > 0 && rate > 0) {
      setValue('totalCost', area * rate);
    }
  }, [watchArea, watchRate, setValue]);

  const { data: projectsData, isLoading, refetch } = useQuery({
    queryKey: ['projects', debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      const res = await api.get(`/projects?${params}`);
      return res.data.projects;
    }
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.customers;
    }
  });

  const { data: laborersData } = useQuery({
    queryKey: ['laborers-list'],
    queryFn: async () => {
      const res = await api.get('/laborers');
      return res.data.laborers;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/projects', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Project created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  });

  const onSubmit = (data) => {
    const assignedLaborers = Array.isArray(data.assignedLaborers) ? data.assignedLaborers.filter(Boolean) : [];
    createMutation.mutate({
      ...data,
      areaSqFt: parseFloat(data.areaSqFt),
      ratePerSqFt: parseFloat(data.ratePerSqFt) || 0,
      totalCost: parseFloat(data.totalCost),
      paidTillNow: parseFloat(data.paidTillNow) || 0,
      serviceType: Array.isArray(data.serviceType) ? data.serviceType : [data.serviceType],
      assignedLaborers: assignedLaborers.length > 0 ? assignedLaborers : undefined
    });
  };

  return (
    <PageWrapper title="Projects">
      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        <Button onClick={() => {
          reset({
            customerId: '',
            title: '',
            siteAddress: '',
            city: '',
            serviceType: 'Waterproofing',
            areaSqFt: '',
            totalCost: '',
            paidTillNow: '0',
            startDate: new Date().toISOString().split('T')[0],
            status: 'Not Started'
          });
          setIsModalOpen(true);
        }}>
          <Plus size={20} /> New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ height: '200px' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      ) : projectsData?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {projectsData.map((project) => (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className="card"
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <Badge status={project.status} />
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {project.serviceType?.map((type, idx) => (
                    <Badge key={idx} status="info">{type}</Badge>
                  ))}
                </div>
              </div>

              <h3 style={{ marginBottom: '0.5rem' }}>{project.title}</h3>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {project.customerId?.name} {project.customerId?.city ? `• ${project.customerId.city}` : ''}
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Area: {project.areaSqFt} sqft
                </p>
              </div>

              {/* Payment Progress */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>{formatCurrency((project.paidTillNow || 0) + (project.paymentHistory?.reduce((s, p) => s + p.amount, 0) || 0))} paid</span>
                  <span>{formatCurrency(project.totalCost)} total</span>
                </div>
                <div style={{ 
                  height: '8px', 
                  backgroundColor: 'var(--bg-input)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${Math.min(100, (((project.paidTillNow || 0) + (project.paymentHistory?.reduce((s, p) => s + p.amount, 0) || 0)) / project.totalCost) * 100)}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent)'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Start: {new Date(project.startDate).toLocaleDateString()}
                </p>
                {project.amountReceivable > 0 ? (
                  <span className="text-danger" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Due: {formatCurrency(project.amountReceivable)}
                  </span>
                ) : (
                  <span className="text-success" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    ✓ Paid
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No projects found</p>
        </div>
      )}

      {/* Add Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="New Project"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Customer *</label>
            <select {...register('customerId', { required: 'Customer is required' })}>
              <option value="">Select Customer</option>
              {customersData?.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.city}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Project Title *</label>
            <input
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Roof Waterproofing - Sharma Residence"
            />
            {errors.title && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Site Address *</label>
            <input
              {...register('siteAddress', { required: 'Site address is required' })}
              placeholder="Full site address"
            />
            {errors.siteAddress && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.siteAddress.message}
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input {...register('city')} placeholder="City name" />
            </div>
            <div className="form-group">
              <label>Service Type *</label>
              <select {...register('serviceType', { required: 'Service type is required' })}>
                <option value="Waterproofing">Waterproofing</option>
                <option value="Heatproofing">Heatproofing</option>
              </select>
              {errors.serviceType && (
                <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.serviceType.message}
                </p>
              )}
            </div>
          </div>
<div className="form-row">
  <div className="form-group">
    <label>Area (sqft) *</label>
    <input
      {...register('areaSqFt', { required: 'Area is required', valueAsNumber: true })}
      type="number"
      placeholder="1200"
    />
    {errors.areaSqFt && (
      <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
        {errors.areaSqFt.message}
      </p>
    )}
  </div>
  <div className="form-group">
    <label>Rate per SqFt (₹)</label>
    <input
      {...register('ratePerSqFt', { valueAsNumber: true })}
      type="number"
      placeholder="85"
    />
  </div>
</div>

<div className="form-row">
  <div className="form-group">
    <label>Total Cost (₹) *</label>
    <input
      {...register('totalCost', { required: 'Total cost is required', valueAsNumber: true })}
      type="number"
      placeholder="100000"
    />
    {errors.totalCost && (
      <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
        {errors.totalCost.message}
      </p>
    )}
  </div>
  <div className="form-group">
    <label>Paid Till Now (₹)</label>
    <input
      {...register('paidTillNow', { valueAsNumber: true })}
      type="number"
      placeholder="30000"
    />
  </div>
</div>

          <div className="form-group">
            <label>Start Date</label>
            <input {...register('startDate')} type="date" />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select {...register('status')}>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Additional notes" />
          </div>

          <div className="form-group">
            <label>Assign Laborers (Optional)</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem' }}>
              {laborersData?.map((laborer) => (
                <label key={laborer._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                  <input
                    type="checkbox"
                    {...register('assignedLaborers')}
                    value={laborer._id}
                  />
                  <span>{laborer.name}</span>
                </label>
              ))}
              {(!laborersData || laborersData.length === 0) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No laborers available</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Projects;
