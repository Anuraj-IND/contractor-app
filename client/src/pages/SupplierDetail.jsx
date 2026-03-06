import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('materials');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { register: registerPayment, handleSubmit: handleSubmitPayment, reset: resetPayment } = useForm();
  const { register: registerMaterial, handleSubmit: handleSubmitMaterial, reset: resetMaterial } = useForm();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm();

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const res = await api.get(`/suppliers/${id}`);
      return res.data;
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/suppliers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supplier', id]);
      toast.success('Supplier updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update supplier');
    }
  });

  const handleEdit = () => {
    resetEdit({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      totalPurchased: supplier.totalPurchased || 0,
      totalPaid: supplier.totalPaid || 0,
      status: supplier.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  const logPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/suppliers/${id}/payments`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supplier', id]);
      toast.success('Payment logged successfully');
      setIsPaymentModalOpen(false);
      resetPayment();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to log payment');
    }
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/materials', { ...data, supplierId: id });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supplier', id]);
      toast.success('Material purchase recorded');
      setIsMaterialModalOpen(false);
      resetMaterial();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create material');
    }
  });

  const supplier = supplierData?.supplier;
  const materials = supplierData?.materials || [];

  if (isLoading) {
    return <PageWrapper title="Supplier Details"><div className="skeleton" style={{ height: '200px' }} /></PageWrapper>;
  }

  if (!supplier) {
    return <PageWrapper title="Supplier Details"><p>Supplier not found</p></PageWrapper>;
  }

  const paymentColumns = [
    { header: 'Date', render: (row) => formatDate(row.date) },
    { header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { header: 'Method', accessor: 'method' },
    { header: 'Note', accessor: 'note', render: (row) => row.note || '-' }
  ];

  const materialColumns = [
    { header: 'Material Name', accessor: 'name' },
    { header: 'Unit', accessor: 'unit', render: (row) => row.unit || '-' },
    { header: 'Qty Purchased', accessor: 'quantityPurchased' },
    { header: 'Price/Unit', render: (row) => formatCurrency(row.pricePerUnit) },
    { header: 'Total Cost', render: (row) => formatCurrency(row.totalCost) }
  ];

  return (
    <PageWrapper title="Supplier Details">
      <button
        onClick={() => navigate('/suppliers')}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Suppliers
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{supplier.companyName}</h2>
            <Badge status={supplier.status} />
          </div>
          <Button variant="secondary" onClick={handleEdit}>
            <Edit2 size={16} /> Edit
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {supplier.contactPerson && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Contact Person</p>
              <p>{supplier.contactPerson}</p>
            </div>
          )}
          {supplier.phone && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Phone</p>
              <p>{supplier.phone}</p>
            </div>
          )}
          {supplier.email && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email</p>
              <p>{supplier.email}</p>
            </div>
          )}
          {supplier.address && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Address</p>
              <p>{supplier.address}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Balance Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Purchased</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(supplier.totalPurchased)}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Paid</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(supplier.totalPaid)}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Balance Due</p>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: supplier.balance > 0 ? 'var(--danger)' : 'var(--success)'
            }}>
              {supplier.balance > 0 ? formatCurrency(supplier.balance) : '✓ Cleared'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'materials' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: activeTab === 'materials' ? 600 : 400,
            paddingBottom: '0.5rem',
            borderBottom: activeTab === 'materials' ? '2px solid var(--accent)' : '2px solid transparent'
          }}
        >
          Materials ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'payments' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: activeTab === 'payments' ? 600 : 400,
            paddingBottom: '0.5rem',
            borderBottom: activeTab === 'payments' ? '2px solid var(--accent)' : '2px solid transparent'
          }}
        >
          Payment History ({supplier.paymentHistory?.length || 0})
        </button>
      </div>

      {activeTab === 'materials' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Button onClick={() => setIsMaterialModalOpen(true)}>
              <Plus size={20} /> Add Material Purchase
            </Button>
          </div>
          <Table
            columns={materialColumns}
            data={materials}
            loading={isLoading}
            emptyMessage="No materials purchased from this supplier"
          />
        </div>
      )}

      {activeTab === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Button onClick={() => setIsPaymentModalOpen(true)}>
              <Plus size={20} /> Log Payment
            </Button>
          </div>
          <Table
            columns={paymentColumns}
            data={supplier.paymentHistory || []}
            loading={isLoading}
            emptyMessage="No payments recorded"
          />
        </div>
      )}

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          resetPayment();
        }}
        title="Log Payment to Supplier"
      >
        <form onSubmit={handleSubmitPayment((data) => logPaymentMutation.mutate(data))}>
          <div className="form-group">
            <label>Amount (₹) *</label>
            <input
              {...registerPayment('amount', { required: 'Amount is required', min: 1 })}
              type="number"
              step="0.01"
              placeholder="5000"
            />
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              {...registerPayment('date', { required: 'Date is required' })}
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select {...registerPayment('method')}>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="form-group">
            <label>Note</label>
            <textarea
              {...registerPayment('note')}
              rows={3}
              placeholder="Optional note"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={logPaymentMutation.isPending}>
              Log Payment
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          resetMaterial();
        }}
        title="Add Material Purchase"
      >
        <form onSubmit={handleSubmitMaterial((data) => createMaterialMutation.mutate(data))}>
          <div className="form-group">
            <label>Material Name *</label>
            <input
              {...registerMaterial('name', { required: 'Material name is required' })}
              placeholder="Waterproofing Chemical X"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Unit *</label>
              <select {...registerMaterial('unit', { required: 'Unit is required' })}>
                <option value="">Select Unit</option>
                <option value="liters">Liters</option>
                <option value="kg">Kilograms</option>
                <option value="drums">Drums</option>
                <option value="rolls">Rolls</option>
                <option value="bags">Bags</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity Purchased *</label>
              <input
                {...registerMaterial('quantityPurchased', { required: 'Quantity is required', valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="100"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price per Unit (₹) *</label>
              <input
                {...registerMaterial('pricePerUnit', { required: 'Price is required', valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="500"
              />
            </div>
            <div className="form-group">
              <label>Purchase Date *</label>
              <input
                {...registerMaterial('purchaseDate', { required: 'Date is required' })}
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsMaterialModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMaterialMutation.isPending}>
              Add Material
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Supplier"
      >
        <form onSubmit={handleSubmitEdit((data) => updateSupplierMutation.mutate(data))}>
          <div className="form-group">
            <label>Company Name *</label>
            <input
              {...registerEdit('companyName', { required: 'Company name is required' })}
              placeholder="ABC Chemicals Ltd."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Person</label>
              <input
                {...registerEdit('contactPerson')}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                {...registerEdit('phone')}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              {...registerEdit('email')}
              placeholder="email@example.com"
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              {...registerEdit('address')}
              rows={3}
              placeholder="Full address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Purchased (₹) - Auto Calculated</label>
              <input
                {...registerEdit('totalPurchased')}
                type="number"
                disabled
                style={{ backgroundColor: 'var(--bg-dark)', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label>Total Paid (₹) - Manual Edit</label>
              <input
                {...registerEdit('totalPaid', { valueAsNumber: true, min: 0 })}
                type="number"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select {...registerEdit('status')}>
              <option value="Active">Active</option>
              <option value="Cleared">Cleared</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateSupplierMutation.isPending}>
              Update Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default SupplierDetail;
