# TonyOS Google Sheets Sync Guide

## Overview

TonyOS can sync your data to ONE master Google Sheet with separate tabs for each app:

| Tab Name | Data Source | What's Synced |
|----------|-------------|---------------|
| Journal | /journal | Daily entries, mood, gratitude, focus, reflections |
| CRM_Contacts | /crm | Contact database with name, company, email, etc. |
| CRM_Activity | /crm | Outreach activity log with outcomes |
| Budget | /memory | Income and expenses |
| Daily | /daily | Daily command center entries |
| Jobs | /jobs | Job applications and status |

## Quick Setup (5 minutes)

### Step 1: Create Your Master Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "TonyOS Master Data" (or anything you like)

### Step 2: Add the Apps Script
1. In your sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Copy the entire contents of `apps-script-endpoint.js` and paste it
4. **IMPORTANT**: Change the API_KEY on line 32 to your own random string (20+ characters)
   - Example: `const API_KEY = "mySecureKey2024TonyOSSync!@#"`
5. Save the project (name it "TonyOS Sync")

### Step 3: Deploy as Web App
1. Click **Deploy > New deployment**
2. Click the gear icon and select **Web app**
3. Set "Execute as" to **Me**
4. Set "Who has access" to **Anyone**
5. Click **Deploy**
6. Copy the Web App URL

### Step 4: Connect TonyOS
1. In any TonyOS page, look for the **Sync Settings** icon (usually in the header)
2. Click it to open the settings modal
3. Paste your Web App URL
4. Enter the same API Key you used in the script
5. Enable sync and click Save

## Data Schema

### Journal Tab
| Column | Description |
|--------|-------------|
| date | Entry date (YYYY-MM-DD) |
| mood | Mood selection (great/good/okay/low/tough) |
| stress | Stress level if tracked |
| category | Entry category |
| content | Main journal text |
| gratitude | 3 things grateful for (pipe-separated) |
| focus | Today's focus |
| reflection | Evening reflection |
| tags | Tags (comma-separated) |
| links | Related links (pipe-separated) |
| wordCount | Word count of content |
| updatedAt | Last update timestamp |

### CRM_Contacts Tab
| Column | Description |
|--------|-------------|
| id | Unique contact ID |
| name | Full name |
| company | Company name |
| title | Job title |
| email | Email address |
| phone | Phone number |
| linkedin | LinkedIn URL |
| website | Website URL |
| notes | Notes about contact |
| stage | Pipeline stage |
| source | Where you found them |
| createdAt | When created |
| updatedAt | Last update |

### CRM_Activity Tab
| Column | Description |
|--------|-------------|
| id | Unique activity ID |
| contactId | Related contact ID |
| contactName | Contact name for reference |
| channel | Channel used (LinkedIn, Email, Phone) |
| type | Activity type (connection, message, call) |
| outcome | Result (sent, replied, meeting, no response) |
| notes | Activity notes |
| date | Activity date |

### Budget Tab
| Column | Description |
|--------|-------------|
| id | Unique ID |
| type | income or expense |
| category | Category (salary, rent, etc.) |
| description | Description |
| amount | Dollar amount |
| date | Transaction date |
| recurring | Is this recurring? (true/false) |

### Daily Tab
| Column | Description |
|--------|-------------|
| date | Entry date |
| oneWin | Today's one win |
| pressure | Top pressure point |
| nextStep | Next action |
| result | AI-generated result |
| timestamp | When submitted |

### Jobs Tab
| Column | Description |
|--------|-------------|
| id | Unique ID |
| company | Company name |
| title | Job title |
| status | Application status |
| applied | Applied date |
| notes | Notes |
| url | Job posting URL |
| updatedAt | Last update |

## Security Notes

1. **API Key**: Use a strong, unique API key (20+ characters)
2. **Data Privacy**: Your data goes directly to your Google account
3. **No Server Storage**: TonyOS does not store your Google credentials
4. **Local Config**: Your settings are stored in your browser only

## Troubleshooting

### Sync not working?
1. Check that the Web App URL starts with `https://script.google.com/`
2. Verify the API key matches exactly in both places
3. Make sure sync is enabled in settings
4. Check browser console for errors

### Missing columns?
The Apps Script auto-creates tabs and headers on first sync. If headers are missing, delete the tab and sync again.

### Data not appearing?
Check that:
- The sheet is not full (Google Sheets has a 10 million cell limit)
- You have edit access to the sheet
- The Apps Script deployment is still active

## Updating the Script

If you need to update the script:
1. Go to Apps Script
2. Make your changes
3. Click **Deploy > Manage deployments**
4. Click the pencil icon on your deployment
5. Change version to **New version**
6. Click Deploy

The URL stays the same so you don't need to update TonyOS.
