import config from "@/config";
import { io, Socket } from "socket.io-client";

type EventCallback = (...args: any[]) => void;

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private connected = false;

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public connect(session: string) {
    if (this.connected || this.socket) return;

    console.log("🔌 Connecting to socket with session:", session);

    this.socket = io(`${config.server.baseURL}/platform`, {
      transports: ["websocket"],
      auth: { session }
    });

    this.socket.on("connect", () => {
      this.connected = true;
      console.log("🔌 Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      console.log("🔌 Socket disconnected");
    });

    this.socket.on("error", (error) => {
      console.error("🔌 Socket error:", error);
    });
  }

  public disconnect() {
    console.log("🔌 Disconnecting socket");
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
  }

  public on(event: string, callback: EventCallback) {
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: EventCallback) {
    this.socket?.off(event, callback);
  }

  public emit(event: string, payload: any, cb?: EventCallback) {
    this.socket?.emit(event, payload, cb);
  }

  public isConnected() {
    return this.connected;
  }
}

export default SocketManager;
