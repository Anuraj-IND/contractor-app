import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { ArrowLeft, Plus, Users, Image, FileText, Camera, Trash2, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLaborerModalOpen, setIsLaborerModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: editErrors }, watch, setValue: setEditValue } = useForm();

  const watchArea = watch('areaSqFt');
  const watchRate = watch('ratePerSqFt');

  useEffect(() => {
    const area = parseFloat(watchArea) || 0;
    const rate = parseFloat(watchRate) || 0;
    if (area > 0 && rate > 0) {
      setEditValue('totalCost', area * rate);
    }
  }, [watchArea, watchRate, setEditValue]);

  const { data: projectData, isLoading, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data.project;
    },
    enabled: id && id !== 'new' && id.length === 24
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.customers;
    }
  });

  const { data: imagesData } = useQuery({
    queryKey: ['project-images', id],
    queryFn: async () => {
      const res = await api.get(`/images?projectId=${id}`);
      return res.data.images;
    },
    enabled: id && id !== 'new' && id.length === 24
  });

  const { data: laborersData } = useQuery({
    queryKey: ['laborers-list'],
    queryFn: async () => {
      const res = await api.get('/laborers');
      return res.data.laborers;
    }
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['project-attendance', id, attendanceDate],
    queryFn: async () => {
      const res = await api.get(`/attendance?projectId=${id}&date=${attendanceDate}`);
      return res.data.attendance;
    },
    enabled: id && id !== 'new' && id.length === 24
  });

  const assignLaborerMutation = useMutation({
    mutationFn: async (laborerId) => {
      const res = await api.post(`/projects/${id}/laborers`, { laborerId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast.success('Laborer assigned successfully');
      setIsLaborerModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign laborer');
    }
  });

  const removeLaborerMutation = useMutation({
    mutationFn: async (laborerId) => {
      await api.delete(`/projects/${id}/laborers/${laborerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast.success('Laborer removed from project');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove laborer');
    }
  });

  const handleAssignLaborer = (laborerId) => {
    assignLaborerMutation.mutate(laborerId);
  };

  const handleRemoveLaborer = (laborerId) => {
    if (window.confirm('Are you sure you want to remove this laborer from the project?')) {
      removeLaborerMutation.mutate(laborerId);
    }
  };

  const uploadImageMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-images', id]);
      toast.success('Image uploaded successfully');
      setIsImageModalOpen(false);
      setSelectedImage(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId) => {
      await api.delete(`/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-images', id]);
      toast.success('Image deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    }
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('projectId', id);
      uploadImageMutation.mutate(formData);
    }
  };

  const updateProjectMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/projects/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast.success('Project updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update project');
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
      navigate('/projects');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  });

  const handleEdit = () => {
    resetEdit({
      customerId: project.customerId?._id,
      title: project.title,
      siteAddress: project.siteAddress,
      city: project.city || '',
      serviceType: project.serviceType?.[0] || 'Waterproofing',
      areaSqFt: project.areaSqFt,
      ratePerSqFt: project.ratePerSqFt || 0,
      totalCost: project.totalCost,
      paidTillNow: project.paidTillNow || 0,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: project.status || 'Not Started',
      notes: project.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete project "${project.title}"? This action cannot be undone.`)) {
      deleteProjectMutation.mutate();
    }
  };

  const onSubmitEdit = (data) => {
    updateProjectMutation.mutate({
      ...data,
      areaSqFt: parseFloat(data.areaSqFt),
      ratePerSqFt: parseFloat(data.ratePerSqFt) || 0,
      totalCost: parseFloat(data.totalCost),
      paidTillNow: parseFloat(data.paidTillNow) || 0,
      serviceType: [data.serviceType]
    });
  };

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ laborerId, present, wageForDay, advancePaidToday }) => {
      const res = await api.post('/attendance', {
        projectId: id,
        laborerId,
        date: attendanceDate,
        present,
        wageForDay,
        advancePaidToday
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-attendance', id]);
      toast.success('Attendance marked successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  });

  const handleMarkAttendance = (laborerId, present) => {
    const existingAttendance = attendanceData?.find(a => a.laborerId._id === laborerId);
    markAttendanceMutation.mutate({
      laborerId,
      present,
      wageForDay: existingAttendance?.wageForDay,
      advancePaidToday: existingAttendance?.advancePaidToday || 0
    });
  };

  if (isLoading) {
    return <PageWrapper title="Project Details"><div className="skeleton" style={{ height: '200px' }} /></PageWrapper>;
  }

  if (!projectData) {
    return <PageWrapper title="Project Details"><p>Project not found</p></PageWrapper>;
  }

  const project = projectData;

  return (
    <PageWrapper title="Project Details">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Button
          variant="secondary"
          onClick={() => navigate('/projects')}
          size="sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '100px', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} /> Back
        </Button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant="secondary" 
            onClick={handleEdit} 
            size="sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '100px', justifyContent: 'center' }}
          >
            <Edit2 size={16} /> Edit
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            size="sm" 
            loading={deleteProjectMutation.isPending}
            disabled={project.amountReceivable > 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '100px', justifyContent: 'center' }}
            title={project.amountReceivable > 0 ? `Cannot delete with outstanding balance: ${formatCurrency(project.amountReceivable)}` : 'Delete Project'}
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{project.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {project.customerId?.name} {project.customerId?.city ? `• ${project.customerId.city}` : ''}
            </p>
          </div>
          <Badge status={project.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Site Address</p>
            <p>{project.siteAddress}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Service Type</p>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {project.serviceType?.map((type, idx) => (
                <Badge key={idx} status="info">{type}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Area</p>
            <p>{project.areaSqFt} sqft {project.ratePerSqFt > 0 && `(@ ₹${project.ratePerSqFt})`}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Start Date</p>
            <p>{formatDate(project.startDate)}</p>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Financial Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Cost</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(project.totalCost)}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Paid Till Now</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>
              {formatCurrency((project.paidTillNow || 0) + (project.paymentHistory?.reduce((s, p) => s + p.amount, 0) || 0))}
            </p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Amount Receivable</p>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: project.amountReceivable > 0 ? 'var(--danger)' : 'var(--success)'
            }}>
              {project.amountReceivable > 0 ? formatCurrency(project.amountReceivable) : '✓ Cleared'}
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Laborers Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> Assigned Laborers ({project.assignedLaborers?.length || 0})
          </h3>
          <Button onClick={() => setIsLaborerModalOpen(true)} size="sm">
            <Plus size={16} /> Add Laborer
          </Button>
        </div>

        {project.assignedLaborers && project.assignedLaborers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {project.assignedLaborers.map((laborer) => (
              <div
                key={laborer._id}
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
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{laborer.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{laborer.phone}</p>
                </div>
                <button
                  onClick={() => handleRemoveLaborer(laborer._id)}
                  className="btn btn-danger btn-sm"
                  title="Remove from project"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No laborers assigned to this project
          </p>
        )}
      </div>

      {/* Site Images Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} /> Site Images ({imagesData?.length || 0})
          </h3>
          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            <Camera size={16} /> Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              disabled={uploadImageMutation.isPending}
            />
          </label>
        </div>

        {imagesData && imagesData.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {imagesData.map((image) => (
              <div
                key={image._id}
                style={{
                  position: 'relative',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-input)'
                }}
              >
                <img
                  src={image.url}
                  alt={image.caption || 'Site image'}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  display: 'flex',
                  gap: '0.25rem'
                }}>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    title="View full size"
                  >
                    <Image size={16} />
                  </a>
                  <button
                    onClick={() => deleteImageMutation.mutate(image._id)}
                    className="btn btn-danger btn-sm"
                    title="Delete image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {image.caption && (
                  <p style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {image.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No images uploaded for this project
          </p>
        )}
      </div>

      {/* Attendance Marking Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Mark Attendance
          </h3>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px' }}
          />
        </div>

        {project.assignedLaborers && project.assignedLaborers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.assignedLaborers.map((laborer) => {
              const existingAttendance = attendanceData?.find(a => a.laborerId?._id === laborer._id);
              const isPresent = existingAttendance?.present;

              return (
                <div
                  key={laborer._id}
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
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{laborer.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {laborer.phone} • Default Wage: {formatCurrency(laborer.defaultDailyWage || 0)}
                    </p>
                    {existingAttendance && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Wage: {formatCurrency(existingAttendance.wageForDay || 0)} | 
                        Advance Paid: {formatCurrency(existingAttendance.advancePaidToday || 0)}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleMarkAttendance(laborer._id, true)}
                      className={isPresent ? 'btn btn-success' : 'btn btn-secondary'}
                      disabled={markAttendanceMutation.isPending}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(laborer._id, false)}
                      className={!isPresent ? 'btn btn-danger' : 'btn btn-secondary'}
                      disabled={markAttendanceMutation.isPending}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No laborers assigned to this project
          </p>
        )}
      </div>

      {/* Add Laborer Modal */}
      <Modal
        isOpen={isLaborerModalOpen}
        onClose={() => setIsLaborerModalOpen(false)}
        title="Add Laborer to Project"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {laborersData?.map((laborer) => {
            const isAlreadyAssigned = project.assignedLaborers?.some(l => l._id === laborer._id);
            return (
              <div
                key={laborer._id}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ fontWeight: 600 }}>{laborer.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{laborer.phone}</p>
                </div>
                {isAlreadyAssigned ? (
                  <Badge status="secondary">Assigned</Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleAssignLaborer(laborer._id)}
                    disabled={assignLaborerMutation.isPending}
                  >
                    Add
                  </Button>
                )}
              </div>
            );
          })}
          {(!laborersData || laborersData.length === 0) && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No laborers available</p>
          )}
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); resetEdit(); }}
        title="Edit Project"
        size="lg"
      >
        <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
          <div className="form-group">
            <label>Customer *</label>
            <select {...registerEdit('customerId', { required: 'Customer is required' })}>
              <option value="">Select Customer</option>
              {customersData?.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.city}
                </option>
              ))}
            </select>
            {editErrors.customerId && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {editErrors.customerId.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Project Title *</label>
            <input
              {...registerEdit('title', { required: 'Title is required' })}
              placeholder="e.g., Roof Waterproofing - Sharma Residence"
            />
            {editErrors.title && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {editErrors.title.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Site Address *</label>
            <input
              {...registerEdit('siteAddress', { required: 'Site address is required' })}
              placeholder="Full site address"
            />
            {editErrors.siteAddress && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {editErrors.siteAddress.message}
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input {...registerEdit('city')} placeholder="City name" />
            </div>
            <div className="form-group">
              <label>Service Type *</label>
              <select {...registerEdit('serviceType', { required: 'Service type is required' })}>
                <option value="Waterproofing">Waterproofing</option>
                <option value="Heatproofing">Heatproofing</option>
              </select>
            </div>
          </div>
<div className="form-row">
  <div className="form-group">
    <label>Area (sqft) *</label>
    <input
      {...registerEdit('areaSqFt', { required: 'Area is required', valueAsNumber: true })}
      type="number"
      placeholder="1200"
    />
  </div>
  <div className="form-group">
    <label>Rate per SqFt (₹)</label>
    <input
      {...registerEdit('ratePerSqFt', { valueAsNumber: true })}
      type="number"
      placeholder="85"
    />
  </div>
</div>

<div className="form-row">
  <div className="form-group">
    <label>Total Cost (₹) *</label>
    <input
      {...registerEdit('totalCost', { required: 'Total cost is required', valueAsNumber: true })}
      type="number"
      placeholder="100000"
    />
  </div>
  <div className="form-group">
    <label>Paid Till Now (₹)</label>
    <input
      {...registerEdit('paidTillNow', { valueAsNumber: true })}
      type="number"
      placeholder="30000"
    />
  </div>
</div>

          <div className="form-group">
            <label>Start Date</label>
            <input {...registerEdit('startDate')} type="date" />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select {...registerEdit('status')}>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea {...registerEdit('notes')} rows={2} placeholder="Additional notes" />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={updateProjectMutation.isPending}>
              Update Project
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default ProjectDetail;
