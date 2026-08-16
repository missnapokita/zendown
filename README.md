# Zenhub – GitHub Pages app store

Zenhub is a Play Store-inspired Android app catalog with a fixed dark theme and MasterKit-yellow accents.

## Included

- Home page showing every app
- Search and separate app details pages
- Direct APK download links
- Swipeable screenshot gallery with enlarged preview
- Version, size, Android requirement, package name, description, and changelog
- Responsive phone/desktop layout
- `admin.html` content manager
- GitHub-backed publishing for store data
- JSON import/export backups

## Publish the website

1. Extract the ZIP.
2. Upload every file inside the `zen-app-store` folder to the root of one GitHub repository.
3. Open **Repository Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)`, then save.

The store uses hash URLs such as `#/app/bisaya-toolkit`, so shared app links work on GitHub Pages without route rewrites.

## Open Zenhub Admin

For a Tagalog walkthrough, see `ADMIN_SETUP_TAGALOG.md`.

After publishing, open:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/admin.html
```

The admin can:

- Add, edit, remove, search, and reorder apps
- Choose the featured app
- Change the Zenhub name, logo, developer, and color
- Edit app icons, descriptions, version, file size, package name, and APK link
- Add and arrange screenshot information
- Import and export JSON backups
- Publish edits directly to `apps.json`

## Connect the admin safely

Zenhub is hosted on static GitHub Pages, so the admin uses GitHub's repository API to update `apps.json`.

Create a **fine-grained personal access token** with these restrictions:

1. Select only the Zenhub website repository.
2. Set **Repository permissions → Contents → Read and write**.
3. Add an expiration date.
4. Do not grant unrelated permissions.

In `admin.html`, enter:

- Owner: your GitHub username (default: `missnapokita`)
- Repository: the repository containing Zenhub
- Branch: normally `main`
- Data file: `apps.json`
- Fine-grained token: the restricted token you created

The token is kept only in the current browser tab through `sessionStorage`. It is never written to `apps.json`, downloaded backups, or the website source.

## APKs, icons, and screenshots

The admin accepts direct links. Recommended locations:

- APK: GitHub Release asset URL
- Icon/screenshot: raw public image URL or another stable image host

Example APK URL:

```text
https://github.com/USERNAME/APP-REPOSITORY/releases/download/v1.0.0/app-release.apk
```

`apps.json` is the live public data source. `apps.js` remains as an offline/local fallback when the site is opened without a web server.

## Important security note

A normal password embedded inside a static GitHub Pages site would be visible in its source and would not be secure. Zenhub therefore uses a restricted GitHub token as the real publishing authorization. Anyone may open `admin.html`, but only someone with repository write access can publish changes.
