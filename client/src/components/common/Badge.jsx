const Badge = ({ status, children }) => {
  const statusStyles = {
    'Paid': 'badge-success',
    'Completed': 'badge-success',
    'Cleared': 'badge-success',
    'Present': 'badge-success',
    'Active': 'badge-success',
    
    'Partial': 'badge-warning',
    'In Progress': 'badge-warning',
    'Pending': 'badge-warning',
    'Sent': 'badge-warning',
    'On Hold': 'badge-warning',
    
    'Overdue': 'badge-danger',
    'Not Started': 'badge-danger',
    'Inactive': 'badge-danger',
    'Absent': 'badge-danger',
    
    'Draft': 'badge-gray',
    'Not Paid': 'badge-gray',
    
    'In Progress-blue': 'badge-info'
  };

  const getStyle = () => {
    if (statusStyles[status]) return statusStyles[status];
    if (status?.includes('blue')) return 'badge-info';
    return 'badge-gray';
  };

  return (
    <span className={`badge ${getStyle()}`}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }} />
      {children || status}
    </span>
  );
};

export default Badge;
