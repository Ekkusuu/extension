export function getById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }

  return element as T;
}

export function queryRequired<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element ${selector}`);
  }

  return element as T;
}

export function getInputEventValue(event: Event): string {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    throw new Error("Expected input event target");
  }

  return target.value;
}
