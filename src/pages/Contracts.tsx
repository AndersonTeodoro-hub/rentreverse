import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import ContractManager from '@/components/ContractManager';

const Contracts = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <ContractManager />
        </div>
      </div>
    </Layout>
  );
};

export default Contracts;
