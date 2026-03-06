import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { Download, Search, User } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

const Invoices = () => {
  const [search, setSearch] = useState('');

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['invoice-customers'],
    queryFn: async () => {
      const res = await api.get('/invoices/customers');
      return res.data.customers;
    }
  });

  const filteredData = customersData?.filter(customer => 
    customer.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleDownloadInvoice = async (customer) => {
    const toastId = toast.loading('Generating PDF...');
    try {
      // Fetch the PDF as a blob using our authenticated api instance
      const response = await api.get(`/invoices/customer/${customer._id}/pdf`, {
        responseType: 'blob'
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename
      const fileName = `Invoice_${customer.name.replace(/\s+/g, '_')}.pdf`;
      link.setAttribute('download', fileName);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded', { id: toastId });
    } catch (error) {
      console.error('PDF Generation error:', error);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const columns = [
    { 
      header: 'Customer Name', 
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
          <span style={{ fontWeight: 600 }}>{row.name}</span>
        </div>
      )
    },
    { 
      header: 'Active Projects', 
      accessor: 'totalProjects',
      render: (row) => (
        <span style={{ backgroundColor: 'var(--bg-input)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
          {row.totalProjects} Projects
        </span>
      )
    },
    { 
      header: 'Total Billed', 
      render: (row) => formatCurrency(row.totalBilled) 
    },
    { 
      header: 'Total Received', 
      render: (row) => <span className="text-success">{formatCurrency(row.totalPaid)}</span> 
    },
    { 
      header: 'Amount Receivable', 
      render: (row) => (
        <span className={row.amountReceivable > 0 ? 'text-danger' : 'text-success'} style={{ fontWeight: 700 }}>
          {row.amountReceivable > 0 ? formatCurrency(row.amountReceivable) : '✓ Cleared'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => handleDownloadInvoice(row)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={16} /> Generate PDF
        </Button>
      )
    }
  ];

  return (
    <PageWrapper title="Customer Invoices">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Generate aggregated outstanding statements for each customer.</p>
        
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search customer..."
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
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table 
          columns={columns} 
          data={filteredData} 
          loading={isLoading} 
          emptyMessage="No customers with projects found" 
        />
      </div>
    </PageWrapper>
  );
};

export default Invoices;
