# Vercel Functions contact form proxy — Formspree alternative with AI spam filtering

A Vercel Function that receives browser submissions and forwards them to SmartForm AI.
Use this when you want to keep the form ID out of your public bundle, or add validation
before forwarding.

## What you're POSTing

The endpoint accepts a standard HTML form POST or JSON via AJAX. Two
kinds of fields:

**Your form fields** — `name`, `email`, `message`, whatever you
want. Every non-reserved field lands in your dashboard as a column in
the submissions table.

**Reserved fields** — names starting with `_` are interpreted by
the API, not stored:

| Field | Purpose |
|---|---|
| ``_gotcha`` | **Honeypot.** Keep it empty. Hidden from humans via CSS; bots fill it automatically. Any non-empty value silently drops the submission. Add this to every form. |
| ``_hp_email`` / ``_website`` / ``_url`` / ``_phone`` | Honeypot aliases for `_gotcha` (WordPress / WPForms / Contact Form 7 migrations). Same drop semantics. |
| ``_next`` | Same-origin URL to redirect to after a successful submission. Browser POST results in a 302 here. AJAX calls (with `Accept: application/json`) get the same value back as `next_url` in the JSON response. Only http(s) and in-site paths allowed. |
| ``_subject`` | Override the AI-generated email subject line. Max 200 chars; control characters stripped. |
| `X-Gotcha` header | Same as `_gotcha` for JSON requests where you can't add a hidden form field. |

Field names are Formspree-compatible — migrating from
`formspree.io/f/{form_id}` requires no renaming.

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


## FAQ

### Is there a free tier?

Yes. AI spam filtering is enabled by default on every plan. AI intent
classification and high-value lead detection require a paid plan (Pro
or Business) — the dashboard enforces this and returns HTTP 402 if
you try to enable them on a free workspace.

### Do I need an API key?

No. The form posts directly to a public endpoint using only an 8-char
form ID, which is non-enumerable. The example also includes a hidden
`_gotcha` honeypot field so naive bots cannot submit.

### Why use a Vercel Function?
The function keeps the form ID server-side, lets you add HMAC verification on top of the public endpoint, and runs on the edge runtime for low latency.

## Related examples
[Cloudflare Workers proxy](https://github.com/yanghuai123456/smartform-example-serverless-cloudflare) | [Netlify contact form](https://github.com/yanghuai123456/smartform-example-netlify) | [Next.js contact form](https://github.com/yanghuai123456/smartform-example-nextjs)


## License

MIT.

