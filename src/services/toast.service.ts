/**
 * Toast Service
 * Global toast notification manager (React Native compatible)
 */

export interface ToastOptions {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

type ToastHandler = (options: ToastOptions) => void;
let toastHandler: ToastHandler | null = null;

class ToastService {
    on(event: string, handler: ToastHandler) {
        if (event === 'show') {
            toastHandler = handler;
        }
    }

    off(event: string, handler: ToastHandler) {
        if (event === 'show' && toastHandler === handler) {
            toastHandler = null;
        }
    }

    show(options: ToastOptions) {
        if (toastHandler) {
            toastHandler(options);
        }
    }

    success(message: string, duration?: number) {
        this.show({ message, type: 'success', duration });
    }

    error(message: string, duration?: number) {
        this.show({ message, type: 'error', duration });
    }

    info(message: string, duration?: number) {
        this.show({ message, type: 'info', duration });
    }

    warning(message: string, duration?: number) {
        this.show({ message, type: 'warning', duration });
    }
}

export const toastService = new ToastService();
