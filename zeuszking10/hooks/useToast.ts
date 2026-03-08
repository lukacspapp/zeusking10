'use client';

import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export function useToast() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const openToast = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const closeToast = () => setShowToast(false);

  return {
    showToast,
    toastMessage,
    toastType,
    openToast,
    closeToast,
  };
}