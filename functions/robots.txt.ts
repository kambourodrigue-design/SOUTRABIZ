// /robots.txt : les robots peuvent lire la page publique, jamais l'API.
export const onRequestGet: PagesFunction = async () => {
  const origin = 'https://nafora.link';
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
