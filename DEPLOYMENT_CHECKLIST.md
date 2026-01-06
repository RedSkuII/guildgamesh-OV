# Deployment Checklist: Test → Live

## 📋 Pre-Deployment Testing (Test Environment)

### Web App Testing
- [ ] Local development server runs without errors (`npm run dev`)
- [ ] Database migrations applied successfully (`npm run db:push`)
- [ ] Discord OAuth login works
- [ ] All resource CRUD operations work (Add, Edit, Delete)
- [ ] Leaderboard displays correctly with proper point calculations
- [ ] Role-based permissions work as expected
- [ ] Dark/Light theme toggle works
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] API endpoints return correct no-cache headers
- [ ] Resource history tracking creates entries correctly
- [ ] No console errors in browser developer tools
- [ ] All TypeScript compilation passes (`npm run build`)

### Bot Testing  
- [ ] Bot starts without errors
- [ ] Commands register successfully in test guild
- [ ] Resource tracking commands work (`/stock`, `/add`, `/remove`, etc.)
- [ ] Discord role permissions work correctly
- [ ] Database operations complete successfully
- [ ] Embeds render correctly
- [ ] Error handling displays user-friendly messages
- [ ] Audit logs are created for all operations

## 🔄 Sync Process

### Web App Sync
1. [ ] Review all changes made in test environment
2. [ ] Ensure `.env.local` and `.env.production` are NOT synced
3. [ ] Run sync script: `.\sync-to-live.ps1` (from test directory)
4. [ ] Confirm backup creation
5. [ ] Verify files copied correctly to live directory

### Bot Sync
1. [ ] Review all changes made in test bot
2. [ ] Ensure `.env` file is NOT synced
3. [ ] Ensure guild-specific JSON files are NOT synced
4. [ ] Run sync script: `.\sync-to-live.ps1` (from test directory)
5. [ ] Confirm backup creation
6. [ ] Verify files copied correctly to live directory

## 🧪 Post-Sync Testing (Live Environment - Local)

### Web App
- [ ] Navigate to live directory: `cd c:\Users\colbi\OneDrive\Desktop\ResourceTracker-main`
- [ ] Install dependencies if needed: `npm install`
- [ ] Run development server: `npm run dev`
- [ ] Test critical user flows:
  - [ ] Login/Logout
  - [ ] Add resource
  - [ ] Edit resource
  - [ ] Delete resource
  - [ ] View leaderboard
- [ ] Check for console errors
- [ ] Verify database operations work

### Bot
- [ ] Navigate to live directory: `cd c:\Users\colbi\OneDrive\Desktop\TRZBot`
- [ ] Install dependencies if needed: `pip install -r requirements.txt`
- [ ] Start bot: `python bot.py`
- [ ] Test critical commands in Discord:
  - [ ] `/stock` - View resources
  - [ ] `/add` - Add resources
  - [ ] `/remove` - Remove resources
  - [ ] Permission-restricted commands
- [ ] Monitor console for errors

## 🚀 Production Deployment

### Web App (Vercel)
- [ ] Navigate to live directory
- [ ] Commit changes to git:
  ```bash
  git add .
  git commit -m "Deploy: [Brief description of changes]"
  git push
  ```
- [ ] Verify Vercel auto-deployment starts
- [ ] Monitor deployment logs in Vercel dashboard
- [ ] Check deployment URL after completion
- [ ] Test production site:
  - [ ] Login functionality
  - [ ] Resource operations
  - [ ] Leaderboard
  - [ ] API responses
- [ ] Monitor Vercel logs for errors

### Bot (Production Server)
- [ ] Stop live bot on production server
- [ ] Upload synced files to production server
- [ ] Verify `.env` file has correct production credentials
- [ ] Restart bot on production server
- [ ] Monitor bot logs for successful startup
- [ ] Test commands in production Discord server
- [ ] Verify database operations work
- [ ] Monitor for any errors in first 30 minutes

## 🔙 Rollback Plan

### If Issues Occur in Web App:
1. [ ] Navigate to backup directory (shown in sync script output)
2. [ ] Copy backup files back to live directory:
   ```powershell
   Copy-Item -Path "c:\Users\colbi\OneDrive\Desktop\ResourceTracker-main-backup-YYYYMMDD-HHMMSS\*" -Destination "c:\Users\colbi\OneDrive\Desktop\ResourceTracker-main" -Recurse -Force
   ```
3. [ ] Re-deploy previous version on Vercel (or rollback in dashboard)
4. [ ] Investigate issues in test environment

### If Issues Occur in Bot:
1. [ ] Navigate to backup directory (shown in sync script output)
2. [ ] Copy backup files back to live directory:
   ```powershell
   Copy-Item -Path "c:\Users\colbi\OneDrive\Desktop\TRZBot-backup-YYYYMMDD-HHMMSS\*" -Destination "c:\Users\colbi\OneDrive\Desktop\TRZBot" -Recurse -Force
   ```
3. [ ] Restart bot with previous version
4. [ ] Investigate issues in test environment

## 📝 Post-Deployment

- [ ] Monitor application logs for 24 hours
- [ ] Check user reports for any issues
- [ ] Verify metrics (users, resource updates, points) are tracking correctly
- [ ] Document any issues encountered for future reference
- [ ] Archive backup if everything stable after 7 days

## ⚠️ Files That Should NEVER Be Synced

### Web App:
- `.env`, `.env.local`, `.env.production` (contain secrets)
- `node_modules/` (auto-generated)
- `.next/` (build artifacts)
- `local.db`, `*.db-shm`, `*.db-wal` (local database)
- `.git/` (version control)
- `*.log` (logs)

### Bot:
- `.env` (contains bot token and secrets)
- `__pycache__/` (Python cache)
- `*.pyc` (compiled Python)
- `embeds_*.json`, `guilds_*.json`, etc. (guild-specific data)
- `audit_logs/` (production logs)
- `*.log` (logs)

---

**Remember:** Always test in TEST environment first, then sync to LIVE, then deploy to production!
