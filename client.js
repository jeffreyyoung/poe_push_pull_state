

const promisesRegistry = new Map();
class DeferredPromise {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    
}

window.Poe.registerHandler("events", (result) => {
    const response = result?.responses?.[0];
    if (!response) {
        return;
    }
    const { operationId, ...rest } = response;
    const deferred = promisesRegistry.get(operationId);
    if (!deferred) {
        return;
    }
    deferred.resolve(rest);
});




/**
LLM shape

type NotYetPushedEvent = {
    data: String,
    clientEventId: String,
}
type PushedEvent = NotYetPushedEvent &{
   eventId: string,
}

type Snapshot = {
    data?: string,
    lastIncludedEventId?: string,
}

type db = {
    getLastSnapshot: () => Promise<{ data?: string, lastIncludedEventId?: string, notYetIncludedEvents: PushedEvent[] }>,
    pushEvents: (events: NotYetPushedEvent[]) => Promise<void>,
    pullEvents: (afterEventId: string) => Promise<PushedEvent[]>,
    createSnapshot: (snapshot: Snapshot) => Promise<void>,
}
*/

function randomId() {
    return Math.random().toString(36).substring(2, 15);
}

const db = {
    getLastSnapshot: async () => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage(JSON.stringify({
            operationId,
            operation: "get_state"
        }))
    },
    pushEvents: async (events) => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage(JSON.stringify({
            operationId,
            operation: "push_events",
            params: { events }
        }))
    },
    pullEvents: async (afterEventId) => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage(JSON.stringify({
            operationId,
            operation: "get_events",
            params: {
                after_event_id: afterEventId
            }
        }))
    },
    createSnapshot: async ({ data, lastIncludedEventId }) => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage(JSON.stringify({
            operationId,
            operation: "set_state",
            params: {
                data,
                lastIncludedEventId
            }
        }))
    },
}