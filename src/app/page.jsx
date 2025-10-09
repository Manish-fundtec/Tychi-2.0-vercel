'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in page
    router.replace('/auth/sign-in');
  }, [router]);

  return null;
}
