import { create } from 'zustand';
import { toast } from 'sonner';

interface SocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    connect: (url: string, token: string) => void;
    disconnect: () => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
}

const listeners: Record<string, ((data: any) => void)[]> = {};

// Real-time event handlers
const handleSocketMessage = (event: MessageEvent) => {
    try {
        const data = JSON.parse(event.data);

        // Notify listeners
        if (listeners[data.type]) {
            listeners[data.type].forEach(cb => cb(data));
        }

        switch (data.type) {
            case 'report_created':
                toast.success('Yangi hisobot', {
                    description: `${data.payload?.sectionName || 'Sex'} uchun hisobot yaratildi.`,
                });
                break;

            case 'high_mortality_alert':
                toast.warning('Yuqori o\'lim ko\'rsatkichi!', {
                    description: data.payload?.message || 'O\'lim soni me\'yordan oshdi.',
                    duration: 10000,
                });
                break;

            case 'daily_report_reminder':
                toast.info('Eslatma', {
                    description: 'Bugungi kunlik hisobotni topshirishni unutmang!',
                });
                break;
        }
    } catch (error) {
        console.error('Failed to parse socket message:', error);
    }
};

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    connect: (url: string, token: string) => {
        const { socket } = get();
        if (socket) {
            socket.close();
        }

        const ws = new WebSocket(`${url}?token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            set({ isConnected: true });
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            set({ isConnected: false, socket: null });
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onmessage = handleSocketMessage;

        set({ socket: ws });
    },
    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
        }
        set({ socket: null, isConnected: false });
    },
    on: (event: string, callback: (data: any) => void) => {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    },
    off: (event: string, callback: (data: any) => void) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    }
}));

export const useSocket = () => {
    return useSocketStore();
};
