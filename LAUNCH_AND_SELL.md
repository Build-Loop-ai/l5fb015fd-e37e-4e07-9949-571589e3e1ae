# Launch & Sell this Box

You remixed a BuildLoop Box. This is everything you need to (1) get it live, (2) sell it, and (3) resell it to your own clients. Read once — it takes 10 minutes.

---

## 1. Get it live (≈15 minutes)

1. **Remix** the box into your own Lovable workspace (the "Edit with Lovable" badge → Remix). You now own a private copy.
2. **Set your secrets.** Open `.env.example` in this repo — it lists every key this box needs. Add them in Lovable → Project Settings → Secrets (or your Supabase project's Edge Function secrets). Don't paste secrets into the code.
3. **Push the database.** This box ships with `supabase/migrations/`. Apply them (Lovable Cloud does this automatically on first run; if you self-host Supabase, run the migrations once). Until they're applied, the app will show "can't read data" errors — that's the #1 cause of a blank or broken first load.
4. **Turn on Google login** (if you want it): in Supabase → Authentication → Providers → enable Google, and add your site's callback URL in the Google Cloud console. Email/password works out of the box; Google needs this one-time step.
5. **(Optional) Custom domain.** Point your domain at the deploy in Lovable/Cloudflare. Branded domains close more client deals.

### ⚠️ The free-tier gotcha (read this)
Supabase **pauses free projects after ~1 week of inactivity**. When that happens the database URL stops resolving and your widget/app goes dark — it looks broken but it's just asleep. For anything you put in front of a paying client, **use a paid Supabase project** (or keep it active). This is the single most common "it stopped working" report.

---

## 2. Which businesses to sell it to, and what to charge

| Box | Best-fit customer | What you're delivering | Suggested price |
|---|---|---|---|
| **Greet** (AI chat + voice widget) | Any local/SMB website — clinics, salons, trades, services | An embedded AI that answers FAQs, captures leads, and books — on their site, 24/7 | €99–299 / mo per site |
| **Voice Receptionist** (AI phone) | Appointment businesses that miss calls (dentists, clinics, salons, home services) | A phone line their AI answers and books from, after hours and overflow | €197–497 / mo |
| **Lead Pulse** (lead gen + outreach) | Agencies & B2B that need pipeline | AI-found, enriched leads + ready outreach sequences | €149–399 / mo |
| **Pitch** (proposal builder) | Web designers & agencies pitching prospects | Scan a prospect's site → branded proposal → track when they open it | €49–199 / mo, or per-proposal |

**How to sell it (the part people get stuck on):** don't sell "an AI app." Sell the outcome — "never miss a call again," "answer every website visitor instantly," "10 qualified leads a week." Demo it live with the prospect's *own* business name/site filled in (every box supports that in onboarding). The live demo is the close.

**On the security objection** ("why would I give an AI access to my data?"): you're not. Each client gets their **own** isolated project and database — their data never mixes with anyone else's, and you can run it on infrastructure they own. Say that plainly; it removes the #1 hesitation.

---

## 3. You can resell these — full white-label

**Yes — you can rebrand these Boxes and resell them to your own clients.** Full white-label rights:

- Change the **name, logo, colors, copy, and domain** to your brand or your client's.
- Run **one box per client** (each client gets their own remixed copy + their own Supabase project — clean separation).
- Charge whatever you want; the recurring revenue is yours.

What we ask: don't resell the **raw source/template itself** as a competing "box library." Sell the *running product and your service around it* — setup, customization, hosting, support. That's where your margin and your moat are.

---

## 4. Troubleshooting (the common ones)

- **Blank screen / "can't load data"** → migrations not applied yet, or your Supabase free project is paused. Apply migrations / wake or upgrade the project.
- **Widget/app not showing on the site** → check the embed snippet points at *your* deployed URL, and that the project isn't paused.
- **"I only have chat, where's voice?"** (Greet) → open the Widget Builder and toggle **Voice call** on (the phone icon), then add your Vapi key in secrets. New widgets now ship with it on.
- **Google login fails** → enable the Google provider in Supabase + add the callback URL (step 4 above). Email/password still works meanwhile.
- **Voice/phone features silent** → set the voice keys from `.env.example` (Vapi / Twilio / ElevenLabs depending on the box). Without them the buttons stay hidden by design.

Stuck? Post in the community with the exact error text and which step you're on — that's the fastest path to an answer.
