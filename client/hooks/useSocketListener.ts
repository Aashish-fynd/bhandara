import { useEffect } from "react";
import { useSocket } from "@/contexts/Socket";

// Map to store sets of unique handlers per event
const socketEventRegistry = new Map<string, Set<(...args: any[]) => void>>();

// Track which socket events have already been registered with socket.on
const initializedEvents = new Set<string>();

// Function to register a handler for an event
const registerSocketHandler = (event: string, handler: (...args: any[]) => void) => {
  if (!socketEventRegistry.has(event)) {
    socketEventRegistry.set(event, new Set());
  }
  const handlers = socketEventRegistry.get(event)!;
  handlers.add(handler); // Set ensures uniqueness by reference
};

// Function to unregister a handler from an event
const unregisterSocketHandler = (event: string, handler: (...args: any[]) => void) => {
  const handlers = socketEventRegistry.get(event);
  if (handlers) {
    handlers.delete(handler);
    if (handlers.size === 0) {
      socketEventRegistry.delete(event);
    }
  }
};

// Function to get all registered handlers for an event
const getSocketHandlers = (event: string) => {
  return socketEventRegistry.get(event) || new Set();
};

// Hook that manages handler registration and sets up socket listener once
const useSocketListener = (event: string, handler: (...args: any[]) => void) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    registerSocketHandler(event, handler);
    if (!initializedEvents.has(event)) {
      socket.on(event, (...args: any[]) => {
        const handlers = getSocketHandlers(event);
        handlers.forEach((h) => h(...args));
      });
      initializedEvents.add(event);
    }

    return () => {
      unregisterSocketHandler(event, handler);
    };
  }, [socket, event]);
};

export default useSocketListener;
