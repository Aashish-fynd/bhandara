import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { Thread } from "./model";

import { IPaginationParams, IMessage } from "@/definitions/types";
import { findAllWithPagination } from "@utils/dbUtils";
import { MethodCacheSync } from "@decorators";
import { getThreadCache, setThreadCache, deleteThreadCache } from "./helpers";
import { IBaseThread } from "@definitions/types";
import { BadRequestError } from "@exceptions";

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
      thread.messages = resolved.messages?.items;
    }

    return thread;
  }

  async _getByIdNoCache(id: string) {
    const res = await Thread.findByPk(id, { raw: true });
    return res as any;
  }

  @MethodCacheSync<IBaseThread>({})
  async create<U extends Partial<Omit<IBaseThread, "id" | "updatedAt">>>(
    data: U,
    populate?: boolean | string[]
  ) {
    const created = await validateThreadCreate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent) throw new BadRequestError("Parent thread not found");
        if (parent.parentId)
          throw new BadRequestError(
            "Nested threads beyond one level are not allowed"
          );
      }
      const row = await Thread.create(validData as any);
      return row.toJSON() as any;
    });
    let thread = (created as any)?.dataValues || (created as any)?.[0]?.dataValues || created;
    if (populate && thread) {
      thread = await this.getById(thread.id);
    }
    return thread;
  }

  @MethodCacheSync({})
  async getById(id: string) {
    const res = await Thread.findByPk(id, { raw: true });
    return res as any;
  }

  @MethodCacheSync<IBaseThread>({})
  async update<U extends Partial<IBaseThread>>(
    id: string,
    data: U,
    populate?: boolean | string[]
  ) {
    const updated = await validateThreadUpdate(data, async (validData) => {
      if (validData.parentId) {
        const parent = await this.getById(validData.parentId);
        if (!parent) throw new BadRequestError("Parent thread not found");
        if (parent.parentId)
          throw new BadRequestError(
            "Nested threads beyond one level are not allowed"
          );
      }
      const [count, rows] = await Thread.update(validData as any, {
        where: { id },
        returning: true,
      });
      if (count === 0) throw new Error("Thread not found");
      return rows[0];
    });
    let thread = (updated as any)?.[0] ?? updated;
    if (populate && thread) {
      thread = await this.getById(id);
    }
    return thread as any;
  }

  async getAll(
    where: Record<string, any> = {},
    pagination?: Partial<IPaginationParams>,
    select?: string
  ) {
    return findAllWithPagination(Thread, where, pagination, select);
  }

  async delete(id: string) {
    const row = await Thread.findByPk(id);
    if (!row) return null;
    await row.destroy();
    return row.toJSON() as any;
  }
}

export default ThreadsService;
