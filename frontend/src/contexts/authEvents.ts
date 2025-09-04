// authEvents.ts
// Simples EventEmitter para eventos de autenticação

const listeners: (() => void)[] = [];

export function subscribeAuthEvent(listener: () => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function emitAuthEvent() {
  listeners.forEach((fn) => fn());
}
