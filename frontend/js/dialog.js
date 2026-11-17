import { createModal } from './modal.js';

/**
 * Show a modal confirmation and resolve to true only when the user confirms.
 */
export function confirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}) {
  return new Promise((resolve) => {
    let cancelButton;
    let confirmButton;
    const { modal, body, close } = createModal({
      className: 'dialog',
      labelledBy: 'confirm-dialog-title',
      describedBy: 'confirm-dialog-message',
      onClose: (confirmed = false) => resolve(confirmed),
      onKeydown(event) {
        if (event.key !== 'Tab') return;
        if (event.shiftKey && document.activeElement === cancelButton) {
          event.preventDefault();
          confirmButton.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === confirmButton
        ) {
          event.preventDefault();
          cancelButton.focus();
        }
      },
    });

    const header = document.createElement('div');
    header.className = 'modal-header';
    const heading = document.createElement('h2');
    heading.className = 'modal-title';
    heading.id = 'confirm-dialog-title';
    heading.textContent = title;
    header.append(heading);

    const text = document.createElement('p');
    text.className = 'dialog-message';
    text.id = 'confirm-dialog-message';
    text.textContent = message;
    body.append(text);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'button button-ghost';
    cancelButton.textContent = cancelLabel;
    confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'button button-danger';
    confirmButton.textContent = confirmLabel;
    footer.append(cancelButton, confirmButton);

    modal.prepend(header);
    modal.append(footer);

    cancelButton.addEventListener('click', () => close(false));
    confirmButton.addEventListener('click', () => close(true));
    cancelButton.focus();
  });
}
