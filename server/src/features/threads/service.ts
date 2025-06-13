import MessageService from "../messages/service";
import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { Thread } from "./model";
import MediaService from "@features/media/service";
import { EThreadType } from "@definitions/enums";
import { IPaginationParams } from "@/definitions/types";
import {
  createRecord,
  deleteRecord,
  findAllWithPagination,
  findById,
  updateRecord,
} from "@utils/dbUtils";
import { MethodCacheSync } from "@decorators";
import { getThreadCache, setThreadCache, deleteThreadCache } from "./helpers";
import { IBaseThread } from "@definitions/types";
import { BadRequestError } from "@exceptions";

class ThreadsService {
  private readonly getCache = getThreadCache;
  private readonly setCache = setThreadCache;
  private readonly deleteCache = deleteThreadCache;

  constructor() {
    // no-op
  }

  async _getByIdNoCache(id: string) {
    return findById(Thread, id);
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
      return createRecord(Thread, validData);
    });
  }

  @MethodCacheSync<IBaseThread>({})
  async getById(id: string): Promise<{
    data: IBaseThread;
    error: any;
  }> {
    return findById(Thread, id);
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
      return updateRecord(Thread, id, validData);
    });
  }

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>,
    select?: string
  ) {
    return findAllWithPagination(Thread, where, pagination, select);
  }

  delete(id: string) {
    return deleteRecord(Thread, id);
  }
}

export default ThreadsService;
