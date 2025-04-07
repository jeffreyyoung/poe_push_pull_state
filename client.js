

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
    console.log("result!!!", result)
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

type room = {
    getLastSnapshot: () => Promise<unknown>,
    pushEvents: (events: NotYetPushedEvent[]) => Promise<unknown>,
    pullEvents: (afterEventId: string) => Promise<unknown>,
    createSnapshot: (snapshot: Snapshot) => Promise<unknown>,
}
*/

function randomId() {
    return Math.random().toString(36).substring(2, 15);
}
// as
export const room = {
    getLastSnapshot: async () => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage("@push_pull_db " + JSON.stringify({
            operationId,
            operation: "get_state"
        }), {
            handler: "events"
        })
    },
    pushEvents: async (events) => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage("@push_pull_db " + JSON.stringify({
            operationId,
            operation: "events/push",
            params: { events }
        }), {
            handler: "events"
        })
    },
    pullEvents: async (afterEventId) => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage("@push_pull_db " + JSON.stringify({
            operationId,
            operation: "events/pull",
            params: {
                after_event_id: afterEventId
            }
        }), {
            handler: "events"
        })
    },
    createSnapshot: async ({ data, lastIncludedEventId }) => {
        const operationId = randomId();
        promisesRegistry.set(operationId, new DeferredPromise());
        await window.Poe.sendUserMessage("@push_pull_db " + JSON.stringify({
            operationId,
            operation: "set_state",
            params: {
                data,
                lastIncludedEventId
            }
        }), {
            handler: "events"
        })
    },
}