import React, { useEffect, useState } from 'react';
import { api, PlanSettings, PublicTestimonial } from '../../services/api';
import { Logo } from '../brand/Logo';
import { ThemeToggle } from '../common/ThemeToggle';

interface Props { onLogin: () => void; onRegister: () => void }

const FEATURES: [string, string, string][] = [
  ['🛒', 'Caisse rapide', 'Encaissez en quelques touches, imprimez ou envoyez le reçu par WhatsApp. Vous pouvez même dicter la vente à la voix.'],
  ['📦', 'Stocks sous contrôle', 'Quantités à jour après chaque vente, alertes de rupture, prix d\'achat et de vente pour connaître votre marge.'],
  ['📒', 'Carnet de crédit', 'Notez qui vous doit de l\'argent, enregistrez les remboursements et relancez par WhatsApp en un clic.'],
  ['💰', 'Trésorerie réelle', 'Espèces, Mobile Money, banque : voyez l\'argent réellement disponible, pas seulement le bénéfice.'],
  ['📶', 'Fonctionne sans internet', 'Vendez même sans réseau. Tout se synchronise tout seul au retour de la connexion.'],
  ['👥', 'Vos employés, chacun son accès', 'Gérant ou caissier : chacun se connecte avec son compte, en même temps, sur son téléphone.'],
  ['🏦', 'Score et dossier bancaire', 'Un dossier clair de votre activité pour appuyer une demande de crédit en banque ou en microfinance.'],
  ['✨', 'Assistant intelligent', 'Posez vos questions en français : « Comment vont mes ventes ? », « Que dois-je racheter ? ».'],
];
const FAQ: [string, string][] = [
  ['Faut-il toujours avoir internet ?', 'Non. Vous pouvez vendre et enregistrer vos opérations sans connexion. Les données sont envoyées automatiquement dès que le réseau revient.'],
  ['Mes données sont-elles en sécurité ?', 'Votre compte est protégé par un mot de passe, et vos données sont stockées sur l\'infrastructure Cloudflare. Seuls vous et les personnes à qui vous donnez un accès y ont accès.'],
  ['Puis-je l\'utiliser sur téléphone ?', 'Oui. Nafora s\'installe comme une application depuis votre navigateur (Chrome), sans passer par un magasin d\'applications, et fonctionne aussi sur ordinateur.'],
  ['Combien ça coûte ?', 'La création du compte est gratuite, avec un essai des fonctions Pro. Les tarifs sont indiqués ci-dessus et se paient par Mobile Money.'],
  ['Que se passe-t-il à la fin de l\'essai ?', 'Votre compte passe en lecture seule : vous gardez l\'accès à toutes vos données, mais rien de nouveau ne s\'enregistre tant que l\'abonnement Pro n\'est pas activé. Rien n\'est supprimé.'],
  ['Je ne suis pas à l\'aise avec la technologie, est-ce difficile ?', 'Non. La caisse se prend en main en quelques minutes : on touche les produits, on encaisse, c\'est tout. Vous pouvez même dicter la vente à la voix.'],
  ['Pour quels commerces ?', 'Boutiques, alimentation, quincaillerie, mode, restauration, pharmacie, services… tout petit commerce ou PME qui vend et suit des stocks ou des crédits.'],
];

