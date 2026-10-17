# Assistant IA gratuit (v3.1)

Nouveautés : onglet **Assistant ✨** (questions en français sur vos chiffres), **Conseils du jour**, et bouton **Relance IA** (message WhatsApp rédigé par l'IA) dans *Dettes*.
Réservé au propriétaire et au gérant (pas aux caissiers). Aucune migration D1 nécessaire.

## Activer (2 minutes)
1. Cloudflare → Workers & Pages → votre projet → **Settings** → **Bindings** → **Add** → **Workers AI**.
2. Nom de la variable : `AI` → Save. (Faites-le pour Production, et Preview si utilisé.)
3. Redéployez (envoyez les fichiers sur GitHub ou « Retry deployment »).

Sans cette liaison, l'assistant affiche « indisponible » et le reste de l'application fonctionne normalement ; la relance WhatsApp retombe sur le message standard.

## Limites et coûts
- Gratuit : 10 000 « neurones » par jour pour tout le compte Cloudflare (≈ plusieurs centaines de questions/jour au total). Au-delà : refus poli, ou ~0,011 $ / 1 000 neurones si vous passez en payant.
- Quotas intégrés : 15 demandes/jour par boutique, 400/jour pour toute la plateforme. Réglables (variables d'environnement, optionnelles) : `AI_DAILY_SHOP`, `AI_DAILY_GLOBAL`, `AI_MODEL`.
- Confidentialité : seul un résumé de chiffres est envoyé (aucun téléphone ni nom de client ; seul le prénom pour une relance).
- Bon en français ; pas de dioula/mooré. L'IA peut se tromper : elle se base uniquement sur les chiffres fournis.

## Fichiers modifiés / ajoutés
functions/_lib/ai.ts, functions/_lib/util.ts, functions/api/[[path]].ts, src/services/{api,aiSummary}.ts, src/components/assistant/AssistantView.tsx, src/components/debts/DebtsView.tsx, src/components/common/{Navbar,BottomNav}.tsx, src/App.tsx
