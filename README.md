# SmartForm → Vercel Functions Proxy

A Vercel Function that receives browser submissions and forwards them to SmartForm AI.
Use this when you want to keep the form ID out of your public bundle, or add validation
before forwarding.

## Setup

1. Get a form ID at https://usesmartform.com/dashboard.
2. Deploy:
   ```bash
   git clone https://github.com/yanghuai123456/smartform-example-serverless-vercel.git
   cd smartform-example-serverless-vercel
   vercel link
   vercel env add SMARTFORM_ENDPOINT   # https://api.usesmartform.com
   vercel env add SMARTFORM_FORM_ID    # f_your_real_id
   vercel deploy --prod
   ```
3. Browser calls `POST /api/submit`. The function forwards to SmartForm.

## The function

```ts
// api/submit.ts — Vercel Edge Function
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await req.json();
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
```

## Static demo page

`index.html` is a plain HTML page that posts JSON to `/api/submit` and renders the
response inline.

```html
<form id="contact">
  <input name="name"  required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"
         style="position:absolute;left:-9999px" aria-hidden="true" />
  <button type="submit">Send</button>
  <p id="status"></p>
</form>
<script>
  document.getElementById('contact').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch('/api/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const body = await r.json();
    document.getElementById('status').textContent =
      `submission_id=${body.submission_id} intent=${body.intent}`;
  });
</script>
```

## How the SmartForm API works

- `POST {endpoint}/api/v1/f/{form_id}` — JSON or form-data, no API key.
- Response: `{ success, message, submission_id, is_spam, intent, next_url }`.

For the full contract, see https://usesmartform.com/docs.

## License

MIT.
