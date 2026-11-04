// Fuseau (décalage fixe en minutes par rapport à UTC) selon le pays de la boutique,
// pour découper les jours des statistiques admin à l'heure locale des commerçants.
// Pays non listés (Burkina, Côte d'Ivoire, Mali, Sénégal, Ghana, Togo, Guinée…) : UTC.
const H = 60;
const TABLE: [string[], number][] = [
  [['cameroun', 'cameroon', 'gabon', 'congo', 'republique du congo', 'rdc', 'republique democratique du congo', 'rd congo', 'benin', 'niger', 'tchad', 'centrafrique', 'republique centrafricaine', 'nigeria', 'nigéria', 'guinee equatoriale', 'angola', 'algerie', 'tunisie', 'maroc', 'france', 'belgique', 'suisse', 'allemagne', 'espagne', 'italie'], 1 * H],
  [['egypte', 'afrique du sud', 'burundi', 'rwanda', 'zambie', 'zimbabwe', 'malawi', 'mozambique', 'botswana', 'libye', 'grece'], 2 * H],
  [['kenya', 'tanzanie', 'ouganda', 'ethiopie', 'madagascar', 'comores', 'djibouti', 'somalie', 'erythree', 'mayotte', 'arabie saoudite', 'qatar'], 3 * H],
  [['maurice', 'ile maurice', 'seychelles', 'reunion', 'la reunion', 'emirats arabes unis'], 4 * H],
  [['canada', 'quebec'], -5 * H],
];
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").trim();
const MAP = new Map<string, number>();
for (const [names, off] of TABLE) for (const n of names) MAP.set(norm(n), off);

/** Décalage en minutes (0 si pays inconnu ou en UTC). */
export const countryOffsetMin = (country: unknown): number => MAP.get(norm(String(country ?? ''))) ?? 0;

/** Jour AAAA-MM-JJ à l'heure locale pour une date ISO complète (…T…Z) ; une date seule est gardée telle quelle. */
export const localDayOf = (iso: string, offsetMin: number): string => {
  if (!offsetMin || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) || !/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) return iso.slice(0, 10);
  const t = Date.parse(iso);
  return Number.isNaN(t) ? iso.slice(0, 10) : new Date(t + offsetMin * 60000).toISOString().slice(0, 10);
};
