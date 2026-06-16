const FILE_CONTAINER_SELECTOR = '.helium-registration-form .cf-file-preview-container';
const CLEAR_BUTTON_ATTR = 'data-bebify-file-clear';

function clearHeliumFileField(container: HTMLElement): void {
  const nativeRemove = container.querySelector<HTMLButtonElement>('button.cf-remove');
  if (nativeRemove) {
    nativeRemove.click();
    return;
  }

  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) return;

  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function hasSelectedFile(container: Element): boolean {
  if (container.querySelector('.cf-file-preview')) {
    return true;
  }

  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  return Boolean(input?.files?.length);
}

function syncClearButton(container: HTMLElement): void {
  const existing = container.querySelector<HTMLButtonElement>(`[${CLEAR_BUTTON_ATTR}]`);

  if (!hasSelectedFile(container)) {
    existing?.remove();
    return;
  }

  if (existing) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute(CLEAR_BUTTON_ATTR, 'true');
  button.className = 'bebify-file-clear-btn';
  button.textContent = 'Eliminar archivo';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearHeliumFileField(container);
    window.requestAnimationFrame(() => syncClearButton(container));
  });

  container.appendChild(button);
}

function enhanceFileContainer(container: Element): void {
  if (!(container instanceof HTMLElement)) return;
  syncClearButton(container);
}

function enhanceAllFileContainers(root: ParentNode): void {
  root.querySelectorAll(FILE_CONTAINER_SELECTOR).forEach(enhanceFileContainer);
}

/**
 * Añade botón visible para quitar PDF/archivos en campos file de Helium Customer Fields.
 */
export function enhanceHeliumFileFields(root: ParentNode): () => void {
  enhanceAllFileContainers(root);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;

        if (node.matches(FILE_CONTAINER_SELECTOR)) {
          enhanceFileContainer(node);
        }

        enhanceAllFileContainers(node);
      });

      if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        const target = mutation.target;
        if (target.matches(FILE_CONTAINER_SELECTOR) || target.closest(FILE_CONTAINER_SELECTOR)) {
          const container = target.matches(FILE_CONTAINER_SELECTOR)
            ? target
            : target.closest<HTMLElement>(FILE_CONTAINER_SELECTOR);
          if (container) syncClearButton(container);
        }
      }
    }
  });

  if (root instanceof HTMLElement || root instanceof Document) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-cf-invalid'],
    });
  }

  return () => observer.disconnect();
}
