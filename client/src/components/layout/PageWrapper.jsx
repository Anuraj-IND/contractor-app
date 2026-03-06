import { useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const PageWrapper = ({ children, title }) => {
  useEffect(() => {
    document.title = title ? `${title} | FieldBook` : 'FieldBook';
  }, [title]);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: 'var(--bg-dark)'
    }}>
      <Sidebar />
      
      <main
        style={{
          flex: 1,
          marginLeft: '250px',
          padding: '2rem',
          paddingBottom: '80px',
          transition: 'margin-left 0.3s ease'
        }}
        className="main-content"
      >
        {title && (
          <h1 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            {title}
          </h1>
        )}
        {children}
      </main>

      <BottomNav />

      <style>{`
        @media (max-width: 1024px) {
          .main-content {
            margin-left: 80px !important;
            padding: 1.5rem !important;
          }
        }
        
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding: 1rem !important;
            padding-bottom: 100px !important;
          }
          
          .bottom-nav {
            display: flex !important;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 0.75rem !important;
            padding-bottom: 90px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PageWrapper;
