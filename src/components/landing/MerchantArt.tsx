import React, { useEffect, useState } from 'react';

export type Scene = 'boutique' | 'marche' | 'couture' | 'resto';

/** Personnage : tête, cheveux, boutique-tablier, bras tenant un téléphone Nafora. */
const Person: React.FC<{ x: number; y: number; skin: string; hair: string; top: string; accent: string; scarf?: boolean; phone?: boolean }> = ({ x, y, skin, hair, top, accent, scarf, phone = true }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-42 150 Q-44 78 0 72 Q44 78 42 150 Z" fill={top} />
    <path d="M-14 74 Q0 96 14 74 Z" fill={skin} />
    <rect x="-8" y="58" width="16" height="20" rx="6" fill={skin} />
    <circle cx="0" cy="36" r="26" fill={skin} />
    <path d="M-27 34 Q-28 6 0 6 Q28 6 27 34 Q16 14 0 16 Q-16 14 -27 34 Z" fill={hair} />
    {scarf && <path d="M-30 30 Q0 -14 30 30 Q26 16 0 6 Q-26 16 -30 30 Z" fill={accent} />}
    <circle cx="-9" cy="38" r="2.6" fill="#1c1917" /><circle cx="9" cy="38" r="2.6" fill="#1c1917" />
    <path d="M-9 49 Q0 58 9 49" stroke="#7c2d12" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="-17" cy="46" r="4" fill="#f87171" opacity=".25" /><circle cx="17" cy="46" r="4" fill="#f87171" opacity=".25" />
    {phone && (<g>
      <path d="M30 110 Q56 100 60 70" stroke={skin} strokeWidth="13" strokeLinecap="round" fill="none" />
      <rect x="48" y="40" width="30" height="50" rx="6" fill="#0f172a" transform="rotate(8 63 65)" />
      <rect x="52" y="45" width="22" height="38" rx="3" fill="#10b981" transform="rotate(8 63 65)" />
      <path d="M56 70 L61 66 L65 69 L71 60" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="rotate(8 63 65)" />
    </g>)}
    <rect x="-26" y="112" width="52" height="38" rx="6" fill={accent} opacity=".9" />
  </g>
);

