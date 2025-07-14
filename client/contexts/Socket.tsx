// context/SocketContext.tsx
import { createContext, useContext, useEffect } from "react";
import SocketManager from "../common/socket";

const socketInstance = SocketManager.getInstance();
const SocketContext = createContext<SocketManager>(socketInstance);

export const SocketProvider = ({ session, children }: { session: string; children: React.ReactNode }) => {
  useEffect(() => {
    if (!session) return;

    socketInstance.connect(session);

    return () => {
      socketInstance.disconnect();
    };
  }, [session]);

  return <SocketContext.Provider value={socketInstance}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  return useContext(SocketContext);
};
