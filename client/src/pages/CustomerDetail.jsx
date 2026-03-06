import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Tag, FileText, Plus, Edit2 } from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { 
    register: registerProject, 
    handleSubmit: handleSubmitProject, 
    reset: resetProject, 
    formState: { errors: projectErrors } 
  } = useForm();

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`);
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', id]);
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  });

  const handleEdit = () => {
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      type: customer.type || 'Residential',
      address: customer.address || '',
      city: customer.city || '',
      notes: customer.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/projects', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', id]);
      queryClient.invalidateQueries(['projects']);
      toast.success('Project created successfully');
      setIsProjectModalOpen(false);
      resetProject();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  });

  const onSubmitProject = (data) => {
    createProjectMutation.mutate({
      ...data,
      customerId: id, // Force current customer ID
      areaSqFt: parseFloat(data.areaSqFt),
      totalCost: parseFloat(data.totalCost),
      paidTillNow: parseFloat(data.paidTillNow) || 0,
      serviceType: [data.serviceType]
    });
  };

  const customer = customerData?.customer;
  const projects = customerData?.projects || [];

  if (isLoading) {
    return <PageWrapper title="Customer Details"><div className="skeleton" style={{ height: '200px' }} /></PageWrapper>;
  }

  if (!customer) {
    return <PageWrapper title="Customer Details"><p>Customer not found</p></PageWrapper>;
  }

  // Calculate totals using normalized project fields
  const totalBilled = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalReceived = projects.reduce((sum, p) => {
    const initialPaid = p.paidTillNow !== undefined ? p.paidTillNow : (p.advancePaid || 0);
    const historyTotal = p.paymentHistory?.reduce((s, ph) => s + (ph.amount || 0), 0) || 0;
    return sum + initialPaid + historyTotal;
  }, 0);
  const outstanding = totalBilled - totalReceived;

  return (
    <PageWrapper title="Customer Details">
      {/* Back Button */}
      <button
        onClick={() => navigate('/customers')}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Customers
      </button>

      {/* Customer Info Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{customer.name}</h2>
            <Badge status={customer.type === 'Commercial' ? 'warning' : customer.type === 'Industrial' ? 'danger' : 'success'}>
              {customer.type}
            </Badge>
          </div>
          <button
            onClick={handleEdit}
            className="btn btn-secondary"
          >
            <Edit2 size={16} style={{ marginRight: '8px' }} />
            Edit Customer
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {customer.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={20} color="var(--accent)" />
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Phone</p>
                <p>{customer.phone}</p>
              </div>
            </div>
          )}
          {customer.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={20} color="var(--accent)" />
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email</p>
                <p>{customer.email}</p>
              </div>
            </div>
          )}
          {customer.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapPin size={20} color="var(--accent)" />
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>City</p>
                <p>{customer.city}</p>
              </div>
            </div>
          )}
          {customer.type && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Tag size={20} color="var(--accent)" />
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Type</p>
                <p>{customer.type}</p>
              </div>
            </div>
          )}
        </div>

        {customer.address && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Address</p>
            <p>{customer.address}</p>
          </div>
        )}

        {customer.notes && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Notes</p>
            <p>{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Billing Summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} /> Billing Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Billed</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(totalBilled)}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Received</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(totalReceived)}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Outstanding</p>
            <p style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600, 
              color: outstanding > 0 ? 'var(--danger)' : 'var(--success)' 
            }}>
              {outstanding > 0 ? formatCurrency(outstanding) : '✓ Cleared'}
            </p>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} /> Projects ({projects.length})
          </h3>
          <button
            onClick={() => {
              resetProject({
                title: '',
                siteAddress: '',
                city: customer.city || '',
                serviceType: 'Waterproofing',
                areaSqFt: '',
                totalCost: '',
                paidTillNow: '0',
                startDate: new Date().toISOString().split('T')[0],
                status: 'Not Started'
              });
              setIsProjectModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {projects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{project.title}</span>
                  <Badge status={project.status} />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {project.serviceType?.join(' + ')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>Total: {formatCurrency(project.totalCost)}</span>
                  <span className={project.amountReceivable > 0 ? 'text-danger' : 'text-success'}>
                    {project.amountReceivable > 0 ? `Receivable: ${formatCurrency(project.amountReceivable)}` : '✓ Paid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No projects yet for this customer
          </p>
        )}
      </div>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Customer name"
            />
            {errors.name && <p className="text-danger">{errors.name.message}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone *</label>
              <input
                {...register('phone', { required: 'Phone is required' })}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="text-danger">{errors.phone.message}</p>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select {...register('type')}>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>
            <div className="form-group">
              <label>City</label>
              <input {...register('city')} placeholder="City name" />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea {...register('address')} rows={2} placeholder="Full address" />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Additional notes" />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Update Customer
            </Button>
          </div>
        </form>
      </Modal>
      {/* New Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={`New Project for ${customer?.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmitProject(onSubmitProject)}>
          <div className="form-group">
            <label>Project Title *</label>
            <input
              {...registerProject('title', { required: 'Title is required' })}
              placeholder="e.g., Roof Waterproofing"
            />
            {projectErrors.title && <p className="text-danger">{projectErrors.title.message}</p>}
          </div>

          <div className="form-group">
            <label>Site Address *</label>
            <input
              {...registerProject('siteAddress', { required: 'Site address is required' })}
              placeholder="Full site address"
            />
            {projectErrors.siteAddress && <p className="text-danger">{projectErrors.siteAddress.message}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input {...registerProject('city')} placeholder="City name" />
            </div>
            <div className="form-group">
              <label>Service Type *</label>
              <select {...registerProject('serviceType', { required: 'Service type is required' })}>
                <option value="Waterproofing">Waterproofing</option>
                <option value="Heatproofing">Heatproofing</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Area (sqft) *</label>
              <input
                {...registerProject('areaSqFt', { required: 'Area is required', valueAsNumber: true })}
                type="number"
                placeholder="1200"
              />
            </div>
            <div className="form-group">
              <label>Total Cost (₹) *</label>
              <input
                {...registerProject('totalCost', { required: 'Total cost is required', valueAsNumber: true })}
                type="number"
                placeholder="100000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Paid Till Now (₹)</label>
              <input
                {...registerProject('paidTillNow', { valueAsNumber: true })}
                type="number"
                placeholder="30000"
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input {...registerProject('startDate')} type="date" />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select {...registerProject('status')}>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createProjectMutation.isPending}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default CustomerDetail;
