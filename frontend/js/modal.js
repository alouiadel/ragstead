/**
 * Mount a modal dialog and provide its body and close function. Callers own
 * their header, content, actions, and any extra keyboard behavior.
 */
export function createModal({
  className = '',
  label,
  labelledBy,
  describedBy,
  onKeydown,
  onClose,
} = {}) {
  const root = document.querySelector('#modal-root');
  const previousFocus = document.activeElement;
  let closed = false;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = `modal${className ? ` ${className}` : ''}`;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  if (label) modal.setAttribute('aria-label', label);
  if (labelledBy) modal.setAttribute('aria-labelledby', labelledBy);
  if (describedBy) modal.setAttribute('aria-describedby', describedBy);

  const body = document.createElement('div');
  body.className = 'modal-body';
  modal.append(body);
  backdrop.append(modal);

  function close(value) {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', handleKeydown);
    root.replaceChildren();
    if (previousFocus?.isConnected) previousFocus.focus();
    onClose?.(value);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    onKeydown?.(event);
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  document.addEventListener('keydown', handleKeydown);
  root.replaceChildren(backdrop);

  return { modal, body, close };
}
