import { api } from './api.js';
import { confirmDialog } from './dialog.js';

const TRASH_ICON = `
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.5 8h7l.5-8M6.5 6.5v4M9.5 6.5v4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

const CLOSE_ICON = `
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  </svg>
`;

export function createChatList({ onSelect }) {
  const listElement = document.querySelector('#chat-list');
  const toolbar = document.querySelector('#chat-toolbar');
  const searchInput = document.querySelector('#chat-search');
  let chats = [];
  let activeId = null;
  let query = '';
  let selectionMode = false;
  let selectedIds = new Set();
  let busy = false;
  let error = '';

  function clearSelection() {
    selectionMode = false;
    selectedIds.clear();
  }

  function syncToolbar() {
    const count = toolbar.querySelector('.chat-bulk-count');
    if (!count) return;
    const selectedCount = selectedIds.size;
    count.textContent = `${selectedCount} selected`;

    const deleteButton = toolbar.querySelector('.chat-bulk-delete');
    deleteButton.disabled = selectedCount === 0 || busy;

    const allCheck = toolbar.querySelector('.chat-check');
    const visibleSelected = chats.filter((chat) =>
      selectedIds.has(chat.id),
    ).length;
    allCheck.disabled = chats.length === 0;
    allCheck.checked = chats.length > 0 && visibleSelected === chats.length;
    allCheck.indeterminate =
      visibleSelected > 0 && visibleSelected < chats.length;
  }

  function renderToolbar() {
    toolbar.replaceChildren();
    toolbar.classList.toggle('selecting', selectionMode);

    if (!selectionMode) {
      const label = document.createElement('span');
      label.className = 'chat-toolbar-label';
      label.textContent = 'Chats';
      toolbar.append(label);

      if (chats.length > 0) {
        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.className = 'chat-tool';
        selectButton.textContent = 'Select';
        selectButton.title = 'Select chats to delete';
        selectButton.addEventListener('click', () => {
          selectionMode = true;
          selectedIds.clear();
          renderToolbar();
          render();
        });
        toolbar.append(selectButton);
      }
      return;
    }

    const allLabel = document.createElement('label');
    allLabel.className = 'chat-select-all';
    const allCheck = document.createElement('input');
    allCheck.type = 'checkbox';
    allCheck.className = 'chat-check';
    allCheck.setAttribute('aria-label', 'Select all visible chats');
    allCheck.addEventListener('change', () => {
      for (const chat of chats) {
        if (allCheck.checked) selectedIds.add(chat.id);
        else selectedIds.delete(chat.id);
      }
      for (const row of listElement.querySelectorAll('.chat-row')) {
        const selected = selectedIds.has(row.dataset.chatId);
        row.classList.toggle('selected', selected);
        const checkbox = row.querySelector('.chat-check');
        if (checkbox) checkbox.checked = selected;
      }
      syncToolbar();
    });
    const allText = document.createElement('span');
    allText.textContent = 'All';
    allLabel.append(allCheck, allText);

    const count = document.createElement('span');
    count.className = 'chat-bulk-count';
    count.setAttribute('aria-live', 'polite');

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'chat-bulk-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', deleteSelected);

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'chat-bulk-cancel';
    cancelButton.setAttribute('aria-label', 'Cancel selection');
    cancelButton.title = 'Cancel selection';
    cancelButton.innerHTML = CLOSE_ICON;
    cancelButton.addEventListener('click', exitSelection);

    toolbar.append(allLabel, count, deleteButton, cancelButton);
    syncToolbar();
  }

  function render() {
    listElement.replaceChildren();

    if (error) {
      const message = document.createElement('p');
      message.className = 'chat-list-error';
      message.textContent = error;
      listElement.append(message);
    }

    if (chats.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'chat-list-empty';
      empty.textContent = query ? 'No chats match your search' : 'No chats yet';
      listElement.append(empty);
      return;
    }

    for (const chat of chats) {
      const row = document.createElement('div');
      row.className = 'chat-row';
      row.dataset.chatId = chat.id;
      if (chat.id === activeId) row.classList.add('active');
      if (selectedIds.has(chat.id)) row.classList.add('selected');

      if (selectionMode) {
        const label = document.createElement('label');
        label.className = 'chat-item chat-select-row';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'chat-check';
        checkbox.checked = selectedIds.has(chat.id);
        checkbox.setAttribute('aria-label', `Select ${chat.title}`);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selectedIds.add(chat.id);
          else selectedIds.delete(chat.id);
          row.classList.toggle('selected', checkbox.checked);
          syncToolbar();
        });
        const title = document.createElement('span');
        title.className = 'chat-item-title';
        title.textContent = chat.title;
        title.title = chat.title;
        label.append(checkbox, title);
        row.append(label);
      } else {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'chat-item';
        item.textContent = chat.title;
        item.title = chat.title;
        if (chat.id === activeId) item.classList.add('active');
        item.addEventListener('click', () => select(chat.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'chat-delete';
        deleteButton.title = `Delete ${chat.title}`;
        deleteButton.setAttribute('aria-label', `Delete ${chat.title}`);
        deleteButton.innerHTML = TRASH_ICON;
        deleteButton.addEventListener('click', () => deleteOne(chat));

        row.append(item, deleteButton);
      }

      listElement.append(row);
    }
  }

  async function load() {
    try {
      const payload = await api.listChats(query);
      chats = payload.chats;
      error = '';
      if (selectionMode) {
        const visible = new Set(chats.map((chat) => chat.id));
        for (const id of [...selectedIds]) {
          if (!visible.has(id)) selectedIds.delete(id);
        }
      }
    } catch (loadError) {
      error = loadError.message || 'Could not load chats.';
    }
    renderToolbar();
    render();
  }

  function select(chatId) {
    activeId = chatId;
    clearSelection();
    renderToolbar();
    render();
    onSelect(chatId);
  }

  function exitSelection() {
    clearSelection();
    renderToolbar();
    render();
  }

  async function performDeletion(action, failureMessage) {
    busy = true;
    try {
      await action();
      await load();
    } catch (deleteError) {
      error = deleteError.message || failureMessage;
      render();
    } finally {
      busy = false;
      syncToolbar();
    }
  }

  async function deleteOne(chat) {
    if (busy) return;
    const confirmed = await confirmDialog({
      title: 'Delete chat?',
      message: `"${chat.title}" and all of its messages will be permanently deleted.`,
      confirmLabel: 'Delete chat',
    });
    if (!confirmed) return;

    await performDeletion(async () => {
      await api.deleteChat(chat.id);
      selectedIds.delete(chat.id);
      if (activeId === chat.id) {
        activeId = null;
        onSelect(null);
      }
    }, 'Could not delete chat.');
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    const count = ids.length;
    if (busy || count === 0) return;
    const noun = count === 1 ? 'chat' : 'chats';
    const possessive = count === 1 ? 'its' : 'their';
    const confirmed = await confirmDialog({
      title: `Delete ${count} ${noun}?`,
      message: `The selected ${noun} and all of ${possessive} messages will be permanently deleted.`,
      confirmLabel: `Delete ${count} ${noun}`,
    });
    if (!confirmed) return;

    await performDeletion(async () => {
      await api.deleteChats(ids);
      const removedActive = activeId && ids.includes(activeId);
      clearSelection();
      if (removedActive) {
        activeId = null;
        onSelect(null);
      }
    }, `Could not delete the selected ${noun}.`);
  }

  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      query = searchInput.value;
      await load();
    }, 200);
  });

  return {
    load,
    select,
    goHome() {
      activeId = null;
      clearSelection();
      renderToolbar();
      render();
      onSelect(null);
    },
    async activate(chatId) {
      activeId = chatId;
      clearSelection();
      await load();
    },
  };
}
