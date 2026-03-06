import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/common/Button';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Settings = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const changePasswordMutation = async (data) => {
    try {
      await api.put('/auth/change-password', data);
      toast.success('Password changed successfully');
      reset();
      setIsChangingPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <PageWrapper title="Settings">
      {/* Business Profile */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Business Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Business Name</p>
            <p>FieldBook</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Owner Name</p>
            <p>{user?.name || '-'}</p>
          </div>
        </div>
        <Button variant="secondary" style={{ marginTop: '1rem' }} onClick={() => toast.info('Profile editing coming soon!')}>
          Edit Profile
        </Button>
      </div>

      {/* Image Retention Settings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Image Retention Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Retention Period</p>
            <p>90 days</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Warning Period</p>
            <p>7 days before deletion</p>
          </div>
        </div>
        <Button variant="secondary" style={{ marginTop: '1rem' }} onClick={() => toast.info('Settings editing coming soon!')}>
          Edit Settings
        </Button>
      </div>

      {/* Account Management */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Account Management</h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Change Password</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Update your login password
          </p>
          
          {isChangingPassword ? (
            <form onSubmit={handleSubmit(changePasswordMutation)}>
              <div className="form-row">
                <div className="form-group">
                  <label>Current Password</label>
                  <input {...register('currentPassword', { required: 'Current password is required' })} type="password" />
                  {errors.currentPassword && <p className="text-danger">{errors.currentPassword.message}</p>}
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input {...register('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Min 6 characters' } })} type="password" />
                  {errors.newPassword && <p className="text-danger">{errors.newPassword.message}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="submit">Change Password</Button>
                <Button type="button" variant="secondary" onClick={() => { setIsChangingPassword(false); reset(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setIsChangingPassword(true)}>Change Password</Button>
          )}
        </div>

        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Your Account</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Name</p>
              <p>{user?.name}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email</p>
              <p>{user?.email}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Role</p>
              <p>{user?.role === 'admin' ? 'Administrator' : 'Laborer'}</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Settings;
