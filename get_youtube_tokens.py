"""
YouTube OAuth2 Refresh Token Helper Script

Run this script locally on your computer to generate your YouTube REFRESH_TOKEN
for GitHub Actions secrets.

Prerequisites:
1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a project and enable "YouTube Data API v3"
3. Configure OAuth Consent Screen (User Type: External, Add your email under Test Users)
4. Go to Credentials -> Create Credentials -> OAuth Client ID -> Web Application or Desktop App
5. Download client_secret.json and save it in this directory.
6. Run: python get_youtube_tokens.py
"""

import os
import sys

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    print("Error: Required packages missing. Run: pip install google-auth-oauthlib google-api-python-client")
    sys.exit(1)

SCOPES = ['https://www.googleapis.com/auth/youtube']


def main():
    print("=======================================================")
    print("  YouTube OAuth2 Token Generator")
    print("=======================================================")

    client_secret_file = 'client_secret.json'
    if not os.path.exists(client_secret_file):
        print(f"\n[ERROR] '{client_secret_file}' not found in current directory!")
        print("Please download your OAuth 2.0 Credentials JSON from Google Cloud Console,")
        print(f"rename it to '{client_secret_file}' and place it in this folder.\n")
        return

    flow = InstalledAppFlow.from_client_secrets_file(client_secret_file, SCOPES)
    credentials = flow.run_local_server(port=8080)

    print("\n=======================================================")
    print("  SUCCESS! Here are your credentials for GitHub Secrets:")
    print("=======================================================\n")
    print(f"YOUTUBE_CLIENT_ID     : {credentials.client_id}")
    print(f"YOUTUBE_CLIENT_SECRET : {credentials.client_secret}")
    print(f"YOUTUBE_REFRESH_TOKEN : {credentials.refresh_token}")
    print("\nCopy these values and add them into your GitHub Repository Secrets!")
    print("=======================================================\n")


if __name__ == '__main__':
    main()
