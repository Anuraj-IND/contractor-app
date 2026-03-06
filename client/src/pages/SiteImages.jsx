import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import PageWrapper from '../components/layout/PageWrapper';
import { Image as ImageIcon, Download, AlertTriangle, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import toast from 'react-hot-toast';

const SiteImages = () => {
  const queryClient = useQueryClient();
  const { data: imagesData, isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      const res = await api.get('/images');
      return res.data.images;
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId) => {
      await api.delete(`/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['images']);
      queryClient.invalidateQueries(['image-warnings']);
      toast.success('Image deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    }
  });

  const handleDelete = (imageId) => {
    if (window.confirm('Are you sure you want to permanently delete this image?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const { data: warningsData } = useQuery({
    queryKey: ['image-warnings'],
    queryFn: async () => {
      const res = await api.get('/images/warnings');
      return res.data.images;
    }
  });

  const calculateDaysLeft = (deleteAfter) => {
    const now = new Date();
    const deleteDate = new Date(deleteAfter);
    const diffTime = deleteDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <PageWrapper title="Site Images">
      {warningsData?.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertTriangle size={24} color="var(--warning)" />
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--warning)', fontWeight: 600 }}>
              {warningsData.length} images expiring soon
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Download these images before they are permanently deleted
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ height: '300px' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      ) : imagesData?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {imagesData.map((image) => {
            const daysLeft = calculateDaysLeft(image.deleteAfter);
            return (
              <div key={image._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <img
                  src={image.thumbnail || image.url}
                  alt={image.caption || 'Site image'}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{image.projectId?.title || 'Unknown Project'}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    By {image.uploadedBy?.name} • {formatDate(image.uploadedAt)}
                  </p>
                  {daysLeft <= 7 && daysLeft > 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                      ⚠️ Deletes in {daysLeft} days
                    </p>
                  )}
                  {daysLeft > 7 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Deletes in {daysLeft} days
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={image.url}
                      download
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <Download size={16} /> Download
                    </a>
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.5rem' }}
                      title="Delete Image"
                      disabled={deleteImageMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ImageIcon size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No images uploaded yet</p>
        </div>
      )}
    </PageWrapper>
  );
};

export default SiteImages;
