# Quick Start Guide - Login Executive

## What I Built for You

Your **Login Executive** is now ready! It's specifically designed to handle Elettra's Google OAuth popup authentication flow.

## Key Features

✅ **Google OAuth Popup Detection** - Automatically detects and handles the popup window
✅ **Account Selection** - Smart handling if you have multiple Google accounts
✅ **Screenshot Capture** - Takes screenshots at every step for debugging
✅ **Multi-language Support** - Handles both English and Italian UI
✅ **Error Handling** - Comprehensive error messages with debugging info

## How to Test

### Step 1: Configure Your Credentials

Edit the `.env` file with your actual Google account credentials:

```bash
ELETTRA_URL=https://tempocasa.elettraweb.it
ELETTRA_EMAIL=your-actual-email@gmail.com
ELETTRA_PASSWORD=your-actual-password
HEADLESS=false
```

**Important:**
- Use the EXACT URL of your Elettra instance
- Use the Google account email/password that has access to Elettra
- Keep `HEADLESS=false` so you can watch the automation

### Step 2: Run the Test

```bash
npm run test:login
```

This will:
1. Open a Chrome browser window (you'll see it!)
2. Navigate to Elettra
3. Click the Google login button
4. Handle the popup window
5. Enter your email & password
6. Complete the OAuth flow
7. Verify you're logged in

### Step 3: Check the Results

**Console Output:**
- Watch the terminal for detailed logs of each step
- You'll see ✅ or ❌ indicating success/failure

**Screenshots:**
- Check the `screenshots/` folder for visual debugging
- `01-landing.png` - Initial Elettra page
- `02-login-page.png` - Before clicking Google button
- `03-popup-google.png` - Google OAuth popup
- `04-email-entered.png` - After entering email
- `05-password-entered.png` - After entering password
- `03-logged-in.png` - Final logged-in state

## How It Works

### The Flow

```
1. Navigate to Elettra URL
   ↓
2. Find Google Login Button
   ↓
3. Click Button → Popup Opens
   ↓
4. Detect Popup Window
   ↓
5. Enter Email in Popup
   ↓
6. Click Next
   ↓
7. Enter Password
   ↓
8. Click Sign In
   ↓
9. Wait for Popup to Close
   ↓
10. Verify Login on Main Page
```

### Architecture

```
LoginExecutive (main class)
  ├── execute() - Main entry point
  ├── performLogin() - Finds Google button
  ├── handleGoogleOAuthPopup() - Handles popup window
  ├── handleGoogleAccountSelection() - Multi-account support
  └── verifyLogin() - Confirms successful login
```

## Troubleshooting

### "Could not find Google login button"

**Solution:** The button selectors might not match your Elettra instance.

1. Run the test once to get screenshots
2. Open `screenshots/01-landing.png`
3. Inspect the HTML of the Google button
4. Update selectors in `src/executives/login.executive.ts` line 171

### "Popup timeout"

**Possible causes:**
- Popup blocker is enabled
- Elettra changed their OAuth flow
- Network is slow

**Solution:**
- Check browser popup settings
- Increase timeout in line 254 of login.executive.ts

### "Could not find email input"

**Solution:** Google changed their login page structure.

Check `screenshots/03-popup-google.png` and update selectors at line 275.

### Password Rejected

**Common issues:**
- Wrong password in `.env`
- 2FA is enabled on your Google account
- Account requires additional verification

**For 2FA accounts:**
You'll need to either:
1. Use an app-specific password
2. Disable 2FA temporarily for testing
3. Handle 2FA prompts (advanced - requires SMS/authenticator integration)

## Next Steps

Once login is working, we can build more executives:

- **Search Contacts** - Find contacts in Elettra
- **Add Contact** - Create new contact entries
- **Create Lead** - Add new leads
- **Update Property** - Modify property listings
- **Export Data** - Download reports

## Code Structure

```
src/
├── executives/
│   └── login.executive.ts    ← The login automation
├── services/
│   └── browser-session.service.ts  ← Browser management
├── types/
│   └── executive.ts          ← TypeScript interfaces
└── test-login.ts             ← Test runner
```

## Tips for Development

1. **Keep HEADLESS=false** while developing - you need to see what's happening
2. **Check screenshots** after each run - they're your debugging eyes
3. **Watch console logs** - they show exactly what step is executing
4. **Test incrementally** - if something breaks, screenshots + logs will tell you where

## Security Notes

⚠️ **Never commit `.env` to git** - it contains your password!

The `.gitignore` already excludes it, but double-check:
```bash
git status
# .env should NOT appear in the list
```

## Need Help?

If the test fails:
1. Check the console output
2. Look at the screenshots
3. Share the error message and I can help debug

Ready to test? Run:
```bash
npm run test:login
```

Good luck! 🚀
