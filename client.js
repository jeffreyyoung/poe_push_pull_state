

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
    data: string,
    clientNonce: string,
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
import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.6.8/+esm';

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
import { fromUint8Array, toUint8Array } from 'https://cdn.jsdelivr.net/npm/js-base64@3.7.7/base64.mjs';
let doc = null;
const myNonces = new Set();
export const db = {
    setupYjsDoc: async () => {
        if (doc) {
            return doc;
        }
        const result = await room.getLastSnapshot();
        console.log("result", result);
        const lastIncludedEventId = result.lastIncludedEventId;
        doc = new Y.Doc();
        if (result.data) {
            Y.applyUpdate(doc, toUint8Array(result.data))
        }
        if (result.notYetIncludedEvents) {
            for (const event of result.notYetIncludedEvents) {
                Y.applyUpdate(doc, toUint8Array(event.data))
            }
        }

        const updateQueue = [];
        doc.on('update', (update) => {
            console.log("update!!!", update);
            updateQueue.push(update);
        });


        async function sync() {
            console.log("setInterval updateQueue.length", updateQueue.length);
            if (updateQueue.length > 0) {
                // push updates
                const updates = updateQueue;
                updateQueue = [];
                const update = Y.mergeUpdates(updates);
                console.log("setIntervalpushing update", update);
                const nonce = randomId();
                myNonces.add(nonce);
                console.log("about to push events");
                await room.pushEvents([{
                    data: fromUint8Array(update),
                    clientNonce: nonce
                }]).catch((e) => {
                    console.error("error pushing update", e);
                });
                console.log("pushed events");
            }

            // now pull all the latest events
            console.log("about to pull events");
            const result = await room.pullEvents(lastIncludedEventId);
            console.log("pulled events", result);
            if (result.events.length === 0) {
                console.log("no events");
                return;
            }
            for (const event of result.events) {
                // not sure whether or not we should exclude events that we sent
                if (!myNonces.has(event.clientNonce)) {
                    Y.applyUpdate(doc, toUint8Array(event.data))
                }
            }
            const lastEventId = result.events?.at(-1)?.eventId;
            if (lastEventId) {
                lastIncludedEventId = lastEventId;
            }
            // create snapshot
            const snapshot = {
                data: fromUint8Array(Y.encodeStateAsUpdate(doc)),
                lastIncludedEventId
            }
            console.log("about to create snapshot");
            await room.createSnapshot(snapshot);
            console.log("created snapshot");
        }
 
        setInterval(async () => {
            sync().then(() => {
                console.log("synced");
            }).catch((e) => {
                console.error("error syncing", e);
            });
        }, 10_000);

        return doc;
    },
    Y,
}

