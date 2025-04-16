import * as mqtt from 'mqtt';

interface BrokerConfig {
    host: string;
    port: number;
    protocol: string;
    username?: string;
    password?: string;
    clientId: string;
}

class RemoteBroker {
    private config: BrokerConfig;
    private client: mqtt.MqttClient | null;
    private isConnected: boolean;

    constructor(config: Partial<BrokerConfig>) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 1883,
            protocol: config.protocol || 'mqtt',
            username: config.username,
            password: config.password,
            clientId: config.clientId || `mqtt_client_${Math.random().toString(16).slice(2, 8)}`
        };

        this.client = null;
        this.isConnected = false;
    }

    async emit(name: string, payload: any): Promise<void> {
        const options: mqtt.IClientPublishOptions = {};
        if (!this.isConnected) {
            await this._connect();
        }
        await this.client!.publishAsync(name, payload, options);
    }

    async listen(name: string, callback: (topic: string, payload: any) => void): Promise<string> {
        if (!this.isConnected) {
            await this._connect();
        }

        const uuid = crypto.randomUUID();
        await this._subscribe(name, callback);
        return uuid;
    }

    async unlisten(name: string, uuid: string): Promise<void> {
        if (!this.isConnected || !this.client) {
            return;
        }

        await this.client.unsubscribeAsync(name);
    }

    private async _connect(): Promise<this> {
        const url = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
        try {


            this.client = await mqtt.connectAsync(url, {
                username: this.config.username,
                password: this.config.password,
                clientId: this.config.clientId
            });
            this.isConnected = true;

            this.client.on('error', (error: Error) => {
                console.error('MQTT connection error:', error);
            });

            this.client.on('close', () => {
                this.isConnected = false;
                console.log('Disconnected from MQTT broker');
            });
        } catch (error) {
            console.error('MQTT connection error:', error);
        }
        return this;
    }

    private isIncomingTopicAndListenedTopicMatch(listenedTopic: string, incomingTopic: string): boolean {
        if (listenedTopic === incomingTopic) {
            return true;
        } else if (listenedTopic.endsWith("#")) {
            return incomingTopic.startsWith(listenedTopic.slice(0, -1));
        } else if (listenedTopic.includes("+")) {
            const incomingTopicParts = incomingTopic.split("/");
            const listenedTopicParts = listenedTopic.split("/");
            if (incomingTopicParts.length !== listenedTopicParts.length) {
                return false;
            }
            for (let i = 0; i < incomingTopicParts.length; i++) {
                if (incomingTopicParts[i] !== listenedTopicParts[i]) {
                    if (listenedTopicParts[i].startsWith("+")) {
                        continue;
                    } else {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

    private async _subscribe(topic: string, callback: (topic: string, payload: any) => void): Promise<void> {
        if (!this.isConnected || !this.client) {
            await this._connect();
        }
        try {
            await this.client!.subscribeAsync(topic);
            this.client!.on('message', (receivedTopic: string, message: Buffer) => {
                console.log("Received message on topic", {receivedTopic, topic});
                if (this.isIncomingTopicAndListenedTopicMatch(topic, receivedTopic)) {
                    callback(receivedTopic, message);
                }
            });
        } catch (error) {
            console.error('MQTT subscribe error:', error);
        }
    }

    private async _disconnect(): Promise<void> {
        if (this.client) {
            await this.client.endAsync();
            this.isConnected = false;
        }
    }
}

export default RemoteBroker; 