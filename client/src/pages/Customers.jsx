import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/formatCurrency';

const Customers = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', debouncedSearch, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (typeFilter && typeFilter !== 'All') params.append('type', typeFilter);
      const res = await api.get(`/customers?${params}`);
      return res.data.customers;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/customers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer updated successfully');
      setIsModalOpen(false);
      setEditingCustomer(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  });

  const onSubmit = (data) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      type: customer.type || 'Residential',
      address: customer.address || '',
      city: customer.city || '',
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(customer._id);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name'
    },
    {
      header: 'Phone',
      accessor: 'phone'
    },
    {
      header: 'City',
      accessor: 'city',
      render: (row) => row.city || '-'
    },
    {
      header: 'Total Projects',
      render: (row) => row.totalProjects || 0
    },
    {
      header: 'Total Paid',
      render: (row) => formatCurrency(row.totalPaid || 0)
    },
    {
      header: 'Total Due',
      render: (row) => (
        <span className={(row.totalDue || 0) > 0 ? 'text-danger' : 'text-success'}>
          {(row.totalDue || 0) > 0 ? formatCurrency(row.totalDue) : '✓ Cleared'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => window.location.href = `/customers/${row._id}`}
            className="btn btn-secondary btn-sm"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="btn btn-secondary btn-sm"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="btn btn-danger btn-sm"
            disabled={(row.totalDue || 0) > 0 || (row.totalProjects || 0) > 0}
            title={
              (row.totalDue || 0) > 0 
                ? `Cannot delete with outstanding balance: ${formatCurrency(row.totalDue)}` 
                : (row.totalProjects || 0) > 0 
                  ? 'Cannot delete customer with existing projects' 
                  : 'Delete'
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageWrapper title="Customers">
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
              placeholder="Search customers..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
          </select>
        </div>
        <Button onClick={() => {
          setEditingCustomer(null);
          reset({
            name: '',
            phone: '',
            email: '',
            type: 'Residential',
            address: '',
            city: '',
            notes: ''
          });
          setIsModalOpen(true);
        }}>
          <Plus size={20} /> Add Customer
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={customersData}
        loading={isLoading}
        emptyMessage="No customers found"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
          reset();
        }}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Customer name"
            />
            {errors.name && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone *</label>
              <input
                {...register('phone', { required: 'Phone is required' })}
                placeholder="+91 98765 43210"
              />
              {errors.phone && (
                <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                {...register('email', { pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.email.message}
                </p>
              )}
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
              <input
                {...register('city')}
                placeholder="City name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Full address"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Additional notes"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingCustomer(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingCustomer ? 'Update' : 'Create'} Customer
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Customers;
