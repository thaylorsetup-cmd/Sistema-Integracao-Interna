import * as React from 'react';
import { cn } from '../../utils/classnames';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:bottom-0 sm:right-0 sm:max-w-md"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const variants = {
    default: {
      bg: 'bg-white border-gray-200',
      icon: <Info className="h-5 w-5 text-gray-600" />,
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <AlertCircle className="h-5 w-5 text-warning" />,
    },
    danger: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle className="h-5 w-5 text-danger" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Info className="h-5 w-5 text-info" />,
    },
  };

  const variant = variants[toast.variant || 'default'];

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all',
        variant.bg
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-shrink-0">{variant.icon}</div>
      <div className="flex-1">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        )}
        {toast.description && (
          <p className="mt-1 text-sm text-gray-600">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
