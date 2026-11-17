async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  listChats: (query = '') =>
    request(`/api/chats?q=${encodeURIComponent(query)}`),
  createChat: () => request('/api/chats', { method: 'POST' }),
  getChat: (chatId) => request(`/api/chats/${chatId}`),
  deleteChat: (chatId) => request(`/api/chats/${chatId}`, { method: 'DELETE' }),
  deleteChats: (ids) =>
    request('/api/chats/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  modelInfo: (kind) => request(`/api/models/${kind}`),
};

/**
 * Send a message and consume the server-sent event stream. Handlers:
 * onStart({ chat, user_message }), onDelta(text), onDone({ chat,
 * assistant_message }), onError(detail).
 */
export async function streamMessage(chatId, content, handlers) {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  function handleFrame(frame) {
    for (const line of frame.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      const event = JSON.parse(payload);
      if (event.type === 'delta') handlers.onDelta(event.content);
      else if (event.type === 'done') handlers.onDone(event);
      else if (event.type === 'chat') handlers.onStart?.(event);
      else if (event.type === 'error') handlers.onError(event.detail);
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      handleFrame(frame);
    }
  }
}
