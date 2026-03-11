/**
 * ToastContainer Component
 * Global container for displaying toast notifications
 */
import React, { useState, useEffect } from 'react';
import { Toast } from './Toast';
import { toastService, ToastOptions } from '../../services/toast.service';

export const ToastContainer: React.FC = () => {
    const [toast, setToast] = useState<ToastOptions | null>(null);

    useEffect(() => {
        const handleShow = (options: ToastOptions) => {
            setToast(options);
        };

        toastService.on('show', handleShow);

        return () => {
            toastService.off('show', handleShow);
        };
    }, []);

    if (!toast) return null;

    return (
        <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onHide={() => setToast(null)}
        />
    );
};
