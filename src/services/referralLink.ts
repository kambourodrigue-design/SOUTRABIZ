// Lien de parrainage : https://<site>/?ref=CODE — le code est gardé jusqu'à l'inscription.
const KEY = 'nafora_ref';
const clean = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
export const captureReferral = (): void => {
  try {
    const c = clean(new URLSearchParams(window.location.search).get('ref') || '');
    if (c) localStorage.setItem(KEY, c);
  } catch { /* stockage indisponible */ }
};
export const savedReferral = (): string => { try { return clean(localStorage.getItem(KEY) || ''); } catch { return ''; } };
export const clearReferral = (): void => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
export const referralUrl = (code: string): string => `${window.location.origin}/?ref=${code}`;
