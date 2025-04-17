interface CallbackMap {
    [key: string]: (incomingTopic: string, message: any) => void;
}

interface Listeners {
    [key: string]: CallbackMap;
}

class LocalBroker {
    private listeners: Listeners;

    constructor() {
        this.listeners = {};
    }

    emit(topic: string, message: any): void {
        if (!this.listeners[topic]) {
            return;
        }
        const callbackMap = this.listeners[topic];
        Object.values(callbackMap).forEach(callback => callback(topic, message));
    }

    listen(topic: string, callback: (incomingTopic: string, message: any) => void): string {
        const uuid = crypto.randomUUID();
        if (!this.listeners[topic]) {
            this.listeners[topic] = {};
        }
        this.listeners[topic][uuid] = callback;
        return uuid;
    }

    unlisten(topic: string, uuid: string): void {
        if (!this.listeners[topic]) {
            return;
        }
        delete this.listeners[topic][uuid];
    }
}

export default LocalBroker; 