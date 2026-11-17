// Reemplazo de 'firebase/auth' para la demo: una sesión simulada, sin red.
// El login acepta cualquier mail y contraseña; `window.__demo` deja que la landing
// reinicie el recorrido.
export type User = { uid: string; email: string; displayName: string; getIdToken: () => Promise<string> };
type Auth = { currentUser: User | null };
type Listener = (_user: User | null) => void;

const user: User = {
  uid: 'demo',
  email: 'operaciones@plantademo.com',
  displayName: 'Operaciones',
  getIdToken: async () => 'demo',
};
const auth: Auth = { currentUser: null };
const listeners = new Set<Listener>();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function setUser(next: User | null) {
  auth.currentUser = next;
  listeners.forEach((listener) => listener(next));
}

export const getAuth = (_app?: unknown) => auth;
export const connectAuthEmulator = () => {};

export async function signInWithEmailAndPassword(_auth: unknown, _email: string, _password: string) {
  await wait(650);
  setUser(user);
  return { user };
}

export async function signOut(_auth: unknown) {
  setUser(null);
}

export function onAuthStateChanged(_auth: unknown, callback: Listener | { next: Listener }) {
  const listener = typeof callback === 'function' ? callback : callback.next;
  listeners.add(listener);
  // Como Firebase: avisa el estado actual apenas se suscribe, pero no en el mismo tick.
  setTimeout(() => {
    if (new URLSearchParams(location.search).has('logged') && !auth.currentUser) setUser(user);
    else listener(auth.currentUser);
  }, 0);
  return () => listeners.delete(listener);
}

export const validatePassword = async () => ({ isValid: true });
export const sendPasswordResetEmail = async () => {};
export const verifyPasswordResetCode = async () => user.email;
export const confirmPasswordReset = async () => {};

declare global {
  interface Window {
    __demo: { signOut: () => void; signIn: () => void; isSignedIn: () => boolean };
  }
}
window.__demo = {
  signOut: () => setUser(null),
  signIn: () => setUser(user),
  isSignedIn: () => !!auth.currentUser,
};
