import Base from "../Base";
import MessageService from "../messages/service";
import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { THREAD_TABLE_NAME } from "./constants";
import { Thread } from "./model";
import MediaService from "@features/media/service";
import { EQueryOperator, EThreadType } from "@definitions/enums";
import { MethodCacheSync } from "@decorators";
import { getThreadCache, setThreadCache, deleteThreadCache } from "./helpers";
import { IBaseThread } from "@definitions/types";
import { BadRequestError } from "@exceptions";

class ThreadsService extends Base<IBaseThread> {
  private readonly getCache = getThreadCache;
  private readonly setCache = setThreadCache;
  private readonly deleteCache = deleteThreadCache;

  constructor() {
    super(Thread);
  }

  async _getByIdNoCache(id: string) {
    return super.getById(id);
  }

  @MethodCacheSync<IBaseThread>({})
  async create<U extends Partial<Omit<IBaseThread, "id" | "updatedAt">>>(
    data: U
  ) {
    return validateThreadCreate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent thread not found");
        if (parent.data.parentId)
          throw new BadRequestError("Nested threads beyond one level are not allowed");
      }
      return super.create(validData);
    });
  }

  @MethodCacheSync<IBaseThread>({})
  async getById(id: string): Promise<{
    data: IBaseThread;
    error: any;
  }> {
    return super.getById(id);
  }

  @MethodCacheSync<IBaseThread>({})
  async update<U extends Partial<IBaseThread>>(id: string, data: U) {
    return validateThreadUpdate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent thread not found");
        if (parent.data.parentId)
          throw new BadRequestError("Nested threads beyond one level are not allowed");
      }
      return super.update(id, validData);
    });
  }
}

export default ThreadsService;
