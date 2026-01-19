'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap';
import PageTitle from '@/components/PageTitle';

const Error403 = () => {
  const router = useRouter();

  return (
    <>
      <PageTitle title="403 - Access Denied" subName="Error" />
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <Card className="text-center" style={{ maxWidth: '500px' }}>
          <CardHeader className="bg-danger text-white">
            <CardTitle as="h2" className="mb-0">
              <i className="ri-error-warning-line me-2"></i>
              403 - Access Denied
            </CardTitle>
          </CardHeader>
          <CardBody className="p-4">
            <div className="mb-4">
              <i className="ri-shield-cross-line" style={{ fontSize: '4rem', color: '#dc3545' }}></i>
            </div>
            <h4 className="mb-3">You don't have permission to access this resource</h4>
            <p className="text-muted mb-4">
              The page or resource you're trying to access requires specific permissions that you don't currently have.
              Please contact your administrator if you believe this is an error.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Button
                variant="primary"
                onClick={() => router.push('/fundlist')}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default Error403;
