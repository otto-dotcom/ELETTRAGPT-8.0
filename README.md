# ElettraGPT - Automated CRM Assistant

AI-powered automation for Elettra TempoCasa CRM using the DOE (Directive-Orchestration-Executive) architecture.

## Architecture

### Three-Layer System

1. **Directive Layer**: Instructions, role definitions, and request interpretation guidelines
2. **Orchestration Layer**: AI agent (Claude) that interprets queries and routes to executives
3. **Executive Layer**: Optimized Puppeteer scripts for each CRM task

## Current Status

### Implemented

- ✅ Project structure and TypeScript configuration
- ✅ Executive function framework with type definitions
- ✅ Browser Session Manager (Puppeteer wrapper)
- ✅ **Login Executive** - Handles authentication to Elettra CRM

### In Development

- 🔨 Additional executive functions (contacts, leads, properties)
- 🔨 Orchestration layer with Claude API integration
- 🔨 REST API server
- 🔨 Lovable frontend

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Elettra CRM account with valid credentials

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# ELETTRA_URL=https://your-elettra-instance.tempocasa.it
# ELETTRA_EMAIL=your-email@example.com
# ELETTRA_PASSWORD=your-password
```

### Test Login Executive

```bash
# Run the login test
npm run test:login
```

This will:
1. Launch a Puppeteer browser (visible mode)
2. Navigate to your Elettra CRM instance
3. Attempt login with your credentials
4. Take screenshots at each step
5. Verify successful authentication
6. Display results in the console

Screenshots will be saved to `./screenshots/` directory.

## Project Structure

```
ELETTRAGPT/
├── src/
│   ├── executives/           # Executive functions (task automation scripts)
│   │   └── login.executive.ts
│   ├── services/             # Core services
│   │   └── browser-session.service.ts
│   ├── types/                # TypeScript type definitions
│   │   └── executive.ts
│   └── test-login.ts         # Test script for login executive
├── screenshots/              # Screenshots for debugging (auto-created)
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Example environment file
├── package.json
├── tsconfig.json
└── README.md
```

## Executive Functions

### Login Executive

The login executive handles authentication to Elettra CRM with multiple strategies:

**Features:**
- Google OAuth support (if available)
- Traditional email/password login
- Multiple selector strategies for finding form elements
- Smart waiting for heavy DOM rendering
- Screenshot capture at each step
- Login verification
- User information extraction

**Parameters:**
- `email` (required): User email
- `password` (required): User password
- `url` (optional): Elettra CRM URL (defaults to env variable)

**Usage:**
```typescript
const loginExecutive = new LoginExecutive();
const result = await loginExecutive.execute(
  {
    email: 'user@example.com',
    password: 'password123',
    url: 'https://tempocasa.elettraweb.it'
  },
  session
);
```

## Customization for Your Elettra Instance

The login executive uses multiple selector strategies to find form elements. If login fails, you may need to:

1. Run the test and check the screenshots in `./screenshots/`
2. Inspect your Elettra login page DOM
3. Update selectors in `src/executives/login.executive.ts`:
   - `emailSelectors` array (line ~135)
   - `passwordSelectors` array (line ~158)
   - `submitSelectors` array (line ~182)
   - Success/failure indicators (lines ~310-330)

## Environment Variables

```env
# Required
ELETTRA_URL=https://your-instance.tempocasa.it
ELETTRA_EMAIL=your-email@example.com
ELETTRA_PASSWORD=your-password

# Optional
HEADLESS=false                # Set to true for headless browser
BROWSER_TIMEOUT=30000         # Timeout in milliseconds
```

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

## Next Steps

1. **Test the Login Executive** with your Elettra instance
2. **Customize selectors** if needed based on your DOM structure
3. **Build more executives** (add contact, create lead, etc.)
4. **Integrate Claude API** for orchestration
5. **Create REST API** for external access
6. **Build Lovable frontend** for chat interface

## Troubleshooting

### Login fails with "Could not find email input field"

The selectors don't match your Elettra instance. Check screenshots and update selectors in the login executive.

### Browser doesn't launch

Ensure you have sufficient permissions and Chrome/Chromium is installed. Puppeteer will download Chromium automatically on first install.

### Timeout errors

Your Elettra instance might be slower than expected. Increase `BROWSER_TIMEOUT` in `.env`:
```env
BROWSER_TIMEOUT=60000  # 60 seconds
```

## Security Notes

- Never commit `.env` file to version control
- Credentials are only used locally by Puppeteer
- Consider using encrypted credential storage for production
- Use separate test account for development

## License

MIT
