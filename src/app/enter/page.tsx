'use client';
import { useEffect } from 'react';

export default function EnterPage() {
  useEffect(() => {
    window.location.href = '/login';
  }, []);
  return null;
}
