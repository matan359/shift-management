# מדריך התקנת Git ב-Windows

## דרך 1: הורדה והתקנה ידנית (מומלץ)

1. **הורד Git:**
   - לך ל: https://git-scm.com/download/win
   - הורד את הגרסה האחרונה (Git for Windows)

2. **הרץ את הקובץ שהורדת** (Git-x.x.x-64-bit.exe)

3. **במהלך ההתקנה:**
   - לחץ "Next" על כל המסכים
   - השאר את ברירות המחדל (מומלץ)
   - בחר "Git from the command line and also from 3rd-party software"
   - לחץ "Install"

4. **סיים את ההתקנה**

5. **בדוק שההתקנה הצליחה:**
   - פתח PowerShell או Command Prompt חדש
   - הרץ: `git --version`
   - אמור להציג משהו כמו: `git version 2.x.x`

## דרך 2: דרך Chocolatey (אם מותקן)

```bash
choco install git
```

## דרך 3: דרך winget (Windows Package Manager)

```bash
winget install --id Git.Git -e --source winget
```

## הגדרה ראשונית

לאחר ההתקנה, הגדר את Git:

```bash
git config --global user.name "השם שלך"
git config --global user.email "your-email@example.com"
```

## בדיקה

```bash
git --version
```

אמור להציג את גרסת Git.

## שימוש ראשוני

```bash
# אתחל repository
git init

# הוסף קבצים
git add .

# צור commit
git commit -m "Initial commit"

# חבר ל-GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# דחוף ל-GitHub
git push -u origin main
```

