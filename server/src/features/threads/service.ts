import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { Thread } from "./model";

import { IPaginationParams, IMessage } from "@/definitions/types";
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

import { isEmpty } from "@utils";
import MessageService from "@features/messages/service";


class ThreadsService {
  private readonly getCache = getThreadCache;
  private readonly setCache = setThreadCache;
  private readonly deleteCache = deleteThreadCache;
  private readonly messageService: MessageService;

  private readonly populateFields = ["messages"];

  constructor() {
    this.messageService = new MessageService();
  }

  private async populateThread(thread: IBaseThread, fields: string[]) {
    const promises: Record<string, Promise<any>> = {};

    fields.forEach((field) => {
      switch (field) {
        case "messages":
          promises.messages = this.messageService.getAll(
            { threadId: thread.id },
            { limit: 10 }
          );
          break;
      }
    });

    const results = await Promise.allSettled(Object.values(promises));
    const resolved: Record<string, any> = {};
    Object.keys(promises).forEach((key, idx) => {
      const r = results[idx];
      resolved[key] = r.status === "fulfilled" ? r.value : null;
    });

    if (fields.includes("messages")) {
      thread.messages = resolved.messages?.data?.items || [];
    }

    return thread;
  }

  private readonly populateFields = ["messages"];

  constructor() {}

  private async populateThread(thread: IBaseThread, fields: string[]) {
    const promises: Record<string, Promise<any>> = {};

    fields.forEach((field) => {
      switch (field) {
        case "messages":
          promises.messages = import("@features/messages/service").then(
            async ({ default: MessageService }) => {
              const service = new MessageService();
              return service.getAll({ threadId: thread.id }, { limit: 10 });
            }
          );
          break;
      }
    });

    const results = await Promise.allSettled(Object.values(promises));
    const resolved: Record<string, any> = {};
    Object.keys(promises).forEach((key, idx) => {
      const r = results[idx];
      resolved[key] = r.status === "fulfilled" ? r.value : null;
    });

    if (fields.includes("messages")) {
      thread.messages = resolved.messages?.data?.items || [];
    }

    return thread;
  }

  async _getByIdNoCache(id: string) {
    return findById(Thread, id);
  }

  @MethodCacheSync<IBaseThread>({})
  async create<U extends Partial<Omit<IBaseThread, "id" | "updatedAt">>>(
    data: U,
    populate?: boolean | string[]
  ) {
    const result = await validateThreadCreate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent thread not found");
        if (parent.data.parentId)
          throw new BadRequestError(
            "Nested threads beyond one level are not allowed"
          );
      }
      return createRecord(Thread, validData);
    });
    if (populate && result.data) {
      const { data: populated } = await this.getById(result.data.id, populate);
      return { data: populated, error: result.error };
    }
    return result;
  }

  async getById(id: string, populate?: boolean | string[]) {
    const result = await findById(Thread, id);
    const data = result.data;

    if (populate && data) {
      const fields =
        populate === true
          ? this.populateFields
          : this.populateFields.filter((f) => (populate as string[]).includes(f));

      const populated = await this.populateThread(data as IBaseThread, fields);
      return { data: populated, error: result.error };
    }
    return result;
  }

  @MethodCacheSync<IBaseThread>({})
  async update<U extends Partial<IBaseThread>>(id: string, data: U, populate?: boolean | string[]) {
    const result = await validateThreadUpdate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent.data) throw new BadRequestError("Parent thread not found");
        if (parent.data.parentId)
          throw new BadRequestError(
            "Nested threads beyond one level are not allowed"
          );
      }
      return updateRecord(Thread, id, validData);
    });
    if (populate && !result.error) {
      const { data: populated } = await this.getById(id, populate);
      return { data: populated, error: result.error };
    }
    return result;
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
