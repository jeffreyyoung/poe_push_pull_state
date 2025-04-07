

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
    console.log("result!!!", JSON.stringify(result, null, 2))
    if (!response) {
        return;
    }
    const json = JSON.parse(response.content);
    const deferred = promisesRegistry.get(json.operationId);
    if (!deferred) {
        return;
    }
    deferred.resolve(json.result);
});




/**
LLM shape

type NotYetPushedEvent = {
    data: String,
    clientNonce: String,
}
type PushedEvent = NotYetPushedEvent &{
   eventId: string,
}

type Snapshot = {
    data?: string,
    lastIncludedEventId?: string,
}

type room = {
    getLastSnapshot: () => Promise<{ data?: string, lastIncludedEventId?: string, notYetIncludedEvents: PushedEvent[] }>,
    pushEvents: (events: NotYetPushedEvent[]) => Promise<{ events: PushedEvent[] }>,
    pullEvents: (afterEventId: string) => Promise<{ events: PushedEvent[] }>,
    createSnapshot: (snapshot: Snapshot) => Promise<{ lastIncludedEventId: string, data: string }>,
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

        return promisesRegistry.get(operationId).promise;
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

        return promisesRegistry.get(operationId).promise;
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

        return promisesRegistry.get(operationId).promise;
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

        return promisesRegistry.get(operationId).promise;
    },
}