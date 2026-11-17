import { api } from './api.js';
import { createModal } from './modal.js';

const KIND_LABELS = { chat: 'Chat model', embed: 'Embedding model' };

function formatValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function detailRow(key, value) {
  const row = document.createElement('div');
  row.className = 'detail-row';
  const name = document.createElement('div');
  name.className = 'detail-key';
  name.textContent = key;
  const content = document.createElement('pre');
  content.className = 'detail-value';
  content.textContent = formatValue(value);
  row.append(name, content);
  return row;
}

function openModal({ title, subtitle, body }) {
  const { modal, body: bodyElement, close } = createModal({ label: title });

  const header = document.createElement('div');
  header.className = 'modal-header';
  const heading = document.createElement('div');
  const titleElement = document.createElement('h2');
  titleElement.className = 'modal-title';
  titleElement.textContent = title;
  const subtitleElement = document.createElement('p');
  subtitleElement.className = 'modal-subtitle';
  subtitleElement.textContent = subtitle;
  heading.append(titleElement, subtitleElement);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'modal-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.innerHTML =
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  header.append(heading, closeButton);

  modal.prepend(header);
  bodyElement.append(body);
  closeButton.addEventListener('click', close);
  closeButton.focus();
}

async function showModelDetails(kind) {
  const body = document.createElement('div');
  try {
    const info = await api.modelInfo(kind);
    body.append(detailRow('server', info.url));
    for (const model of info.models) {
      body.append(detailRow('served model', model.id));
    }
    if (info.status) {
      body.append(detailRow('status', info.status));
    }
    for (const [key, value] of Object.entries(info.props)) {
      body.append(detailRow(key, value));
    }
    openModal({ title: info.name, subtitle: KIND_LABELS[kind], body });
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'modal-error';
    message.textContent = `${error.message}\n\nStart llama-server for this model, then reload.`;
    body.append(message);
    openModal({
      title: KIND_LABELS[kind],
      subtitle: 'Unavailable',
      body,
    });
  }
}

export function initModels() {
  for (const button of document.querySelectorAll('.model-button')) {
    const kind = button.dataset.kind;
    const nameElement = document.querySelector(`#${kind}-model-name`);
    const statusElement = button.querySelector('[data-status]');
    button.addEventListener('click', () => showModelDetails(kind));

    api
      .modelInfo(kind)
      .then((info) => {
        nameElement.textContent = info.name;
        nameElement.title = info.name;
        statusElement.classList.add('online');
      })
      .catch(() => {
        nameElement.textContent = 'Offline';
        statusElement.classList.add('offline');
      });
  }
}
