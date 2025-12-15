'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        // Initialize socket connection
        const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || '', {
            path: '/socket.io/', // Default path
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setIsConnected(true);

            // Join roles based rooms
            if (session?.user?.role) {
                // Join specific role room (e.g., 'ADMIN', 'USER')
                socketInstance.emit('join_room', session.user.role);
                console.log(`Joined room: ${session.user.role}`);

                if (session.user.role === 'ADMIN' || session.user.role === 'IT_LEAD') {
                    socketInstance.emit('join_room', 'admin_notifications');
                    console.log('Joined room: admin_notifications');
                }
            }

            // Join user specific room
            if (session?.user?.id) {
                socketInstance.emit('join_room', `user_${session.user.id}`);
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket connect error:', err);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [session]); // Re-connect or re-join rooms if session changes (e.g. login)

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
