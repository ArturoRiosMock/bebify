const FILE_FIELD_SELECTOR = '.helium-registration-form .cf-field[data-cf-field-type="file"]';
const FILE_INPUT_SELECTOR = 'input[type="file"]';
const CLEAR_BUTTON_ATTR = 'data-bebify-file-clear';
const FILE_CONTAINER_SELECTOR = '.cf-file-preview-container';

function clearHeliumFileField(container: HTMLElement): void {
  const nativeRemove = container.querySelector<HTMLButtonElement>('button.cf-remove');
  if (nativeRemove) {
    nativeRemove.click();
    return;
  }

  const input = container.querySelector<HTMLInputElement>(FILE_INPUT_SELECTOR);
  if (!input) return;

  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function hasSelectedFile(container: Element): boolean {
  if (container.querySelector('.cf-file-preview')) {
    return true;
  }

  const input = container.querySelector<HTMLInputElement>(FILE_INPUT_SELECTOR);
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

function showFileUploadError(field: HTMLElement, message: string): void {
  field.setAttribute('data-cf-invalid', 'true');

  let errorList = field.querySelector<HTMLElement>('.bebify-file-upload-error');
  if (!errorList) {
    errorList = document.createElement('div');
    errorList.className = 'bebify-file-upload-error cf-field-errors';
    errorList.setAttribute('role', 'alert');
    field.appendChild(errorList);
  }

  errorList.textContent = message;
}

function clearFileUploadError(field: HTMLElement): void {
  field.querySelector('.bebify-file-upload-error')?.remove();
  if (!field.querySelector('.cf-field-errors:not(.bebify-file-upload-error)')) {
    field.removeAttribute('data-cf-invalid');
  }
}

function bindFileInput(input: HTMLInputElement): void {
  if (input.dataset.bebifyFileBound === 'true') return;
  input.dataset.bebifyFileBound = 'true';
  input.setAttribute('accept', '.pdf,application/pdf');

  input.addEventListener(
    'change',
    () => {
      const field = input.closest<HTMLElement>('.cf-field');
      if (!field) return;

      window.setTimeout(() => {
        const preview = field.querySelector('.cf-file-preview');
        const stillInvalid = field.getAttribute('data-cf-invalid') === 'true';
        const hasFile = Boolean(input.files?.length);

        if (preview) {
          clearFileUploadError(field);
          return;
        }

        if (hasFile && stillInvalid) {
          showFileUploadError(
            field,
            'No se pudo procesar el PDF. Espera unos segundos o selecciona el archivo de nuevo.',
          );
        }
      }, 1500);
    },
    { capture: true },
  );
}

function enhanceFileFields(root: ParentNode): void {
  if (!(root instanceof HTMLElement || root instanceof Document)) return;

  root.querySelectorAll<HTMLInputElement>(`${FILE_FIELD_SELECTOR} ${FILE_INPUT_SELECTOR}`).forEach(bindFileInput);
  enhanceAllFileContainers(root);
}

/**
 * Mejora campos file de Helium: botón eliminar, accept PDF y feedback si la subida falla.
 */
export function enhanceHeliumFileFields(root: ParentNode): () => void {
  enhanceFileFields(root);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;

        if (node.matches(FILE_CONTAINER_SELECTOR)) {
          enhanceFileContainer(node);
        }

        enhanceFileFields(node);
      });

      if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        const target = mutation.target;

        if (target.matches(FILE_CONTAINER_SELECTOR) || target.closest(FILE_CONTAINER_SELECTOR)) {
          const container = target.matches(FILE_CONTAINER_SELECTOR)
            ? target
            : target.closest<HTMLElement>(FILE_CONTAINER_SELECTOR);
          if (container) syncClearButton(container);
        }

        if (
          target.matches('.cf-field[data-cf-field-type="file"]') &&
          target.getAttribute('data-cf-invalid') !== 'true'
        ) {
          clearFileUploadError(target);
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
