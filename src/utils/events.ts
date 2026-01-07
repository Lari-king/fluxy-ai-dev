// Global event system for cross-component communication

export const AppEvents = {
  TRANSACTIONS_UPDATED: 'app:transactions:updated',
  PEOPLE_UPDATED: 'app:people:updated',
  BUDGETS_UPDATED: 'app:budgets:updated',
  CATEGORIES_UPDATED: 'app:categories:updated',
  GOALS_UPDATED: 'app:goals:updated',
};

export function emitEvent(eventName: string, data?: any) {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event);
}

export function onEvent(eventName: string, callback: (data?: any) => void) {
  const handler = (event: Event) => {
    callback((event as CustomEvent).detail);
  };
  
  window.addEventListener(eventName, handler);
  
  return () => {
    window.removeEventListener(eventName, handler);
  };
}
