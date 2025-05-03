import { UserService, ThreadService, EventService, MediaService, AuthService } from "@/features";
import { useMemo } from "react";

const createServiceClassHook = <T extends new (...args: any[]) => any>(ServiceClass: T) => {
  return () => useMemo(() => new ServiceClass(), []) as InstanceType<T>;
};

export const useUserService = createServiceClassHook(UserService);
export const useThreadService = createServiceClassHook(ThreadService);
export const useEventService = createServiceClassHook(EventService);
export const useMediaService = createServiceClassHook(MediaService);
export const useAuthService = createServiceClassHook(AuthService);