const PAINS: [string, string][] = [
  ['Le cahier se perd, se mouille, se contredit', 'Nafora garde chaque vente, chaque dépense et chaque dette en sécurité, même si le téléphone change.'],
  ['« Combien j\'ai vraiment gagné ce mois ? »', 'Bénéfice du jour, du mois dernier ou d\'une période choisie, calculé automatiquement.'],
  ['Les clients qui oublient de payer', 'Le carnet de crédit note tout et prépare le rappel WhatsApp en un clic.'],
  ['Le stock qui manque au mauvais moment', 'Alertes de rupture, et la caisse bloque la vente d\'un produit épuisé.'],
];
const REASSURE: [string, string][] = [
  ['🎁', 'Essai Pro offert'], ['💳', 'Sans carte bancaire'], ['📶', 'Marche sans internet'], ['📱', 'Paiement Mobile Money'],
];
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export const LandingPage: React.FC<Props> = ({ onLogin, onRegister }) => {
  const [plans, setPlans] = useState<(PlanSettings & { whatsapp: string }) | null>(null);
  useEffect(() => { api.plans().then(setPlans).catch(() => {}); }, []);
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  useEffect(() => { api.testimonials().then(r => setTestimonials(r.items)).catch(() => {}); }, []);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const wa = plans?.whatsapp ? `https://wa.me/${plans.whatsapp}?text=${encodeURIComponent('Bonjour, je souhaite en savoir plus sur Nafora.')}` : '';
  const share = `https://wa.me/?text=${encodeURIComponent(`Découvre Nafora, l'application pour gérer ta boutique (ventes, stocks, crédits) même sans internet : ${typeof location !== 'undefined' ? location.origin : ''}`)}`;
  const btn = 'px-5 py-3 rounded-2xl font-bold text-sm transition active:scale-95';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" data-testid="landing">
      <header className="bg-emerald-950 text-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 font-black text-base sm:text-lg whitespace-nowrap"><Logo variant="horizontal" on="dark" className="h-9 sm:h-10" /></div>
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle className="!p-1.5 sm:!p-2" />
            <button onClick={onLogin} className="px-2 sm:px-3 py-2 rounded-xl text-[13px] sm:text-sm font-bold text-emerald-100 hover:bg-emerald-900 whitespace-nowrap" data-testid="landing-login"><span className="sm:hidden">Connexion</span><span className="hidden sm:inline">Se connecter</span></button>
            <button onClick={onRegister} className="px-2.5 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-bold bg-amber-400 text-stone-950 hover:bg-amber-300 whitespace-nowrap" data-testid="landing-register-top"><span className="sm:hidden">S'inscrire</span><span className="hidden sm:inline">Créer mon compte</span></button>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-emerald-950 to-emerald-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20 text-center">
          <Logo variant="stacked" on="dark" className="mx-auto mb-4 h-32 sm:h-40" alt="" />
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">Gérez votre commerce depuis votre téléphone, <span className="text-amber-300">même sans internet</span></h1>
          <p className="mt-4 text-emerald-100 max-w-2xl mx-auto text-base sm:text-lg">Ventes, stocks, dettes de vos clients, dépenses et trésorerie au même endroit. Pensé pour les commerçants et PME d'Afrique de l'Ouest.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={onRegister} className={`${btn} bg-amber-400 text-stone-950 hover:bg-amber-300`} data-testid="landing-register">Créer mon compte gratuitement</button>
          </div>
          <p className="mt-3 text-xs text-emerald-200">Sans carte bancaire • installation depuis le navigateur • en français</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
            {REASSURE.map(([i, t]) => <li key={t} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15"><span aria-hidden>{i}</span> {t}</li>)}
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12" aria-labelledby="problemes">
        <h2 id="problemes" className="text-2xl sm:text-3xl font-black text-center">Vous vous reconnaissez ?</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {PAINS.map(([p, a]) => (
            <div key={p} className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="font-extrabold text-rose-700">✗ {p}</p>
              <p className="mt-2 text-sm text-stone-700"><span className="font-bold text-emerald-700">✓ Avec Nafora : </span>{a}</p>
            </div>))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12" aria-labelledby="fonctions">
        <h2 id="fonctions" className="text-2xl sm:text-3xl font-black text-center">Tout ce qu'il faut pour tenir votre boutique</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(([i, t, d]) => (
            <article key={t} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="text-3xl" aria-hidden>{i}</div><h3 className="mt-2 font-extrabold">{t}</h3><p className="mt-1 text-sm text-stone-600">{d}</p>
            </article>))}
        </div>
      </section>

      <section className="bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl sm:text-3xl font-black text-center">Démarrer en 3 étapes</h2>
          <ol className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
            {[['1', 'Créez votre compte', 'Votre nom, votre boutique, votre numéro de téléphone : 2 minutes.'], ['2', 'Ajoutez vos produits', 'Saisissez vos articles et vos prix, ou commencez à vendre tout de suite.'], ['3', 'Vendez et suivez', 'Vos chiffres du jour, vos stocks et vos crédits se mettent à jour automatiquement.']].map(([n, t, d]) => (
              <li key={n} className="p-4"><div className="mx-auto w-10 h-10 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center">{n}</div><h3 className="mt-3 font-extrabold">{t}</h3><p className="text-sm text-stone-600 mt-1">{d}</p></li>))}
          </ol>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-12" aria-labelledby="avis">
          <h2 id="avis" className="text-2xl sm:text-3xl font-black text-center">Ils gèrent leur commerce avec Nafora</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <figure key={i} className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="text-amber-400 text-sm" aria-label={`${t.rating} sur 5`}>{'★'.repeat(t.rating)}</div>
                <blockquote className="mt-1 text-sm text-stone-700">« {t.text} »</blockquote>
                <figcaption className="mt-3 text-xs text-stone-500"><b className="text-stone-900">{t.name}</b>{t.shop_label ? ` · ${t.shop_label}` : ''}{t.city ? `, ${t.city}` : ''}</figcaption>
              </figure>))}
          </div>
        </section>
      )}

      <section className="max-w-4xl mx-auto px-4 py-12" aria-labelledby="tarifs">
        <h2 id="tarifs" className="text-2xl sm:text-3xl font-black text-center">Tarifs simples</h2>
        {plans?.enabled ? (
          <div className="mt-8 grid gap-4 max-w-md mx-auto">
            <div className="bg-emerald-900 text-white rounded-2xl p-6"><h3 className="font-extrabold text-lg">Pro</h3><div className="text-3xl font-black mt-1">{fmt(plans.price12)} <span className="text-base font-bold">{plans.currency} / an</span></div>
              <p className="text-xs text-emerald-200">Abonnement annuel unique</p>
              <ul className="mt-3 text-sm text-emerald-100 space-y-1 list-disc pl-5"><li>Caisse, stocks, dettes, trésorerie</li><li>Fonctionne sans internet</li><li>Employés illimités</li><li>Assistant IA étendu</li><li>Paiement par Mobile Money ou en ligne (international)</li></ul>
              <p className="mt-3 text-xs text-amber-200">{plans.trialDays} jours d'essai Pro offerts à l'inscription.</p></div>
          </div>
        ) : (
          <p className="mt-6 text-center text-stone-600">Nafora est <b>gratuit pendant la phase de lancement</b>. Créez votre compte et profitez de toutes les fonctions.</p>)}
      </section>

      <section className="bg-white border-y border-stone-200" aria-labelledby="faq">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 id="faq" className="text-2xl sm:text-3xl font-black text-center">Questions fréquentes</h2>
          <div className="mt-6 space-y-3">{FAQ.map(([q, a]) => <details key={q} className="rounded-xl border border-stone-200 p-4 group"><summary className="font-bold cursor-pointer">{q}</summary><p className="mt-2 text-sm text-stone-600">{a}</p></details>)}</div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-black">Prêt à mieux gérer votre commerce ?</h2>
        <p className="mt-2 text-sm text-stone-600">{plans?.enabled && plans.trialDays ? `${plans.trialDays} jours d'essai Pro offerts, sans carte bancaire.` : 'Création du compte en 2 minutes.'}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={onRegister} className={`${btn} bg-emerald-700 text-white hover:bg-emerald-800`}>Créer mon compte</button>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} bg-green-600 text-white hover:bg-green-700`}>Nous écrire sur WhatsApp</a>}
          <a href={share} target="_blank" rel="noopener noreferrer" className={`${btn} border border-stone-300 bg-white`}>Recommander à un commerçant</a>
        </div>
      </section>

      {showSticky && (
        <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-emerald-950/95 backdrop-blur border-t border-emerald-800 px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-emerald-100">Essayez Nafora gratuitement</span>
          <button onClick={onRegister} className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-400 text-stone-950 active:scale-95">Créer mon compte</button>
        </div>
      )}

      <footer className="bg-emerald-950 text-emerald-200 text-sm pb-14 sm:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Nafora</span>
          <nav className="flex flex-wrap gap-4"><a href="/a-propos.html" className="hover:text-white">À propos</a><a href="/contact.html" className="hover:text-white">Contact</a><a href="/confidentialite.html" className="hover:text-white">Confidentialité</a><a href="/conditions.html" className="hover:text-white">Conditions d'utilisation</a></nav>
        </div>
      </footer>
    </div>
  );
};
