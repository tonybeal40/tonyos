# TonyOS Security Checklist

## Before You Share or Download

### 1. Protect Your API Keys
- [ ] **Create your own .env file** - Copy `.env.example` to `.env` and add YOUR OWN keys
- [ ] **Never share your .env file** - It contains your private API keys
- [ ] **If keys were exposed, rotate them** - Get new keys from OpenAI/other providers

### 2. Protect Your Google Sheets Connection
- [ ] **Keep your Apps Script URL private** - Anyone with this URL could add data to your sheet
- [ ] **Don't share the URL publicly** - Treat it like a password
- [ ] **Your Google Sheet should be private** - Only you should have access

### 3. Protect Your Local Files
- [ ] **Keep TonyOS folder private** - Don't put it in shared folders (Dropbox, Google Drive, etc.)
- [ ] **Use a password on your computer** - Prevents others from accessing your data
- [ ] **Consider disk encryption** - Windows BitLocker or Mac FileVault protects if laptop is stolen

### 4. When Downloading the Zip
- [ ] **Delete any existing .env file** in the downloaded folder
- [ ] **Create a fresh .env** with your own keys
- [ ] **Store in a private folder** on your computer

---

## What Data is Stored Where

| Data | Location | Protection |
|------|----------|------------|
| Journal entries | Local database + Google Sheets | Keep folder private |
| CRM contacts | Local database + Google Sheets | Keep folder private |
| Budget data | Local database + Google Sheets | Keep folder private |
| API keys | .env file | Never share this file |
| Chat history | Local JSON files | Keep folder private |

---

## Quick Security Tips

1. **Your API keys = Your money** - OpenAI charges per use, so protect your keys
2. **Your Apps Script URL = Access to your data** - Keep it secret
3. **Local folder = All your personal data** - Keep it in a private location
4. **Regular backups** - Your Google Sheet serves as a backup of your data

---

## If Something Goes Wrong

### API Key Exposed
1. Go to https://platform.openai.com
2. Delete the old key
3. Create a new key
4. Update your .env file

### Apps Script URL Leaked
1. Go to your Apps Script project
2. Click Deploy > Manage deployments
3. Archive the old deployment
4. Create a new deployment
5. Update the URL in TonyOS (click the Live indicator)

---

## Summary

Keep these things private:
- Your `.env` file (API keys)
- Your Apps Script Web App URL
- Your TonyOS folder location

That's it! Following these simple steps keeps your data safe.
