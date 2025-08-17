# ✨ Welcome to Your Spark Template!

You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?


🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:


## Deployment

This repository includes a GitHub Actions workflow that builds the project and deploys the `dist/` folder to GitHub Pages on pushes to `main` or via manual dispatch.

How to use:

- Ensure the repository is hosted on GitHub and the default branch is `main`.
- Push your changes to `main`.
- The workflow `.github/workflows/deploy-pages.yml` will run automatically and publish the site to GitHub Pages.

Manual trigger:

- Go to the repository Actions tab → Build and Deploy to GitHub Pages → Run workflow.

Notes:

- The workflow uses the official `actions/deploy-pages` action and `upload-pages-artifact` to publish the `dist/` directory.
- If you prefer Netlify/Vercel or another host, create a separate deployment pipeline or provide the host credentials.

📄 License For Spark Template Resources

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
