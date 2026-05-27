import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-dark" />}>
      <LoginPageClient />
    </Suspense>
  );
}
