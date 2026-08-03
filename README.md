# 📺 Taarak Mehta Ka Ooltah Chashmah (TMKOC) Automated YouTube Playlist Bot

An automated GitHub Actions workflow and Python bot that tracks all episodes of **Taarak Mehta Ka Ooltah Chashmah** on YouTube, maintains a master CSV dataset of 4,500+ episodes, and **automatically searches & adds newly released daily episodes into your personal YouTube Playlist** every single night.

---

## 🌟 Features

- **Full Master Dataset**: Contains all 4,500 existing episodes (`episodes.csv`).
- **Daily Automated Search**: Runs automatically via GitHub Actions every day at 11:30 PM IST (after new episodes are uploaded on YouTube).
- **Auto YouTube Playlist Sync**: Uses **YouTube Data API v3** to insert newly detected episodes directly into your live YouTube playlist.
- **Smart Filtering**: Ignores compilations (e.g. "Episode 1 to 100") and identifies official single episode uploads.
- **100% Free**: Uses YouTube Data API v3 free daily quota (~150 units used out of 10,000 free daily units).

---

## 📁 Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── daily_sync.yml        # GitHub Actions workflow (runs daily at 11:30 PM IST)
├── auto_update_playlist.py       # Main Python sync script
├── get_youtube_tokens.py         # Helper script to generate YouTube OAuth2 Refresh Token
├── episodes.csv                  # Complete database of 4,500 TMKOC episodes & URLs
├── state.json                    # Tracks latest episode number (e.g. 4500)
├── requirements.txt              # Python dependencies
└── README.md                     # Setup instructions
```

---

## 🚀 Quick Setup Instructions

### Step 1: Push This Code to Your GitHub Repository

1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g., `tmkoc-youtube-playlist-bot`).
2. Open your terminal in this folder and run:

```bash
git init
git add .
git commit -m "Initial commit: TMKOC automated playlist bot"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/tmkoc-youtube-playlist-bot.git
git push -u origin main
```

---

### Step 2: Get Free YouTube API Credentials (5 Minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Create Project** (e.g., name it `TMKOC-Bot`).
3. In the left menu, go to **APIs & Services -> Library**. Search for **YouTube Data API v3** and click **Enable**.
4. Go to **APIs & Services -> OAuth Consent Screen**:
   - Choose **External**, fill in App Name & Email, and click **Save**.
   - Under **Test Users**, click **Add Users** and enter your Google Email address.
5. Go to **APIs & Services -> Credentials**:
   - Click **Create Credentials -> OAuth Client ID**.
   - Application Type: Select **Desktop App** (or Web Application).
   - Click **Create** and click **Download JSON**.
   - Save the downloaded file into this project folder as `client_secret.json`.

---

### Step 3: Generate Your Refresh Token

Run the included helper script locally on your computer:

```bash
pip install -r requirements.txt
python get_youtube_tokens.py
```

A browser window will open asking you to sign into your Google Account and grant access. After authorizing, the terminal will output:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

---

### Step 4: Add Secrets to Your GitHub Repository

1. Open your GitHub Repository in your browser.
2. Go to **Settings -> Secrets and variables -> Actions -> New repository secret**.
3. Add the following **4 Secrets**:

| Secret Name | Value |
| :--- | :--- |
| `YOUTUBE_CLIENT_ID` | Client ID from Step 3 |
| `YOUTUBE_CLIENT_SECRET` | Client Secret from Step 3 |
| `YOUTUBE_REFRESH_TOKEN` | Refresh Token from Step 3 |
| `YOUTUBE_PLAYLIST_ID` | Your YouTube Playlist ID (from your playlist URL `list=PLxxxx...`) |

---

### Step 5: You're All Set! 🎉

- Every night at **11:30 PM IST**, GitHub Actions will automatically wake up, search for the next episode (e.g. `Ep 4501`), add it to your YouTube Playlist, and commit the updated `episodes.csv` back to your repo.
- You can also manually trigger a sync anytime by going to **Actions -> Daily TMKOC Playlist Auto-Sync -> Run workflow**.

---

## 📄 License
MIT License. Free for personal use.
