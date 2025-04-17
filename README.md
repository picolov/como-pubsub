# Como - PubSub

<img src="como.png" onerror="this.onerror=null; this.src='https://github.com/picolov/como-pubsub/blob/master/como.png'" alt="Como PubSub Logo" width="200" />

[![npm version](https://img.shields.io/npm/v/como-pubsub.svg?style=flat-square)](https://www.npmjs.com/package/como-pubsub)
[![npm downloads](https://img.shields.io/npm/dm/como-pubsub.svg?style=flat-square)](https://www.npmjs.com/package/como-pubsub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.0.0-blue?style=flat-square)](https://bun.sh)

A lightweight, fast, and type-safe publish-subscribe library for communication between components. Built with Bun and fully compatible with Node.js.

## ✨ Features

- 🔒 Type-safe with TypeScript
- 🌐 Works in both Bun and Node.js
- 🧩 Simple and intuitive API
- 🚀 Asynchronous by design

## 📦 Installation

```bash
# Using npm
npm install como-pubsub

# Using yarn
yarn add como-pubsub

# Using pnpm
pnpm add como-pubsub
```

## 🚀 Quick Start

```typescript
import { emit, listen, unlisten } from 'como-pubsub';

// Subscribe to a topic
const subscriptionId = await listen('user-updates', (topic, payload) => {
  console.log(`📨 Received update on ${topic}:`, payload);
});

// Publish a message
await emit('user-updates', { 
  userId: 123,
  action: 'profile-updated',
  timestamp: new Date()
});

// Unsubscribe when done
await unlisten('user-updates', subscriptionId);
```

## 📚 API Reference

### `emit(topic: string, payload: any): Promise<void>`

Publish a message to a topic.

**Parameters:**
- `topic` (string): The topic to publish to
- `payload` (any): The message payload

**Example:**
```typescript
await emit('system-alerts', {
  level: 'warning',
  message: 'High CPU usage detected',
  timestamp: new Date()
});
```

### `listen(topic: string, callback: (topic: string, payload: any) => void): Promise<string>`

Subscribe to a topic.

**Parameters:**
- `topic` (string): The topic to subscribe to
- `callback` (function): Function to be called when a message is received

**Returns:**
- `Promise<string>`: A unique subscription ID

**Example:**
```typescript
const subId = await listen('data-updates', (topic, data) => {
  console.log(`New data on ${topic}:`, data);
});
```

### `unlisten(topic: string, uuid: string): Promise<void>`

Unsubscribe from a topic.

**Parameters:**
- `topic` (string): The topic to unsubscribe from
- `uuid` (string): The subscription ID to remove

**Example:**
```typescript
await unlisten('data-updates', subscriptionId);
```
