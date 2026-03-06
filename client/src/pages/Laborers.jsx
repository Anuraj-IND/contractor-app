import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';

const Laborers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLaborer, setEditingLaborer] = useState(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  const { data: laborersData, isLoading, refetch } = useQuery({
    queryKey: ['laborers'],
    queryFn: async () => {
      const res = await api.get('/laborers');
      return res.data.laborers;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/laborers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['laborers']);
      toast.success('Laborer account created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create laborer');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/laborers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['laborers']);
      toast.success('Laborer updated successfully');
      setIsModalOpen(false);
      setEditingLaborer(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update laborer');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/laborers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['laborers']);
      toast.success('Laborer deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete laborer');
    }
  });

  const onSubmit = (data) => {
    if (editingLaborer) {
      updateMutation.mutate({ 
        id: editingLaborer._id, 
        data: {
          name: data.name,
          phone: data.phone,
          defaultDailyWage: data.defaultDailyWage,
          totalPaid: data.totalPaid,
          leftToPay: data.leftToPay
        }
      });
    } else {
      createMutation.mutate({ ...data, role: 'laborer' });
    }
  };

  const handleEdit = (laborer) => {
    setEditingLaborer(laborer);
    reset({
      name: laborer.name,
      phone: laborer.phone || '',
      defaultDailyWage: laborer.defaultDailyWage || 0,
      totalPaid: laborer.totalPaid || 0,
      leftToPay: laborer.leftToPay || 0
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Phone', accessor: 'phone', render: (row) => row.phone || '-' },
    { header: 'Default Wage', render: (row) => formatCurrency(row.defaultDailyWage) },
    { header: 'Total Paid', render: (row) => formatCurrency(row.totalPaid || 0) },
    {
      header: 'Left to Pay',
      render: (row) => (
        <span className={(row.leftToPay || 0) > 0 ? 'text-danger' : 'text-success'}>
          {(row.leftToPay || 0) > 0 ? formatCurrency(row.leftToPay) : '✓ Cleared'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <Badge status={row.isActive ? 'Active' : 'Inactive'} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => window.location.href = `/laborers/${row._id}`} className="btn btn-secondary btn-sm">
            <Eye size={16} />
          </button>
          <button onClick={() => handleEdit(row)} className="btn btn-secondary btn-sm">
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => {
              if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${row.name}? This action cannot be undone.`)) {
                deleteMutation.mutate(row._id);
              }
            }} 
            className="btn btn-danger btn-sm"
            disabled={(row.leftToPay || 0) > 0}
            title={(row.leftToPay || 0) > 0 ? `Cannot delete with outstanding balance: ${formatCurrency(row.leftToPay)}` : 'Delete Laborer'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageWrapper title="Laborers">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Manage laborer accounts and attendance</p>
        <Button onClick={() => {
          setEditingLaborer(null);
          reset({ name: '', phone: '', defaultDailyWage: 0 });
          setIsModalOpen(true);
        }}>
          <Plus size={20} /> Add Laborer
        </Button>
      </div>

      <Table columns={columns} data={laborersData} loading={isLoading} emptyMessage="No laborers found" />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); reset(); setEditingLaborer(null); }} title={editingLaborer ? 'Edit Laborer' : 'Add Laborer'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Name *</label>
            <input {...register('name', { required: 'Name is required' })} placeholder="Laborer name" />
            {errors.name && <p className="text-danger">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input {...register('phone')} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label>Default Daily Wage (₹) *</label>
            <input {...register('defaultDailyWage', { required: 'Wage is required', valueAsNumber: true })} type="number" placeholder="500" />
            {errors.defaultDailyWage && <p className="text-danger">{errors.defaultDailyWage.message}</p>}
          </div>
          {editingLaborer && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Paid (₹)</label>
                  <input {...register('totalPaid', { valueAsNumber: true, min: 0 })} type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Left to Pay (₹)</label>
                  <input {...register('leftToPay', { valueAsNumber: true, min: 0 })} type="number" placeholder="0" />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Edit these values to manually adjust payments. Left to Pay = Total Earned from attendance - Total Paid + Extra advances/loans
              </p>
            </>
          )}
          {!editingLaborer && (
            <>
              <div className="form-group">
                <label>Email (Optional - for login)</label>
                <input {...register('email')} type="email" placeholder="laborer@example.com" />
              </div>
              <div className="form-group">
                <label>Password (Optional - for login)</label>
                <input {...register('password')} type="password" placeholder="Min 6 characters" />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingLaborer ? 'Update' : 'Create'} Laborer
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Laborers;
