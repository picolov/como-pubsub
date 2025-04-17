import RemoteBroker from './remote_broker';
import LocalBroker from './local_broker';
import { encode, decode } from '@msgpack/msgpack';

interface BrokerConfig {
    host: string;
    clientId: string;
    port?: number;
    username?: string;
    password?: string;
}

interface ParsedName {
    isInternal: boolean;
    eventName: string;
    remoteAddress: string | null;
}

interface BrokerResult {
    broker: LocalBroker | RemoteBroker;
    eventName: string;
}

const _localBroker = new LocalBroker();
const _remoteBrokerMap: Record<string, RemoteBroker> = {};

const parseNameIsInternalOrRemote = (name: string): ParsedName => {
    const nameParts = name.split("::");
    const isInternal = nameParts.length === 1 || nameParts[0] === "internal";
    const eventName = isInternal ? 
        (nameParts.length === 1 ? nameParts[0] : nameParts[1]) : 
        nameParts[1];
    const remoteAddress = isInternal ? null : nameParts[0];

    return {
        isInternal,
        eventName,
        remoteAddress
    };
};

const getOrCreateRemoteBrokerFromMapIfNotExist = (address: string): RemoteBroker => {
    let remoteBroker: RemoteBroker;
    if (address in _remoteBrokerMap) {
        remoteBroker = _remoteBrokerMap[address];
    } else {
        // check if there is a <user>:<password>@<xxx.i.p.xxx> user-password auth
        const userPassAddressParts = address.split("@");
        let userPassParts: string[] = [];
        let hostPortParts: string[] = [];

        if (userPassAddressParts.length > 1) {
            userPassParts = userPassAddressParts[0].split(":");
            hostPortParts = userPassAddressParts[1].split(":");
        } else {
            hostPortParts = userPassAddressParts[0].split(":");
        }

        const config: BrokerConfig = {
            host: hostPortParts[0],
            clientId: crypto.randomUUID(),
            port: hostPortParts.length > 1 ? parseInt(hostPortParts[1]) : 1883,
            username: userPassParts.length > 0 ? userPassParts[0] : undefined,
            password: userPassParts.length > 1 ? userPassParts[1] : undefined
        };

        remoteBroker = new RemoteBroker(config);
        _remoteBrokerMap[address] = remoteBroker;
    }
    return remoteBroker;
};

const _getBroker = (name: string): BrokerResult => {
    const { isInternal, eventName, remoteAddress } = parseNameIsInternalOrRemote(name);
    const broker = isInternal ? _localBroker : getOrCreateRemoteBrokerFromMapIfNotExist(remoteAddress!);
    return { broker, eventName };
};

/**
 * Emit an event with the given name and payload
 * @param name The name of the event
 * @param payload The data to be sent with the event
 */
export async function emit(name: string, payload: any): Promise<void> {
    const { broker, eventName } = _getBroker(name);
    await broker.emit(eventName, encode(payload));
};

/**
 * Listen for events with the given name
 * @param name The name of the event to listen for
 * @param callback The function to be called when the event is emitted
 * @returns A unique identifier for the listener
 */
export async function listen(name: string, callback: (topic: string, payload: any) => void): Promise<string> {
    const { broker, eventName } = _getBroker(name);
    console.log("Listening for messages on", eventName);
    return await broker.listen(eventName, (topic: string, payload: Uint8Array) => {
        console.log("Received message on", eventName, topic, payload);
        callback(topic, decode(payload));
    });
};

/**
 * Remove a listener for the given event name and UUID
 * @param name The name of the event
 * @param uuid The unique identifier of the listener to remove
 */
export async function unlisten(name: string, uuid: string): Promise<void> {
    const { broker, eventName } = _getBroker(name);
    await broker.unlisten(eventName, uuid);
}; 