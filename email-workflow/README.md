# TempoCasa Seveso — Email → Trello Workflow

Automated n8n workflow that watches `seveso@tempocasa.it`, classifies
incoming apartment-request emails with Claude AI, and adds a checklist
item to the correct Trello checklist depending on the source portal.

---

## What it does

```
seveso@tempocasa.it  →  Claude AI  →  Routing  →  Trello Checklists
      IMAP                              ↓
                              immobiliare.it  →  Checklist A
                              idealista       →  Checklist B
                              casa.it         →  Checklist C
                              altro           →  Checklist D
```

Each Trello item is formatted as:
```
Mario Rossi | Tel: 333 1234567 | Via Roma 12 Seveso | Richiesta
Giulia Bianchi | Tel: 347 9876543 | Trilocale Cesano | Chiamata Persa
```

Handles both email types from all portals:
- **Richiesta** — standard inquiry email with name, message, apartment
- **Chiamata Persa** — missed-call notification

---

## Quick Start

### Step 1 — Pull real emails to study patterns (optional)

```bash
cd email-workflow
cp .env.example .env          # fill in IMAP credentials
npm install
node fetch-sample-emails.js   # saves recent emails to ./sample-emails/
```

Review the files to confirm Claude's extraction prompt matches your
actual email formats. Adjust the prompt in `workflow.json` → node
"Claude — Analisi Email" → body if needed.

### Step 2 — Import workflow into n8n

1. Open n8n → **Workflows → Import from file**
2. Select `email-workflow/workflow.json`

### Step 3 — Create credentials in n8n

You need three credentials:

#### A) IMAP — `seveso@tempocasa.it`
- Type: **IMAP**
- Host: `mail.tempocasa.it` (or your mail server)
- Port: `993`
- User: `seveso@tempocasa.it`
- Password: (email password)
- SSL: on
- After saving, paste the credential ID into the **Email Trigger** node
  (`REPLACE_IMAP_CREDENTIAL_ID`)

#### B) Anthropic API Key
- Type: **HTTP Header Auth**
- Name: `Anthropic API Key`
- Header Name: `x-api-key`
- Header Value: your key from https://console.anthropic.com
- After saving, paste the credential ID into the **Claude — Analisi Email** node
  (`REPLACE_ANTHROPIC_CREDENTIAL_ID`)

#### C) Trello
- No n8n credential needed — key + token go directly into the URL params
  of each Trello node (already set to `REPLACE_TRELLO_API_KEY` / `REPLACE_TRELLO_TOKEN`)
- Get your key: https://trello.com/app-key
- Get your token: on the same page → click "Token"

### Step 4 — Swap Trello checklist IDs

Find the checklist ID for each portal's Trello checklist:
1. Open the Trello card that has the checklist
2. Add `.json` to the card URL: `https://trello.com/c/CARDID.json`
3. Search for `"checklists"` in the JSON → copy the `id` for each checklist

Then replace these placeholders in the four Trello nodes:
```
REPLACE_CHECKLIST_ID_IMMOBILIARE
REPLACE_CHECKLIST_ID_IDEALISTA
REPLACE_CHECKLIST_ID_CASA
REPLACE_CHECKLIST_ID_ALTRO
```

### Step 5 — Activate

Toggle the workflow **Active** in n8n. It will poll the inbox every
minute for new unseen emails.

---

## Install Claude node (optional — for n8n 1.x+ / cloud)

If you want to use the native Anthropic node instead of HTTP Request:

```
Settings → Community Nodes → Install → @n8n/n8n-nodes-langchain
```

Then replace the "Claude — Analisi Email" HTTP Request node with an
**Anthropic Chat Model** node connected to a **Basic LLM Chain** node.
The prompt stays the same.

---

## File structure

```
email-workflow/
├── workflow.json              ← import this into n8n
├── fetch-sample-emails.js     ← run locally to pull real emails
├── sample-emails/             ← example emails (one per portal/type)
│   ├── immobiliare-richiesta.txt
│   ├── immobiliare-chiamata-persa.txt
│   ├── idealista-richiesta.txt
│   ├── casa-richiesta.txt
│   ├── casa-chiamata-persa.txt
│   └── altro-portale.txt
├── package.json               ← deps for fetch-sample-emails.js only
├── .env.example               ← copy to .env before running fetch script
└── README.md
```

---

## Extending portals

To add a new portal (e.g. Trovacasa):

1. In **Routing per Portale** (Switch node) → add a new rule:
   - `$json.portal` equals `trovacasa` → new output
2. Add a new **Trello HTTP Request** node connected to that output
3. Update the Claude prompt (body of "Claude — Analisi Email") to
   recognise `trovacasa.it` → `"trovacasa"`

---

## Claude output schema

Every email produces one JSON object:

| Field           | Type              | Example                          |
|-----------------|-------------------|----------------------------------|
| `portal`        | string            | `"immobiliare"`                  |
| `tipo`          | string            | `"richiesta"` / `"chiamata_persa"` |
| `nome_cliente`  | string \| null    | `"Mario Rossi"`                  |
| `telefono`      | string \| null    | `"333 1234567"`                  |
| `email_cliente` | string \| null    | `"mario@gmail.com"`              |
| `appartamento`  | string \| null    | `"Via Roma 12, Seveso"`          |
| `messaggio`     | string \| null    | `"Vorrei visitare sabato..."`    |
| `trello_item`   | string            | `"Mario Rossi \| Tel: 333... \| ..."`  |

The `trello_item` field is what gets written to the Trello checklist.
