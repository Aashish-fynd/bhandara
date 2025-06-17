import { useEffect } from "react";
import { useSocket } from "@/contexts/Socket";

const useSocketListener = (
  event: string,
  handler: (...args: any[]) => void
) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
};

export default useSocketListener;
