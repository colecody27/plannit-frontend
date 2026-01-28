import { browser } from '$app/environment';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

const normalizeBackendUrl = (value: string) =>
  value.replace(/localhost/g, '127.0.0.1').replace(/\/+$/, '');
const getSocketUrl = () => normalizeBackendUrl(PUBLIC_API_BASE_URL || 'http://127.0.0.1:5001');

export const connectSocket = () => {
  if (!browser) {
    return null;
  }
  if (socket) {
    return socket;
  }
  socket = io(getSocketUrl(), {
    withCredentials: true
  });
  console.log('Socket: connecting', { url: getSocketUrl() });
  socket.on('connect', () => {
    console.log('Socket: connected', { id: socket?.id });
  });
  socket.on('error', (payload) => {
    console.log('Socket: server error', payload);
  });
  socket.on('connect_error', (error) => {
    console.log('Socket: connect_error', error);
  });
  socket.on('disconnect', (reason) => {
    console.log('Socket: disconnected', { reason });
  });
  socket.onAny((event, ...args) => {
    console.log('Socket: onAny', { event, args });
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinPlan = (planId: string) => {
  const client = connectSocket();
  if (!client) {
    return;
  }
  if (client.connected) {
    console.log('Socket: join_plan emit (connected)', { plan_id: planId });
    client.emit('join_plan', { plan_id: planId });
  } else {
    client.once('connect', () => {
      console.log('Socket: join_plan emit (after connect)', { plan_id: planId });
      client.emit('join_plan', { plan_id: planId });
    });
  }
};

export const sendMessage = (planId: string, message: string) =>
  new Promise<{ sender_id: string; sender_name?: string; text: string; date: string } | null>((resolve) => {
    const client = connectSocket();
    if (!client) {
      resolve(null);
      return;
    }
    console.log('Socket: send_message emit', { plan_id: planId, message });
    client.emit('send_message', { plan_id: planId, message }, (payload: any) => {
      console.log('Socket: send_message ack', payload);
      resolve(payload ?? null);
    });
  });

export const onMessage = (
  handler: (payload: { sender_id: string; sender_name?: string; text: string; date: string }) => void
) => {
  const client = connectSocket();
  if (!client) {
    return () => {};
  }
  const listener = (payload: { sender_id: string; sender_name?: string; text: string; date: string }) => {
    handler(payload);
  };
  client.on('new_message', listener);
  return () => {
    client.off('new_message', listener);
  };
};