const Sky: React.FC<{ a: string; b: string; id: string }> = ({ a, b, id }) => (
  <>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${id})`} />
    <circle cx="335" cy="55" r="30" fill="#fde68a" opacity=".9" />
  </>
);

const Awning: React.FC<{ x: number; w: number; c1: string; c2: string }> = ({ x, w, c1, c2 }) => {
  const n = 8, s = w / n;
  return (<g>{Array.from({ length: n }).map((_, i) => (
    <path key={i} d={`M${x + i * s} 70 h${s} v38 q-${s / 2} 14 -${s} 0 z`} fill={i % 2 ? c2 : c1} />))}
    <rect x={x - 4} y="64" width={w + 8} height="8" rx="3" fill="#44403c" /></g>);
};

const Crate: React.FC<{ x: number; y: number; w?: number; color: string }> = ({ x, y, w = 56, color }) => (
  <g><rect x={x} y={y} width={w} height="26" rx="4" fill="#92400e" />
    {Array.from({ length: Math.floor(w / 12) }).map((_, i) => <circle key={i} cx={x + 8 + i * 12} cy={y - 3} r="8" fill={color} />)}</g>
);

const Art: React.FC<{ scene: Scene }> = ({ scene }) => {
  if (scene === 'marche') return (
    <svg viewBox="0 0 400 300" className="w-full h-full" role="img" aria-label="Commerçante au marché avec fruits et légumes">
      <Sky id="gm" a="#fed7aa" b="#fef3c7" />
      <rect y="232" width="400" height="68" fill="#a16207" opacity=".55" />
      <Awning x={40} w={320} c1="#16a34a" c2="#fbbf24" />
      <rect x="46" y="108" width="6" height="130" fill="#44403c" /><rect x="348" y="108" width="6" height="130" fill="#44403c" />
      <Person x={200} y={96} skin="#6b3f26" hair="#1c1917" top="#e11d48" accent="#fbbf24" scarf />
      <rect x="40" y="228" width="320" height="22" rx="4" fill="#78350f" />
      <Crate x={56} y={204} color="#ef4444" /><Crate x={122} y={204} color="#f97316" /><Crate x={254} y={204} color="#84cc16" /><Crate x={320} y={204} w={36} color="#facc15" />
    </svg>);
  if (scene === 'couture') return (
    <svg viewBox="0 0 400 300" className="w-full h-full" role="img" aria-label="Couturier dans son atelier">
      <Sky id="gc" a="#ddd6fe" b="#fce7f3" />
      <rect y="236" width="400" height="64" fill="#7c3aed" opacity=".25" />
      {[60, 110, 160].map((x, i) => <g key={x}><path d={`M${x} 70 l-18 10 v110 h36 v-110 z`} fill={['#f59e0b', '#10b981', '#ef4444'][i]} /><path d={`M${x - 18} 100 h36 M${x - 18} 130 h36`} stroke="#fff" strokeWidth="3" opacity=".5" /></g>)}
      <line x1="30" y1="62" x2="200" y2="62" stroke="#44403c" strokeWidth="5" />
      <Person x={290} y={90} skin="#4a2c17" hair="#0c0a09" top="#2563eb" accent="#fbbf24" />
      <rect x="224" y="206" width="150" height="14" rx="4" fill="#78350f" /><rect x="236" y="220" width="8" height="30" fill="#78350f" /><rect x="354" y="220" width="8" height="30" fill="#78350f" />
      <path d="M232 206 q18 -26 40 -6 q24 -24 44 -2" fill="#f472b6" />
    </svg>);
  if (scene === 'resto') return (
    <svg viewBox="0 0 400 300" className="w-full h-full" role="img" aria-label="Restauratrice et son plat">
      <Sky id="gr" a="#bbf7d0" b="#fef9c3" />
      <rect y="238" width="400" height="62" fill="#15803d" opacity=".3" />
      <Awning x={30} w={340} c1="#dc2626" c2="#fef2f2" />
      <Person x={150} y={100} skin="#7a4a2b" hair="#1c1917" top="#f59e0b" accent="#ffffff" scarf />
      <rect x="40" y="216" width="320" height="16" rx="4" fill="#78350f" />
      {[250, 300, 340].map((x, i) => <g key={x}><ellipse cx={x} cy="208" rx="24" ry="8" fill="#e7e5e4" /><path d={`M${x - 20} 208 q20 -26 40 0`} fill={['#ea580c', '#65a30d', '#facc15'][i]} />
        <path d={`M${x - 6} 180 q-6 -10 0 -18 M${x + 6} 180 q6 -10 0 -18`} stroke="#fff" strokeWidth="3" fill="none" opacity=".7" strokeLinecap="round" /></g>)}
    </svg>);
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full" role="img" aria-label="Boutiquier devant sa boutique de quartier">
      <Sky id="gb" a="#bae6fd" b="#ecfccb" />
      <rect y="240" width="400" height="60" fill="#78716c" opacity=".35" />
      <rect x="30" y="60" width="340" height="190" rx="6" fill="#fef3c7" /><rect x="30" y="60" width="340" height="34" rx="6" fill="#065f46" />
      <text x="200" y="84" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="800" fontSize="20" fill="#fde68a">BOUTIQUE</text>
      {[48, 118].map(x => <g key={x}><rect x={x} y="108" width="64" height="70" rx="4" fill="#bae6fd" />{[0, 1, 2].map(r => <rect key={r} x={x + 6} y={116 + r * 20} width="52" height="10" rx="2" fill={['#ef4444', '#facc15', '#22c55e'][r]} />)}</g>)}
      <Person x={290} y={100} skin="#5b3a22" hair="#1c1917" top="#047857" accent="#fbbf24" />
      <rect x="40" y="214" width="320" height="18" rx="4" fill="#78350f" />
      {[60, 82, 104].map((x, i) => <rect key={x} x={x} y="190" width="16" height="24" rx="3" fill={['#f43f5e', '#3b82f6', '#f59e0b'][i]} />)}
    </svg>);
};

/** Photo réelle si /photos/<scene>.jpg existe (à déposer dans public/photos), sinon illustration. */
export const MerchantImage: React.FC<{ scene: Scene; className?: string }> = ({ scene, className = '' }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    const src = `/photos/${scene}.jpg`; const im = new Image();
    im.onload = () => setPhoto(src); im.src = src;
  }, [scene]);
  return (
    <div className={`overflow-hidden ${className}`}>
      {photo ? <img src={photo} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Art scene={scene} />}
    </div>
  );
};
