# How to run Marketing Genie (GitHub web UI → Vercel)

No local setup. Five files, one free key, one deploy.

## The 5 files (exact paths matter)
```
package.json
app/layout.js
app/page.js
app/GenieApp.jsx
app/api/genie/route.js
```

## Step 1 — Get your free Gemini key
1. Go to **aistudio.google.com**
2. Click **Get API key** → **Create API key**
3. Copy it. Keep it private — it goes into Vercel, never into the code.

## Step 2 — Make the GitHub repo
1. github.com → **New repository** → name it `marketing-genie` → **Create**.

## Step 3 — Add the files (the folder trick)
For each file: **Add file → Create new file**. In the filename box, type the **full path including slashes** — GitHub makes the folders for you automatically.
- Type `package.json` → paste contents → **Commit**
- Type `app/layout.js` → paste → Commit
- Type `app/page.js` → paste → Commit
- Type `app/GenieApp.jsx` → paste → Commit
- Type `app/api/genie/route.js` → paste → Commit

(Typing `app/api/genie/route.js` creates the `app`, `api`, and `genie` folders in one go.)

## Step 4 — Deploy on Vercel
1. vercel.com → **Add New → Project**
2. **Import** your `marketing-genie` repo (connect GitHub if asked)
3. Framework = **Next.js** (auto-detected). Don't change anything.
4. **Before clicking Deploy**, open **Environment Variables** and add:
   - Name: `GEMINI_API_KEY`
   - Value: *(paste your Gemini key)*
5. Click **Deploy**. Wait ~1 minute.

## Step 5 — Open it
Vercel gives you a live link (e.g. `marketing-genie.vercel.app`). Open it, paste a product link in the chat, answer the genie's questions — the cockpit lights up.

## If the genie doesn't reply
- Vercel → your project → **Settings → Environment Variables** → confirm `GEMINI_API_KEY` is there and spelled exactly.
- After adding/fixing the key, **Deployments → ⋯ → Redeploy** (env vars only apply on a fresh deploy).

## To make changes later
Edit the file in GitHub → Commit. Vercel redeploys automatically in ~1 min.
