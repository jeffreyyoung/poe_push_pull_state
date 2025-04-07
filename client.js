

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
type State = {
    data: String,
    lastIncludedEventId: String,
}

type Event = {
    data: String,
    clientEventId: String,
}
type UnpushedEvent = Event & {
    eventId: String,
}

type Snapshot = {
    snapshotId: String,
    fromEventId: String,
    content: String,
}
*/

function randomId() {
    return Math.random().toString(36).substring(2, 15);
}

const db = {
    getState: async () => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage(JSON.stringify({
            operationId,
            operation: "get_state"
        }))
    },
    pushEvent: async (events) => {
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
    setState: async ({ data, lastIncludedEventId }) => {
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