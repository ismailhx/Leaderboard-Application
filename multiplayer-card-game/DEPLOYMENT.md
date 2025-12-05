# Deploying PopularPoser to Render

## Quick Deployment Steps

### Option 1: Deploy via Render Dashboard (Easiest)

1. **Push your code to GitHub:**
   ```bash
   cd /Users/ismailhendryx/data-engineer-championship/multiplayer-card-game
   git init
   git add .
   git commit -m "Initial commit - PopularPoser game"
   
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/popularposer.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to https://render.com and sign in (or create free account)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` config
   - Click "Apply" to deploy!

3. **Your game will be live at:** `https://popularposer.onrender.com`

### Option 2: Deploy via Render Blueprint

1. Push code to GitHub (see step 1 above)
2. Go to https://render.com/deploy
3. Connect your repository
4. The `render.yaml` file will automatically configure everything
5. Click "Apply"

## Alternative: Deploy to Railway (Also Free)

1. **Push code to GitHub** (same as above)

2. **Deploy on Railway:**
   - Go to https://railway.app
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js and deploy

3. **Your game will be live at:** `https://YOUR_APP.up.railway.app`

## Alternative: Deploy to Fly.io

1. **Install Fly CLI:**
   ```bash
   brew install flyctl
   fly auth signup  # or fly auth login
   ```

2. **Deploy:**
   ```bash
   cd /Users/ismailhendryx/data-engineer-championship/multiplayer-card-game
   fly launch  # Follow prompts, select free tier
   fly deploy
   ```

## Important Notes

- **Free Tier Limitations:** 
  - Render free apps spin down after 15 mins of inactivity (first request takes ~30s to wake)
  - Consider upgrading for 24/7 availability
  
- **Environment Variables:** None needed for basic deployment

- **Port Configuration:** The app uses `process.env.PORT || 3000` which works on all platforms

## Testing Locally Before Deploy

```bash
npm install
npm start
# Open http://localhost:3000
```
