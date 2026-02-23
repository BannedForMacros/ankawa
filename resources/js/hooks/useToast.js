import toast from 'react-hot-toast';

export function useToast() {
    return {
        success: (msg) => toast.success(msg),
        error:   (msg) => toast.error(msg),
        warning: (msg) => toast(msg, {
            icon: '⚠️',
            style: {
                border: '1px solid #f59e0b',
                color: '#92400e',
            },
        }),
        info: (msg) => toast(msg, {
            icon: 'ℹ️',
            style: {
                border: '1px solid #3b82f6',
                color: '#1e40af',
            },
        }),
    };
}