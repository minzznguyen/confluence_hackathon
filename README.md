## Heatmap for Confluence – Forge App

This repository contains a Forge app that renders an inline–comment heatmap for Confluence pages.

For background on Forge, see the [Forge documentation](https://developer.atlassian.com/platform/forge/).

## Prerequisites

- A Confluence Cloud site where you can install Forge apps
- Node.js and npm (matching the versions recommended in [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/))
- Forge CLI installed and logged in:

```bash
forge --version
forge login
```

> The commands below assume you are running them from the root of this repository.

## One‑time setup

1. **Install root dependencies**

```bash
npm install
```

2. **Install frontend dependencies**

```bash
cd static/heatmap
npm install
cd ../..
```

3. **Build the static frontend**

```bash
cd static/heatmap
npm run build
cd ../..
```

This produces a production build under `static/heatmap/build`, which Forge serves via the `manifest.yml` resource configuration.

## Deploying the app

Deploy to your Forge development environment:

```bash
forge deploy --non-interactive --environment development
```

> Use `development` unless you explicitly want to ship to `staging` or `production`.

## Installing the app on your Confluence site

Run the install command, replacing the placeholders with your details:

```bash
forge install --non-interactive \
  --site https://your-site.atlassian.net \
  --product confluence \
  --environment development
```

- **`--site`**: your Confluence Cloud base URL  
- **`--product`**: always `confluence` for this app  
- **`--environment`**: must match the environment you deployed to

After installation, future `forge deploy --non-interactive --environment development` commands will update the app on that site without needing to reinstall.

## Local development workflow

For iterative development with hot‑reload:

```bash
cd static/heatmap
npm run build
cd ../..
forge tunnel
```

Then open a Confluence page where the app is installed and interact with the module. Code changes will be reflected via the tunnel without redeploying.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
