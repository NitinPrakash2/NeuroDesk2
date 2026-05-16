# Gmail Setup for NeuroDesk Support Form

## Steps to Enable Email Sending:

### 1. Enable 2-Factor Authentication on Your Gmail Account
- Go to https://myaccount.google.com/security
- Enable 2-Step Verification if not already enabled

### 2. Generate App Password
- Go to https://myaccount.google.com/apppasswords
- Select "Mail" as the app
- Select "Other" as the device and name it "NeuroDesk"
- Click "Generate"
- Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### 3. Update .env File
Open `server/.env` and replace:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

With your actual Gmail and the app password (remove spaces):
```
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxxxxxxxxxxxxxx
```

### 4. Restart Server
```bash
cd server
npm start
```

## How It Works:
- When users submit the support form, an email is sent to your Gmail
- The email includes:
  - User's name and email
  - Subject line
  - Message content
- You can reply directly to the user's email using the "Reply" button

## Testing:
1. Go to Account page → Support tab
2. Fill in subject and message
3. Click "Send Message"
4. Check your Gmail inbox for the support message
