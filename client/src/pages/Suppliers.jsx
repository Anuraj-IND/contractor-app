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
import { formatCurrency } from '../utils/formatCurrency';
import { useDebounce } from '../hooks/useDebounce';

const Suppliers = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      const res = await api.get(`/suppliers?${params}`);
      return res.data.suppliers;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/suppliers', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success(data.message || 'Supplier created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create supplier');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/suppliers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier updated successfully');
      setIsModalOpen(false);
      setEditingSupplier(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update supplier');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    }
  });

  const onSubmit = (data) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    reset({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      totalPurchased: supplier.totalPurchased || 0,
      totalPaid: supplier.totalPaid || 0,
      status: supplier.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.companyName}?`)) {
      deleteMutation.mutate(supplier._id);
    }
  };

  const columns = [
    {
      header: 'Company Name',
      accessor: 'companyName'
    },
    {
      header: 'Contact Person',
      accessor: 'contactPerson',
      render: (row) => row.contactPerson || '-'
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => row.phone || '-'
    },
    {
      header: 'Total Purchased',
      render: (row) => formatCurrency(row.totalPurchased)
    },
    {
      header: 'Total Paid',
      render: (row) => formatCurrency(row.totalPaid)
    },
    {
      header: 'Left to Pay',
      render: (row) => (
        <span className={row.balance > 0 ? 'text-danger' : 'text-success'}>
          {row.balance > 0 ? formatCurrency(row.balance) : '✓ Cleared'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <Badge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => window.location.href = `/suppliers/${row._id}`}
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
            disabled={row.balance > 0}
            title={row.balance > 0 ? 'Cannot delete with outstanding balance' : 'Delete'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageWrapper title="Suppliers">
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
              placeholder="Search suppliers..."
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
            <option value="Active">Active</option>
            <option value="Cleared">Cleared</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <Button onClick={() => {
          setEditingSupplier(null);
          reset({
            companyName: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: ''
          });
          setIsModalOpen(true);
        }}>
          <Plus size={20} /> Add Supplier
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={suppliersData}
        loading={isLoading}
        emptyMessage="No suppliers found"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          reset();
        }}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Company Name *</label>
            <input
              {...register('companyName', { required: 'Company name is required' })}
              placeholder="ABC Chemicals Ltd."
            />
            {errors.companyName && (
              <p className="text-danger" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Person</label>
              <input
                {...register('contactPerson')}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                {...register('phone')}
                placeholder="+91 98765 43210"
              />
            </div>
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

          <div className="form-group">
            <label>Address</label>
            <textarea
              {...register('address')}
              rows={3}
              placeholder="Full address"
            />
          </div>

          {editingSupplier && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Purchased (₹) - Auto Calculated</label>
                  <input
                    {...register('totalPurchased')}
                    type="number"
                    disabled
                    style={{ backgroundColor: 'var(--bg-dark)', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Total Paid (₹) - Manual Edit</label>
                  <input
                    {...register('totalPaid', { valueAsNumber: true, min: 0 })}
                    type="number"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Note: Total Purchased is the grand total of all materials. Balance = Total Purchased - Total Paid.
              </p>
              <div className="form-group">
                <label>Status</label>
                <select {...register('status')}>
                  <option value="Active">Active</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSupplier(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingSupplier ? 'Update' : 'Create'} Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Suppliers;
