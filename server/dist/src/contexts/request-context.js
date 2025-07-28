import { AsyncLocalStorage } from "async_hooks";
const asyncLocalStorage = new AsyncLocalStorage();
const RequestContext = {
    run: (context, callback) => {
        return asyncLocalStorage.run(context, callback);
    },
    getContext: () => {
        return asyncLocalStorage.getStore();
    },
    getRequestId: () => {
        return asyncLocalStorage.getStore()?.requestId;
    },
    getSession: () => {
        const context = asyncLocalStorage.getStore();
        return context?.session;
    },
    // Add method to update context
    updateContext: (updates) => {
        const currentContext = asyncLocalStorage.getStore();
        if (currentContext) {
            // Merge the updates with current context
            Object.assign(currentContext, updates);
        }
    },
    // Add method to set specific values
    setContextValue: (key, value) => {
        const currentContext = asyncLocalStorage.getStore();
        if (currentContext) {
            currentContext[key] = value;
        }
    },
};
export default RequestContext;
//# sourceMappingURL=request-context.js.map