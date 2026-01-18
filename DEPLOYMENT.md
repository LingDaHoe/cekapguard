# Deployment Guide - Pushing to GitHub

## Step-by-Step Instructions

### Step 1: Initialize Git Repository
```bash
cd /Users/xinmac/Downloads/insureflow-pro
git init
```

### Step 2: Add All Files
```bash
git add .
```

### Step 3: Make Your First Commit
```bash
git commit -m "Initial commit: Setup for GitHub Pages deployment"
```

### Step 4: Create a Repository on GitHub
1. Go to https://github.com/new
2. Choose a repository name (e.g., `insureflow-pro`)
3. **Do NOT** initialize with README, .gitignore, or license (since we already have files)
4. Click **"Create repository"**

### Step 5: Add Remote and Push
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 6: Enable GitHub Pages
1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Source**, select **"GitHub Actions"** (NOT "Deploy from a branch")
5. Your site will automatically deploy when the workflow runs!

## What Happens Next?

- The GitHub Actions workflow will automatically build and deploy your site
- You can check the deployment status in the **Actions** tab
- Once deployed, your site will be available at:
  - `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME` (default)
  - Your custom domain (after DNS configuration)

## Important: Update CNAME File

Before pushing, make sure to edit the `CNAME` file and replace `example.com` with your actual custom domain!

## Troubleshooting

If you get authentication errors when pushing:
- Use GitHub CLI: `gh auth login` and then push
- Or use a Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
