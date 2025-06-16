// context/SocketContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import SocketManager from "../common/socket";

const SocketContext = createContext<typeof SocketManager | null>(null);

export const SocketProvider = ({ session, children }: { session: string; children: React.ReactNode }) => {
  const [socket, setSocket] = useState<typeof SocketManager | null>(null);

  useEffect(() => {
    if (!session) return;

    SocketManager.connect(session);
    setSocket(SocketManager);

    return () => {
      SocketManager.disconnect();
      setSocket(null);
    };
  }, [session]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const socket = useContext(SocketContext);

  if (!socket) throw new Error("useSocket must be used within SocketProvider");
  return socket;
};
