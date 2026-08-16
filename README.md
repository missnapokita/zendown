# Zen Apps – GitHub Pages mini app store

This is a mobile-first, Play Store-inspired static website. It includes:

- Home page showing all three apps
- Search
- Separate app details/download view
- Horizontal screenshot gallery with enlarged preview
- Version, size, Android requirement, package name, description, and changelog
- Direct APK download buttons
- Share button
- Responsive mobile/desktop layout and dark mode

## 1. Add your real app details

Open `apps.js`. Each app is one object inside `STORE_CONFIG.apps`.

Update these fields:

- `name`
- `developer`
- `category`
- `version`
- `size`
- `android`
- `updated`
- `packageName`
- `description`
- `whatsNew`

## 2. Add icons and screenshots

Create folders such as:

```text
assets/
  bisaya-toolkit/
    icon.png
    screen-1.jpg
    screen-2.jpg
```

Then update `apps.js`:

```js
iconImage: "assets/bisaya-toolkit/icon.png"
```

For screenshots, add an `image` property:

```js
{
  title: "Home",
  caption: "Main app home screen.",
  image: "assets/bisaya-toolkit/screen-1.jpg",
  theme: "green",
  layout: "feed"
}
```

The built-in visual placeholders remain visible only when no image is supplied or an image cannot load.

## 3. Add APK download links

The recommended setup is to upload each APK to that app's GitHub Release and copy the release asset URL into `apkUrl`:

```js
apkUrl: "https://github.com/USERNAME/REPOSITORY/releases/download/v1.0.0/app-release.apk"
```

Until this field is set, the download button shows a clear setup message instead of opening a broken link.

## 4. Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload every file and folder from this project to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.

The website uses hash routes such as `#/app/bisaya-toolkit`, so app links work on GitHub Pages without a custom `404.html`.

## Notes

- Keep `index.html`, `styles.css`, `apps.js`, and `script.js` together.
- `.nojekyll` tells GitHub Pages to serve the files as-is.
- The design is inspired by modern app stores but uses original branding and layout.
