import Base from "../Base";
import MessageService from "../messages/service";
import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { THREAD_TABLE_NAME } from "./constants";
import MediaService from "@features/media/service";
import { PostgrestError } from "@supabase/postgrest-js";
import { EQueryOperator, EThreadType } from "@definitions/enums";
import { MethodCacheSync } from "@decorators";
import { getThreadCache, setThreadCache, deleteThreadCache } from "./helpers";
import { IBaseThread } from "@definitions/types";

class ThreadsService extends Base<IBaseThread> {
  private readonly getCache = getThreadCache;
  private readonly setCache = setThreadCache;
  private readonly deleteCache = deleteThreadCache;

  constructor() {
    super(THREAD_TABLE_NAME);
  }

  async _getByIdNoCache(id: string) {
    return super.getById(id);
  }

  @MethodCacheSync<IBaseThread>({})
  async create<U extends Partial<Omit<IBaseThread, "id" | "updatedAt">>>(
    data: U
  ) {
    return validateThreadCreate(data, (data) => super.create(data));
  }

  @MethodCacheSync<IBaseThread>({})
  async getById(id: string): Promise<{
    data: IBaseThread;
    error: PostgrestError | null;
  }> {
    return super.getById(id);
  }

  @MethodCacheSync<IBaseThread>({})
  async update<U extends Partial<IBaseThread>>(id: string, data: U) {
    return validateThreadUpdate(data, (data) => super.update(id, data));
  }
}

export default ThreadsService;
