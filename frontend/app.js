import { applyDesignSystem } from './js/design/index.js';
import { createChatList } from './js/chat-list.js';
import { createConversation } from './js/conversation.js';
import { initModels } from './js/models.js';

applyDesignSystem();

const chatList = createChatList({
  onSelect: (chatId) => conversation.open(chatId),
});

const conversation = createConversation({
  onChatCreated: (chat) => chatList.activate(chat.id),
  onChatUpdated: () => chatList.load(),
});

document.querySelector('#new-chat').addEventListener('click', () => {
  chatList.goHome();
});
document.querySelector('#brand-home').addEventListener('click', () => {
  chatList.goHome();
});

initModels();
chatList.load().then(() => conversation.open(null));
