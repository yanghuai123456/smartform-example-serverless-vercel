// api/submit.ts — Vercel Edge Function. Forwards browser submissions to SmartForm.
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body     = await req.json();
  const endpoint = process.env.SMARTFORM_ENDPOINT || 'https://api.usesmartform.com';
  const formId   = process.env.SMARTFORM_FORM_ID;

  const r = await fetch(`${endpoint}/api/v1/f/${formId}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body:    JSON.stringify(body),
  });

  return new Response(await r.text(), {
    status:  r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
