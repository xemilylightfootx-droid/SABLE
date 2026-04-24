# SABLE — Smart Contract Automation

Upload a template. Drop in any source document — email chain, questionnaire, existing contract, notes. SABLE's AI reads everything, extracts every field, and fills the template automatically.

## Quick start

### Option A — GitHub Codespaces (recommended)

1. Click **Code → Codespaces → Create codespace on main**
2. Wait for the container to build (~60 seconds)
3. Open `.env` and add your `ANTHROPIC_API_KEY`
4. Run `npm run dev`
5. Visit the forwarded port 3000

### Option B — Run locally

```bash
git clone https://github.com/xemilylightfootx-droid/SABLE.git
cd SABLE
npm install
npm run setup        # creates .env + database
```

Open `.env` and set your key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Then:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

| Step | What you do | What SABLE does |
|------|-------------|-----------------|
| 1 | Upload a template (.txt, .docx, .pdf) | Detects every `{{FIELD}}`, `[FIELD]`, `<<FIELD>>` placeholder |
| 2 | Upload source documents | Extracts all text from PDFs, DOCX, emails, etc. |
| 3 | Click **Fill with AI** | Claude reads all sources, maps info to every field, fills the template |
| 4 | Download | Get the completed document |

## Supported formats

**Templates:** `.txt` `.docx` `.pdf`  
**Source documents:** `.pdf` `.docx` `.txt` `.md` `.eml`

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com) |
| `DATABASE_URL` | Auto-set | SQLite path — set automatically by `npm run setup` |

## Scripts

```bash
npm run dev        # Start development server
npm run setup      # First-time setup: creates .env + database
npm run build      # Production build
npm run db:studio  # Browse the database in Prisma Studio
```
