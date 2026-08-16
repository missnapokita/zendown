(function () {
  "use strict";

  var API_VERSION = "2026-03-10";
  var fallbackConfig = clone(window.STORE_CONFIG || {
    name: "Zenhub",
    developer: "Zen Corpuz",
    tagline: "All your apps. One trusted hub.",
    logo: "https://raw.githubusercontent.com/missnapokita/masterkiter/refs/heads/main/jajajs.png",
    accent: "#f5c518",
    apps: []
  });
  var config = fallbackConfig;
  var fileSha = null;
  var connected = false;
  var editingIndex = -1;
  var deleteIndex = -1;
  var editorScreenshots = [];
  var toastTimer = null;
  var isDirty = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }

  function cleanLines(value) {
    return String(value || "").split(/\r?\n/).map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  function cleanParagraphs(value) {
    return String(value || "").split(/\n\s*\n/).map(function (paragraph) {
      return paragraph.replace(/\s*\n\s*/g, " ").trim();
    }).filter(Boolean);
  }

  function normalizeConfig(value) {
    var next = value && typeof value === "object" ? clone(value) : clone(fallbackConfig);
    next.name = next.name || "Zenhub";
    next.developer = next.developer || "Zen Corpuz";
    next.tagline = next.tagline || "All your apps. One trusted hub.";
    next.logo = next.logo || fallbackConfig.logo;
    next.accent = validColor(next.accent) ? next.accent : "#f5c518";
    next.apps = Array.isArray(next.apps) ? next.apps.map(normalizeApp) : [];
    return next;
  }

  function normalizeApp(app) {
    var item = app && typeof app === "object" ? clone(app) : {};
    item.id = item.id || slugify(item.name) || "new-app";
    item.name = item.name || "Untitled app";
    item.developer = item.developer || config.developer || "Zen Corpuz";
    item.category = item.category || "Apps";
    item.tagline = item.tagline || "";
    item.shortDescription = item.shortDescription || "";
    item.description = Array.isArray(item.description) ? item.description : cleanParagraphs(item.description);
    item.version = item.version || "1.0.0";
    item.size = item.size || "Add size";
    item.android = item.android || "Android 8.0+";
    item.updated = item.updated || "";
    item.packageName = item.packageName || "";
    item.apkUrl = item.apkUrl || "";
    item.iconImage = item.iconImage || "";
    item.iconText = item.iconText || item.name.slice(0, 2).toUpperCase();
    item.accent = validColor(item.accent) ? item.accent : "#f5c518";
    item.accentDark = validColor(item.accentDark) ? item.accentDark : "#8b6800";
    item.featured = Boolean(item.featured);
    item.whatsNew = Array.isArray(item.whatsNew) ? item.whatsNew : cleanLines(item.whatsNew);
    item.screenshots = Array.isArray(item.screenshots) ? item.screenshots.map(function (shot) {
      return {
        title: shot.title || "Screenshot",
        caption: shot.caption || "",
        image: shot.image || "",
        theme: shot.theme || "gold",
        layout: shot.layout || "feed"
      };
    }) : [];
    return item;
  }

  function validColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || ""));
  }

  function appIcon(app) {
    var image = app.iconImage ? '<img src="' + escapeHtml(app.iconImage) + '" alt="" onerror="this.remove()">' : "";
    return '<span class="app-icon" style="--icon-accent:' + escapeHtml(app.accent) + ';--icon-accent-dark:' + escapeHtml(app.accentDark) + '">' +
      image + '<span>' + escapeHtml(app.iconText || app.name.slice(0, 2)) + "</span></span>";
  }

  function formatApiPath(path) {
    return String(path || "apps.json").split("/").filter(Boolean).map(encodeURIComponent).join("/");
  }

  function connectionValues() {
    return {
      owner: byId("github-owner").value.trim(),
      repo: byId("github-repo").value.trim(),
      branch: byId("github-branch").value.trim() || "main",
      path: byId("github-path").value.trim() || "apps.json",
      token: byId("github-token").value.trim()
    };
  }

  function apiHeaders(token) {
    return {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + token,
      "X-GitHub-Api-Version": API_VERSION
    };
  }

  async function responseError(response, fallback) {
    var message = fallback;
    try {
      var body = await response.json();
      if (body && body.message) message = body.message;
    } catch (error) {}
    return new Error(message + " (HTTP " + response.status + ")");
  }

  function decodeBase64Utf8(value) {
    var binary = atob(String(value || "").replace(/\s/g, ""));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64Utf8(value) {
    var bytes = new TextEncoder().encode(value);
    var binary = "";
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
    }
    return btoa(binary);
  }

  async function loadBundledConfig() {
    try {
      var response = await fetch("apps.json?refresh=" + Date.now(), { cache: "no-store" });
      if (response.ok) config = normalizeConfig(await response.json());
      else config = normalizeConfig(fallbackConfig);
    } catch (error) {
      config = normalizeConfig(fallbackConfig);
    }
    fillStoreSettings();
    renderAll();
  }

  async function connectGithub(event) {
    event.preventDefault();
    var values = connectionValues();
    if (!values.owner || !values.repo || !values.branch || !values.path || !values.token) {
      showToast("Complete every GitHub connection field.", true);
      return;
    }

    setButtonLoading(byId("connect-button"), true, "Connecting…");
    try {
      var repoUrl = "https://api.github.com/repos/" + encodeURIComponent(values.owner) + "/" + encodeURIComponent(values.repo);
      var repoResponse = await fetch(repoUrl, { headers: apiHeaders(values.token) });
      if (!repoResponse.ok) throw await responseError(repoResponse, "Repository connection failed");

      var fileUrl = repoUrl + "/contents/" + formatApiPath(values.path) + "?ref=" + encodeURIComponent(values.branch);
      var fileResponse = await fetch(fileUrl, { headers: apiHeaders(values.token), cache: "no-store" });

      if (fileResponse.ok) {
        var fileData = await fileResponse.json();
        var loaded = JSON.parse(decodeBase64Utf8(fileData.content));
        config = normalizeConfig(loaded);
        fileSha = fileData.sha;
        showToast("Connected. Current Zenhub data loaded.");
      } else if (fileResponse.status === 404) {
        fileSha = null;
        showToast("Connected. apps.json is not present yet; publishing will create it.");
      } else {
        throw await responseError(fileResponse, "Could not load the data file");
      }

      connected = true;
      isDirty = false;
      sessionStorage.setItem("zenhub-admin-token", values.token);
      localStorage.setItem("zenhub-admin-repository", JSON.stringify({
        owner: values.owner,
        repo: values.repo,
        branch: values.branch,
        path: values.path
      }));
      updateConnectionUi();
      fillStoreSettings();
      renderAll();
    } catch (error) {
      connected = false;
      fileSha = null;
      updateConnectionUi();
      showToast(error.message || "Connection failed.", true);
    } finally {
      setButtonLoading(byId("connect-button"), false, "Connect & load data");
    }
  }

  function disconnectGithub() {
    connected = false;
    fileSha = null;
    sessionStorage.removeItem("zenhub-admin-token");
    byId("github-token").value = "";
    updateConnectionUi();
    showToast("GitHub disconnected from this tab.");
  }

  function updateConnectionUi() {
    var badge = byId("connection-badge");
    badge.classList.toggle("is-connected", connected);
    badge.querySelector("span").textContent = connected ? "Repository connected" : "Not connected";
    byId("disconnect-button").hidden = !connected;
    byId("publish-button").disabled = !connected;
  }

  function setButtonLoading(button, loading, label) {
    button.disabled = loading;
    button.textContent = label;
  }

  function syncStoreSettings() {
    config.name = byId("store-name").value.trim() || "Zenhub";
    config.developer = byId("store-developer").value.trim() || "Zen Corpuz";
    config.tagline = byId("store-tagline").value.trim();
    config.logo = byId("store-logo").value.trim();
    config.accent = validColor(byId("store-accent-text").value) ? byId("store-accent-text").value.toLowerCase() : "#f5c518";
  }

  function fillStoreSettings() {
    byId("store-name").value = config.name || "Zenhub";
    byId("store-developer").value = config.developer || "Zen Corpuz";
    byId("store-tagline").value = config.tagline || "";
    byId("store-logo").value = config.logo || "";
    setColorPair("store-accent", "store-accent-text", config.accent || "#f5c518");
    document.documentElement.style.setProperty("--green", config.accent || "#f5c518");
    document.querySelectorAll("[data-admin-logo]").forEach(function (image) {
      if (config.logo) image.src = config.logo;
    });
  }

  function renderStats() {
    var apps = config.apps || [];
    byId("stat-apps").textContent = apps.length;
    byId("stat-featured").textContent = apps.filter(function (app) { return app.featured; }).length;
    byId("stat-links").textContent = apps.filter(function (app) { return Boolean(app.apkUrl); }).length;
    byId("stat-screenshots").textContent = apps.reduce(function (total, app) {
      return total + (Array.isArray(app.screenshots) ? app.screenshots.length : 0);
    }, 0);
  }

  function renderAppList(query) {
    var normalized = String(query || "").trim().toLowerCase();
    var matches = config.apps.map(function (app, index) {
      return { app: app, index: index };
    }).filter(function (entry) {
      var haystack = [entry.app.name, entry.app.category, entry.app.version, entry.app.packageName].join(" ").toLowerCase();
      return !normalized || haystack.indexOf(normalized) !== -1;
    });

    byId("admin-app-list").innerHTML = matches.map(function (entry) {
      var app = entry.app;
      var index = entry.index;
      return '<article class="admin-app-row">' +
        appIcon(app) +
        '<div class="admin-app-copy"><div class="admin-app-title-line"><h3>' + escapeHtml(app.name) + "</h3>" +
          (app.featured ? '<span class="featured-pill">Featured</span>' : "") +
          '<span class="link-pill ' + (app.apkUrl ? "" : "missing") + '">' + (app.apkUrl ? "Download ready" : "No APK link") + "</span>" +
        '</div><p>' + escapeHtml(app.category) + " · Version " + escapeHtml(app.version) + " · " + escapeHtml(app.size) + "</p></div>" +
        '<div class="admin-app-row-actions">' +
          '<button class="app-row-button edit" type="button" data-app-action="edit" data-index="' + index + '">Edit</button>' +
          '<button class="app-row-button" type="button" data-app-action="up" data-index="' + index + '" aria-label="Move ' + escapeHtml(app.name) + ' up" ' + (index === 0 ? "disabled" : "") + '>↑</button>' +
          '<button class="app-row-button" type="button" data-app-action="down" data-index="' + index + '" aria-label="Move ' + escapeHtml(app.name) + ' down" ' + (index === config.apps.length - 1 ? "disabled" : "") + '>↓</button>' +
          '<button class="app-row-button remove" type="button" data-app-action="remove" data-index="' + index + '" aria-label="Remove ' + escapeHtml(app.name) + '">Remove</button>' +
        "</div></article>";
    }).join("");

    byId("admin-empty").hidden = matches.length !== 0;
  }

  function renderAll() {
    renderStats();
    renderAppList(byId("admin-search").value);
  }

  function defaultApp() {
    var monthYear = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date());
    return {
      id: "",
      name: "",
      developer: config.developer || "Zen Corpuz",
      category: "Tools",
      tagline: "",
      shortDescription: "",
      description: [],
      version: "1.0.0",
      size: "",
      android: "Android 8.0+",
      updated: monthYear,
      packageName: "",
      apkUrl: "",
      iconImage: "",
      iconText: "",
      accent: "#f5c518",
      accentDark: "#8b6800",
      featured: config.apps.length === 0,
      whatsNew: [],
      screenshots: []
    };
  }

  function openEditor(index) {
    editingIndex = typeof index === "number" ? index : -1;
    var app = editingIndex >= 0 ? clone(config.apps[editingIndex]) : defaultApp();
    byId("editor-title").textContent = editingIndex >= 0 ? "Edit " + app.name : "Add new app";
    byId("app-name").value = app.name;
    byId("app-id").value = app.id;
    byId("app-id").dataset.manual = editingIndex >= 0 ? "yes" : "";
    byId("app-developer").value = app.developer || config.developer || "";
    byId("app-category").value = app.category || "";
    byId("app-icon-image").value = app.iconImage || "";
    byId("app-icon-text").value = app.iconText || "";
    byId("app-featured").checked = Boolean(app.featured);
    setColorPair("app-accent", "app-accent-text", app.accent || "#f5c518");
    setColorPair("app-accent-dark", "app-accent-dark-text", app.accentDark || "#8b6800");
    byId("app-tagline").value = app.tagline || "";
    byId("app-short-description").value = app.shortDescription || "";
    byId("app-description").value = (app.description || []).join("\n\n");
    byId("app-version").value = app.version || "";
    byId("app-size").value = app.size || "";
    byId("app-android").value = app.android || "";
    byId("app-updated").value = app.updated || "";
    byId("app-package").value = app.packageName || "";
    byId("app-apk-url").value = app.apkUrl || "";
    byId("app-whats-new").value = (app.whatsNew || []).join("\n");
    editorScreenshots = clone(app.screenshots || []);
    renderScreenshotEditor();
    byId("app-editor-dialog").showModal();
    window.setTimeout(function () { byId("app-name").focus(); }, 60);
  }

  function closeEditor() {
    byId("app-editor-dialog").close();
  }

  function screenshotOptions(selected, values) {
    return values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '" ' + (value === selected ? "selected" : "") + ">" + escapeHtml(value.charAt(0).toUpperCase() + value.slice(1)) + "</option>";
    }).join("");
  }

  function renderScreenshotEditor() {
    var themes = ["gold", "amber", "yellow", "bronze", "green", "forest", "mint", "lime", "blue", "navy", "sky", "indigo", "rose", "wine", "coral", "plum"];
    var layouts = ["feed", "hero", "grid", "tools"];
    byId("screenshot-editor-list").innerHTML = editorScreenshots.map(function (shot, index) {
      return '<div class="screenshot-editor-row" data-shot-row="' + index + '">' +
        '<span class="screenshot-index">' + (index + 1) + "</span>" +
        '<label><span>Title</span><input data-shot-field="title" value="' + escapeHtml(shot.title || "") + '"></label>' +
        '<label><span>Caption</span><input data-shot-field="caption" value="' + escapeHtml(shot.caption || "") + '"></label>' +
        '<label class="shot-image-field"><span>Image URL</span><input data-shot-field="image" type="url" value="' + escapeHtml(shot.image || "") + '" placeholder="https://…"></label>' +
        '<label><span>Theme</span><select data-shot-field="theme">' + screenshotOptions(shot.theme || "gold", themes) + "</select></label>" +
        '<label><span>Layout</span><select data-shot-field="layout">' + screenshotOptions(shot.layout || "feed", layouts) + "</select></label>" +
        '<button class="remove-screenshot" type="button" data-remove-shot="' + index + '" aria-label="Remove screenshot">×</button>' +
      "</div>";
    }).join("");

    if (editorScreenshots.length === 0) {
      byId("screenshot-editor-list").innerHTML = '<div class="admin-empty"><span>▣</span><h3>No screenshots</h3><p>Add image URLs or use the built-in visual placeholders.</p></div>';
    }
  }

  function captureScreenshots() {
    var rows = Array.from(document.querySelectorAll("[data-shot-row]"));
    if (!rows.length) return [];
    return rows.map(function (row) {
      var read = function (field) {
        var input = row.querySelector('[data-shot-field="' + field + '"]');
        return input ? input.value.trim() : "";
      };
      return {
        title: read("title") || "Screenshot",
        caption: read("caption"),
        image: read("image"),
        theme: read("theme") || "gold",
        layout: read("layout") || "feed"
      };
    });
  }

  function addScreenshot() {
    editorScreenshots = captureScreenshots();
    editorScreenshots.push({ title: "Screenshot " + (editorScreenshots.length + 1), caption: "", image: "", theme: "gold", layout: "feed" });
    renderScreenshotEditor();
  }

  function removeScreenshot(index) {
    editorScreenshots = captureScreenshots();
    editorScreenshots.splice(index, 1);
    renderScreenshotEditor();
  }

  function collectApp() {
    var name = byId("app-name").value.trim();
    var id = slugify(byId("app-id").value || name);
    return normalizeApp({
      id: id,
      name: name,
      developer: byId("app-developer").value.trim() || config.developer,
      category: byId("app-category").value.trim() || "Apps",
      tagline: byId("app-tagline").value.trim(),
      shortDescription: byId("app-short-description").value.trim(),
      description: cleanParagraphs(byId("app-description").value),
      version: byId("app-version").value.trim() || "1.0.0",
      size: byId("app-size").value.trim() || "Add size",
      android: byId("app-android").value.trim() || "Android 8.0+",
      updated: byId("app-updated").value.trim(),
      packageName: byId("app-package").value.trim(),
      apkUrl: byId("app-apk-url").value.trim(),
      iconImage: byId("app-icon-image").value.trim(),
      iconText: byId("app-icon-text").value.trim() || name.slice(0, 2).toUpperCase(),
      accent: validColor(byId("app-accent-text").value) ? byId("app-accent-text").value.toLowerCase() : "#f5c518",
      accentDark: validColor(byId("app-accent-dark-text").value) ? byId("app-accent-dark-text").value.toLowerCase() : "#8b6800",
      featured: byId("app-featured").checked,
      whatsNew: cleanLines(byId("app-whats-new").value),
      screenshots: captureScreenshots()
    });
  }

  function saveApp(event) {
    event.preventDefault();
    var app = collectApp();
    if (!app.name || !app.id) {
      showToast("App name and App ID are required.", true);
      return;
    }
    var duplicate = config.apps.some(function (item, index) {
      return item.id === app.id && index !== editingIndex;
    });
    if (duplicate) {
      showToast("That App ID is already used. Choose a unique ID.", true);
      return;
    }

    if (app.featured) {
      config.apps.forEach(function (item) { item.featured = false; });
    }

    if (editingIndex >= 0) config.apps[editingIndex] = app;
    else config.apps.push(app);
    markDirty();
    renderAll();
    closeEditor();
    showToast(app.name + " saved. Publish when ready.");
  }

  function moveApp(index, direction) {
    var target = index + direction;
    if (target < 0 || target >= config.apps.length) return;
    var moved = config.apps.splice(index, 1)[0];
    config.apps.splice(target, 0, moved);
    markDirty();
    renderAll();
  }

  function askRemoveApp(index) {
    deleteIndex = index;
    var app = config.apps[index];
    byId("confirm-message").textContent = app.name + " will be removed from the catalog after you publish.";
    byId("confirm-dialog").showModal();
  }

  function confirmRemoveApp() {
    if (deleteIndex < 0 || !config.apps[deleteIndex]) return;
    var removed = config.apps.splice(deleteIndex, 1)[0];
    deleteIndex = -1;
    byId("confirm-dialog").close();
    markDirty();
    renderAll();
    showToast(removed.name + " removed. Publish to update the live store.");
  }

  function markDirty() {
    isDirty = true;
    byId("last-published").textContent = "You have unpublished changes.";
  }

  async function publishConfig() {
    if (!connected) {
      showToast("Connect your GitHub repository first.", true);
      return;
    }

    syncStoreSettings();
    var values = connectionValues();
    var repoUrl = "https://api.github.com/repos/" + encodeURIComponent(values.owner) + "/" + encodeURIComponent(values.repo);
    var fileUrl = repoUrl + "/contents/" + formatApiPath(values.path);
    var json = JSON.stringify(normalizeConfig(config), null, 2) + "\n";
    var body = {
      message: "Update Zenhub app catalog",
      content: encodeBase64Utf8(json),
      branch: values.branch
    };
    if (fileSha) body.sha = fileSha;

    setButtonLoading(byId("publish-button"), true, "Publishing…");
    try {
      var response = await fetch(fileUrl, {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, apiHeaders(values.token)),
        body: JSON.stringify(body)
      });
      if (!response.ok) throw await responseError(response, "Publish failed");
      var result = await response.json();
      if (result.content && result.content.sha) fileSha = result.content.sha;
      isDirty = false;
      var publishedAt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
      byId("last-published").textContent = "Published " + publishedAt + ". GitHub Pages may need a short moment to refresh.";
      showToast("Zenhub changes published successfully.");
    } catch (error) {
      showToast(error.message || "Publish failed. Reload the latest repository data and try again.", true);
    } finally {
      setButtonLoading(byId("publish-button"), false, "Publish to Zenhub");
      byId("publish-button").disabled = !connected;
    }
  }

  function exportConfig() {
    syncStoreSettings();
    var data = JSON.stringify(normalizeConfig(config), null, 2) + "\n";
    var blob = new Blob([data], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "zenhub-apps-backup.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Zenhub backup downloaded.");
  }

  async function importConfig(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      var loaded = JSON.parse(await file.text());
      if (!loaded || !Array.isArray(loaded.apps)) throw new Error("This file does not contain a valid apps list.");
      config = normalizeConfig(loaded);
      fillStoreSettings();
      renderAll();
      markDirty();
      showToast("Backup imported. Review it, then publish.");
    } catch (error) {
      showToast(error.message || "Could not import that JSON file.", true);
    } finally {
      event.target.value = "";
    }
  }

  function setColorPair(colorId, textId, value) {
    var color = validColor(value) ? value.toLowerCase() : "#f5c518";
    byId(colorId).value = color;
    byId(textId).value = color;
  }

  function bindColorPair(colorId, textId, onChange) {
    var colorInput = byId(colorId);
    var textInput = byId(textId);
    colorInput.addEventListener("input", function () {
      textInput.value = colorInput.value.toLowerCase();
      if (onChange) onChange();
    });
    textInput.addEventListener("input", function () {
      if (validColor(textInput.value)) colorInput.value = textInput.value;
      if (onChange) onChange();
    });
  }

  function showToast(message, isError) {
    window.clearTimeout(toastTimer);
    var toast = byId("admin-toast");
    toast.textContent = message;
    toast.classList.toggle("error", Boolean(isError));
    toast.classList.add("show");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 4200);
  }

  function restoreConnectionFields() {
    try {
      var saved = JSON.parse(localStorage.getItem("zenhub-admin-repository") || "{}");
      if (saved.owner) byId("github-owner").value = saved.owner;
      if (saved.repo) byId("github-repo").value = saved.repo;
      if (saved.branch) byId("github-branch").value = saved.branch;
      if (saved.path) byId("github-path").value = saved.path;
    } catch (error) {}
    var sessionToken = sessionStorage.getItem("zenhub-admin-token");
    if (sessionToken) byId("github-token").value = sessionToken;
  }

  document.addEventListener("click", function (event) {
    var addTarget = event.target.closest("#add-app-top, #add-app-button, [data-add-app]");
    var actionTarget = event.target.closest("[data-app-action]");
    var removeShotTarget = event.target.closest("[data-remove-shot]");

    if (addTarget) openEditor();
    if (removeShotTarget) removeScreenshot(Number(removeShotTarget.getAttribute("data-remove-shot")));
    if (actionTarget) {
      var index = Number(actionTarget.getAttribute("data-index"));
      var action = actionTarget.getAttribute("data-app-action");
      if (action === "edit") openEditor(index);
      if (action === "up") moveApp(index, -1);
      if (action === "down") moveApp(index, 1);
      if (action === "remove") askRemoveApp(index);
    }
  });

  byId("github-form").addEventListener("submit", connectGithub);
  byId("disconnect-button").addEventListener("click", disconnectGithub);
  byId("toggle-token").addEventListener("click", function () {
    var token = byId("github-token");
    var revealing = token.type === "password";
    token.type = revealing ? "text" : "password";
    this.textContent = revealing ? "Hide" : "Show";
    this.setAttribute("aria-label", revealing ? "Hide token" : "Show token");
  });
  byId("admin-search").addEventListener("input", function () { renderAppList(this.value); });
  byId("publish-button").addEventListener("click", publishConfig);
  byId("export-button").addEventListener("click", exportConfig);
  byId("import-input").addEventListener("change", importConfig);
  byId("app-editor-form").addEventListener("submit", saveApp);
  byId("editor-close").addEventListener("click", closeEditor);
  byId("editor-cancel").addEventListener("click", closeEditor);
  byId("add-screenshot").addEventListener("click", addScreenshot);
  byId("confirm-cancel").addEventListener("click", function () {
    deleteIndex = -1;
    byId("confirm-dialog").close();
  });
  byId("confirm-delete").addEventListener("click", confirmRemoveApp);
  byId("app-name").addEventListener("input", function () {
    if (editingIndex < 0 && !byId("app-id").dataset.manual) byId("app-id").value = slugify(this.value);
  });
  byId("app-id").addEventListener("input", function () { this.dataset.manual = "yes"; });

  ["store-name", "store-developer", "store-tagline", "store-logo"].forEach(function (id) {
    byId(id).addEventListener("input", function () {
      markDirty();
      if (id === "store-logo") {
        document.querySelectorAll("[data-admin-logo]").forEach(function (image) {
          if (byId("store-logo").value.trim()) image.src = byId("store-logo").value.trim();
        });
      }
    });
  });

  bindColorPair("store-accent", "store-accent-text", function () {
    markDirty();
    var accent = byId("store-accent-text").value;
    if (validColor(accent)) document.documentElement.style.setProperty("--green", accent);
  });
  bindColorPair("app-accent", "app-accent-text");
  bindColorPair("app-accent-dark", "app-accent-dark-text");

  window.addEventListener("beforeunload", function (event) {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  restoreConnectionFields();
  updateConnectionUi();
  loadBundledConfig();
}());
