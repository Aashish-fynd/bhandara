import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { Thread } from "./model";

import { IPaginationParams, IMessage } from "@/definitions/types";
import { findAllWithPagination } from "@utils/dbUtils";
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
    let thread =
      (created as any)?.dataValues ||
      (created as any)?.[0]?.dataValues ||
      created;
    if (thread) {
      await this.setCache((thread as any).id, thread as any);
    }
    if (populate && thread) {
      thread = await this.getById(thread.id);
    }
    return thread as IBaseThread;
  }

  async getById(id: string) {
    const cached = await this.getCache(id);
    if (cached) return cached as any;

    const res = await Thread.findByPk(id, { raw: true });
    if (res) await this.setCache(id, res as any);
    return res as any;
  }

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
      const row = await Thread.findByPk(id);
      if (!row) throw new Error("Thread not found");
      await row.update(validData as any);
      return row.toJSON() as any;
    });
    await this.deleteCache(id);
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
    await this.deleteCache(id);
    return row.toJSON() as any;
  }
}

export default ThreadsService;
