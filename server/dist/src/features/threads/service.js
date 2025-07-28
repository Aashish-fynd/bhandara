import { validateThreadCreate, validateThreadUpdate } from "./validation";
import { Thread } from "./model";
import { findAllWithPagination } from "@utils/dbUtils";
import { getThreadCache, setThreadCache, deleteThreadCache, isThreadLocked, lockThread, unlockThread } from "./helpers";
import { BadRequestError, ForbiddenError } from "@exceptions";
import MessageService from "@features/messages/service";
class ThreadsService {
    getCache = getThreadCache;
    setCache = setThreadCache;
    deleteCache = deleteThreadCache;
    messageService;
    populateFields = ["messages"];
    constructor() {
        this.messageService = new MessageService();
    }
    async populateThread(thread, fields) {
        const promises = {};
        fields.forEach((field) => {
            switch (field) {
                case "messages":
                    promises.messages = this.messageService.getAll({ threadId: thread.id }, { limit: 10 });
                    break;
            }
        });
        const results = await Promise.allSettled(Object.values(promises));
        const resolved = {};
        Object.keys(promises).forEach((key, idx) => {
            const r = results[idx];
            resolved[key] = r.status === "fulfilled" ? r.value : null;
        });
        if (fields.includes("messages")) {
            thread.messages = resolved.messages?.items;
        }
        return thread;
    }
    async _getByIdNoCache(id) {
        const res = await Thread.findByPk(id, { raw: true });
        return res;
    }
    async create(data, populate) {
        const created = await validateThreadCreate(data, async (validData) => {
            if (validData.parentId) {
                const parent = await this.getById(validData.parentId);
                if (!parent)
                    throw new BadRequestError("Parent thread not found");
                if (parent.parentId)
                    throw new BadRequestError("Nested threads beyond one level are not allowed");
            }
            const row = await Thread.create(validData);
            return row.toJSON();
        });
        let thread = created?.dataValues ||
            created?.[0]?.dataValues ||
            created;
        if (thread) {
            await this.setCache(thread.id, thread);
        }
        if (populate && thread) {
            thread = await this.getById(thread.id);
        }
        return thread;
    }
    async getById(id) {
        const cached = await this.getCache(id);
        if (cached)
            return cached;
        const res = await Thread.findByPk(id, { raw: true });
        if (res)
            await this.setCache(id, res);
        return res;
    }
    async update(id, data, populate) {
        const updated = await validateThreadUpdate(data, async (validData) => {
            if (validData.parentId) {
                const parent = await this.getById(validData.parentId);
                if (!parent)
                    throw new BadRequestError("Parent thread not found");
                if (parent.parentId)
                    throw new BadRequestError("Nested threads beyond one level are not allowed");
            }
            const row = await Thread.findByPk(id);
            if (!row)
                throw new Error("Thread not found");
            await row.update(validData);
            return row.toJSON();
        });
        await this.deleteCache(id);
        let thread = updated?.[0] ?? updated;
        if (populate && thread) {
            thread = await this.getById(id);
        }
        return thread;
    }
    async getAll(where = {}, pagination, select) {
        return findAllWithPagination(Thread, where, pagination, select);
    }
    async delete(id) {
        const row = await Thread.findByPk(id);
        if (!row)
            return null;
        await row.destroy();
        await this.deleteCache(id);
        return row.toJSON();
    }
    /**
     * Lock a thread - prevents new messages and reactions
     * @param threadId - The ID of the thread to lock
     * @param userId - The ID of the user locking the thread
     * @returns Promise<IBaseThread> - The updated thread
     */
    async lockThread(threadId, userId) {
        const thread = await this.getById(threadId);
        if (!thread) {
            throw new BadRequestError("Thread not found");
        }
        if (isThreadLocked(thread)) {
            throw new BadRequestError("Thread is already locked");
        }
        // Only allow thread author to lock the thread
        if (thread.createdBy !== userId) {
            throw new ForbiddenError("Only the thread author can lock this thread");
        }
        const lockedThread = lockThread(thread, userId);
        const updated = await this.update(threadId, { lockHistory: lockedThread.lockHistory });
        return updated;
    }
    /**
     * Unlock a thread - allows new messages and reactions again
     * @param threadId - The ID of the thread to unlock
     * @param userId - The ID of the user unlocking the thread
     * @returns Promise<IBaseThread> - The updated thread
     */
    async unlockThread(threadId, userId) {
        const thread = await this.getById(threadId);
        if (!thread) {
            throw new BadRequestError("Thread not found");
        }
        if (!isThreadLocked(thread)) {
            throw new BadRequestError("Thread is not locked");
        }
        // Only allow thread author to unlock the thread
        if (thread.createdBy !== userId) {
            throw new ForbiddenError("Only the thread author can unlock this thread");
        }
        const unlockedThread = unlockThread(thread);
        const updated = await this.update(threadId, { lockHistory: unlockedThread.lockHistory });
        return updated;
    }
    /**
     * Check if a thread and its parent chain is locked
     * @param threadId - The ID of the thread to check
     * @returns Promise<{isLocked: boolean, lockedThreadId?: string}> - Lock status and which thread is locked
     */
    async isThreadChainLocked(threadId) {
        const thread = await this.getById(threadId);
        if (!thread) {
            return { isLocked: false };
        }
        // Check if current thread is locked
        if (isThreadLocked(thread)) {
            return { isLocked: true, lockedThreadId: thread.id };
        }
        // Check if parent thread is locked (recursively)
        if (thread.parentId) {
            return await this.isThreadChainLocked(thread.parentId);
        }
        return { isLocked: false };
    }
}
export default ThreadsService;
//# sourceMappingURL=service.js.map