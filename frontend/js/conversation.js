import { api, streamMessage } from './api.js';
import { createCopyButton } from './clipboard.js';
import { renderMarkdown } from './markdown.js';

const SUGGESTIONS = [
  'Explain retrieval-augmented generation in simple terms',
  'Write a Python function for cosine similarity',
  'Summarize the key ideas in a document I paste',
  'Brainstorm names for a local-first side project',
];

export function createConversation({ onChatCreated, onChatUpdated }) {
  const messagesElement = document.querySelector('#messages');
  const composer = document.querySelector('#composer');
  const input = document.querySelector('#composer-input');
  const sendButton = document.querySelector('#send');
  let currentChatId = null;
  let pending = false;

  function messageActions(role, getText) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    actions.append(
      createCopyButton({
        getText,
        label: role === 'assistant' ? 'Copy reply' : 'Copy message',
        className: 'message-copy',
      }),
    );
    return actions;
  }

  function messageShell(role) {
    const element = document.createElement('div');
    element.className = `message ${role}`;
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    element.append(contentElement);
    if (role === 'assistant') element.classList.add('markdown-body');
    return { element, contentElement };
  }

  function bubble(role, content) {
    const { element, contentElement } = messageShell(role);
    if (role === 'assistant') {
      contentElement.append(renderMarkdown(content));
    } else {
      contentElement.textContent = content;
    }

    if (role === 'assistant' || role === 'user') {
      element.append(messageActions(role, () => content));
    }

    return element;
  }

  function scrollToBottom() {
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }

  function append(element) {
    messagesElement.append(element);
    scrollToBottom();
  }

  function typingIndicator() {
    const element = document.createElement('div');
    element.className = 'message assistant typing';
    element.setAttribute('aria-label', 'Thinking');
    element.append(
      document.createElement('span'),
      document.createElement('span'),
      document.createElement('span'),
    );
    return element;
  }

  function setPending(value) {
    pending = value;
    input.disabled = value;
    sendButton.disabled = value;
    if (!value) input.focus();
  }

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }

  function renderHome() {
    const home = document.createElement('div');
    home.className = 'home';
    const title = document.createElement('h1');
    title.textContent = 'What do you want to know?';
    const hints = document.createElement('p');
    hints.className = 'home-subtitle';
    hints.textContent = 'Ask anything, or start from a suggestion.';
    const suggestions = document.createElement('div');
    suggestions.className = 'suggestions';
    for (const text of SUGGESTIONS) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggestion';
      chip.textContent = text;
      chip.addEventListener('click', () => send(text));
      suggestions.append(chip);
    }
    home.append(title, hints, suggestions);
    messagesElement.append(home);
  }

  async function open(chatId) {
    currentChatId = chatId;
    messagesElement.replaceChildren();
    if (!chatId) {
      renderHome();
      input.focus();
      return;
    }
    const { messages } = await api.getChat(chatId);
    if (chatId !== currentChatId) return;
    for (const message of messages) {
      messagesElement.append(bubble(message.role, message.content));
    }
    scrollToBottom();
  }

  async function send(content) {
    if (pending) return;
    if (!currentChatId) {
      const chat = await api.createChat();
      currentChatId = chat.id;
      await onChatCreated(chat);
    }
    const chatId = currentChatId;
    if (messagesElement.querySelector('.home')) {
      messagesElement.replaceChildren();
    }
    append(bubble('user', content));
    const typing = typingIndicator();
    append(typing);
    setPending(true);

    let streamingElement = null;
    let streamingContent = null;
    let streamed = '';
    let rendered = '';
    let renderTimer = 0;
    let doneEvent = null;
    let errorDetail = null;

    function renderStreaming() {
      if (!streamingContent) return;
      rendered = streamed;
      streamingContent.replaceChildren(renderMarkdown(streamed));
      scrollToBottom();
    }

    function scheduleRender() {
      if (renderTimer) return;
      renderTimer = setTimeout(() => {
        renderTimer = 0;
        renderStreaming();
      }, 32);
    }

    function showStreaming() {
      if (streamingElement) return;
      typing.remove();
      const shell = messageShell('assistant');
      streamingElement = shell.element;
      streamingContent = shell.contentElement;
      streamingElement.classList.add('streaming');
      append(streamingElement);
      renderStreaming();
    }

    try {
      await streamMessage(chatId, content, {
        onDelta(delta) {
          streamed += delta;
          showStreaming();
          scheduleRender();
        },
        onDone(event) {
          doneEvent = event;
        },
        onError(detail) {
          errorDetail = detail;
        },
      });
    } catch (error) {
      errorDetail = error.message;
    }

    if (renderTimer) {
      clearTimeout(renderTimer);
      renderTimer = 0;
    }
    typing.remove();

    if (doneEvent) onChatUpdated(doneEvent.chat);
    if (currentChatId !== chatId) {
      streamingElement?.remove();
      setPending(false);
      return;
    }

    if (doneEvent) {
      const finalContent = doneEvent.assistant_message.content;
      if (streamingElement) {
        streamingElement.classList.remove('streaming');
        if (rendered !== finalContent) {
          streamingContent.replaceChildren(renderMarkdown(finalContent));
        }
        streamingElement.append(
          messageActions('assistant', () => finalContent),
        );
        scrollToBottom();
      } else {
        append(bubble('assistant', finalContent));
      }
    } else {
      streamingElement?.remove();
      append(
        bubble(
          'error',
          errorDetail || 'The reply ended before it was finished.',
        ),
      );
    }
    setPending(false);
  }

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content || pending) return;
    input.value = '';
    resizeInput();
    send(content);
  });

  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      composer.requestSubmit();
    }
  });

  return { open };
}
