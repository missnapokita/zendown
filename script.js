(async function () {
  "use strict";

  var fallbackConfig = window.STORE_CONFIG || { name: "Zenhub", developer: "Developer", apps: [] };
  var config = fallbackConfig;

  try {
    var configResponse = await fetch("apps.json?refresh=" + Date.now(), { cache: "no-store" });
    if (configResponse.ok) {
      var remoteConfig = await configResponse.json();
      if (remoteConfig && Array.isArray(remoteConfig.apps)) config = remoteConfig;
    }
  } catch (error) {
    config = fallbackConfig;
  }

  var apps = Array.isArray(config.apps) ? config.apps : [];
  var currentApp = null;
  var toastTimer = null;

  var homePage = document.getElementById("home-page");
  var detailPage = document.getElementById("detail-page");
  var aboutPage = document.getElementById("about-page");
  var appGrid = document.getElementById("app-grid");
  var appCount = document.getElementById("app-count");
  var emptyState = document.getElementById("empty-state");
  var searchInput = document.getElementById("app-search");
  var searchShell = document.getElementById("search-shell");
  var featuredApp = document.getElementById("featured-app");
  var detailContent = document.getElementById("detail-content");
  var detailTitle = document.getElementById("detail-title");
  var mobileBar = document.getElementById("mobile-download-bar");
  var screenshotDialog = document.getElementById("screenshot-dialog");
  var dialogMedia = document.getElementById("dialog-media");
  var dialogCaption = document.getElementById("dialog-caption");
  var toast = document.getElementById("toast");

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function appIcon(app, className) {
    var image = app.iconImage
      ? '<img src="' + escapeHtml(app.iconImage) + '" alt="" onerror="this.remove()">'
      : "";
    return '<span class="app-icon ' + (className || "") + '" style="--icon-accent:' + escapeHtml(app.accent || "#64b553") + ';--icon-accent-dark:' + escapeHtml(app.accentDark || "#2f7f38") + '">' +
      image + '<span>' + escapeHtml(app.iconText || app.name.slice(0, 2)) + "</span></span>";
  }

  function screenshotFrame(shot, app) {
    var image = shot.image
      ? '<img src="' + escapeHtml(shot.image) + '" alt="' + escapeHtml(app.name + " – " + shot.title) + '" onerror="this.remove()">'
      : "";
    var layout = shot.layout || "feed";
    var body = "";

    if (layout === "hero") {
      body = '<div class="mock-banner"></div><div class="mock-pills"><span></span><span></span><span></span></div><div class="mock-list"><span></span><span></span><span></span></div>';
    } else if (layout === "grid") {
      body = '<div class="mock-pills"><span></span><span></span><span></span></div><div class="mock-row"><span></span><span></span><span></span></div><div class="mock-row"><span></span><span></span><span></span></div><div class="mock-row"><span></span><span></span><span></span></div>';
    } else if (layout === "tools") {
      body = '<div class="mock-search"></div><div class="mock-list"><span></span><span></span><span></span><span></span><span></span></div>';
    } else {
      body = '<div class="mock-search"></div><div class="mock-banner"></div><div class="mock-row"><span></span><span></span><span></span></div><div class="mock-list"><span></span><span></span></div>';
    }

    return '<div class="screenshot-frame theme-' + escapeHtml(shot.theme || "green") + '">' +
      '<div class="mock-status"><span>9:41</span><span>● ● ▰</span></div>' +
      '<div class="mock-title">' + escapeHtml(shot.title) + "</div>" + body + image + "</div>";
  }

  function renderFeatured() {
    var app = apps.filter(function (item) { return item.featured; })[0] || apps[0];
    if (!app) {
      featuredApp.hidden = true;
      return;
    }
    featuredApp.style.setProperty("--featured-accent", config.accent || "#f5c518");
    featuredApp.innerHTML =
      '<div class="hero-copy">' +
        '<p class="eyebrow">Featured · ' + escapeHtml(app.name) + "</p>" +
        '<h1>' + escapeHtml(config.tagline || app.tagline || app.name) + "</h1>" +
        '<p>' + escapeHtml(app.shortDescription) + "</p>" +
        '<div class="hero-actions">' +
          '<button class="primary-button" type="button" data-open-app="' + escapeHtml(app.id) + '">View app</button>' +
          '<button class="secondary-button" type="button" data-download-app="' + escapeHtml(app.id) + '">Download APK</button>' +
        "</div>" +
      "</div>" +
      '<div class="hero-visual" aria-hidden="true"><div class="hero-app-orbit">' +
        '<i class="orbit-dot one"></i><i class="orbit-dot two"></i><i class="orbit-dot three"></i>' +
        appIcon(app, "hero-icon") +
      "</div></div>";
  }

  function appCard(app) {
    return '<button class="app-card" type="button" data-open-app="' + escapeHtml(app.id) + '" aria-label="View ' + escapeHtml(app.name) + '">' +
      appIcon(app) +
      '<span class="app-card-content">' +
        '<h2>' + escapeHtml(app.name) + "</h2>" +
        '<p class="app-card-category">' + escapeHtml(app.category) + "</p>" +
        '<p class="app-card-description">' + escapeHtml(app.shortDescription) + "</p>" +
      "</span>" +
      '<span class="app-card-meta"><span>Version ' + escapeHtml(app.version) + '</span><i class="meta-dot"></i><span>' + escapeHtml(app.size) + "</span></span>" +
    "</button>";
  }

  function renderApps(query) {
    var normalized = String(query || "").trim().toLowerCase();
    var filtered = apps.filter(function (app) {
      var haystack = [app.name, app.category, app.shortDescription, app.developer].join(" ").toLowerCase();
      return !normalized || haystack.indexOf(normalized) !== -1;
    });

    appGrid.innerHTML = filtered.map(appCard).join("");
    appCount.textContent = filtered.length + (filtered.length === 1 ? " app" : " apps");
    emptyState.hidden = filtered.length !== 0;
  }

  function detailStats(app) {
    var stats = [
      { value: app.version, label: "Version" },
      { value: app.size, label: "Download size" },
      { value: app.android, label: "Requires" },
      { value: "APK", label: "File type" }
    ];
    return '<div class="detail-stats">' + stats.map(function (stat) {
      return '<div class="detail-stat"><strong>' + escapeHtml(stat.value) + '</strong><span>' + escapeHtml(stat.label) + "</span></div>";
    }).join("") + "</div>";
  }

  function renderScreenshots(app) {
    var shots = Array.isArray(app.screenshots) ? app.screenshots : [];
    return shots.map(function (shot, index) {
      return '<button class="screenshot-card" type="button" data-screenshot="' + index + '" aria-label="Open ' + escapeHtml(shot.title) + ' screenshot">' +
        screenshotFrame(shot, app) +
        '<div class="screenshot-label">' + escapeHtml(shot.title) + '<small>' + escapeHtml(shot.caption || "") + "</small></div>" +
      "</button>";
    }).join("");
  }

  function renderDetails(app) {
    currentApp = app;
    var description = (app.description || [app.shortDescription]).map(function (paragraph) {
      return "<p>" + escapeHtml(paragraph) + "</p>";
    }).join("");
    var whatsNew = (app.whatsNew || []).map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");

    detailContent.innerHTML =
      '<div class="detail-hero">' +
        appIcon(app) +
        '<div class="detail-title-block">' +
          '<h1 id="detail-title">' + escapeHtml(app.name) + "</h1>" +
          '<p class="detail-developer">' + escapeHtml(app.developer || config.developer) + "</p>" +
          '<p class="detail-tagline">' + escapeHtml(app.tagline) + "</p>" +
        "</div>" +
      "</div>" +
      detailStats(app) +
      '<div class="detail-actions">' +
        '<button class="primary-button" type="button" data-download-app="' + escapeHtml(app.id) + '">Download APK</button>' +
        '<button class="secondary-button" type="button" data-share-app>Share</button>' +
      "</div>" +
      '<section class="content-section" aria-labelledby="screenshots-heading">' +
        '<div class="content-section-heading"><h2 id="screenshots-heading">Screenshots</h2><span class="screenshot-hint">Tap to enlarge</span></div>' +
        '<div class="screenshots-track">' + renderScreenshots(app) + "</div>" +
      "</section>" +
      '<section class="content-section description-copy" aria-labelledby="about-app-heading">' +
        '<h2 id="about-app-heading">About this app</h2>' + description +
      "</section>" +
      '<section class="content-section" aria-labelledby="whats-new-heading">' +
        '<h2 id="whats-new-heading">What\'s new</h2>' +
        '<div class="whats-new"><ul>' + whatsNew + "</ul></div>" +
      "</section>" +
      '<section class="content-section" aria-labelledby="app-info-heading">' +
        '<h2 id="app-info-heading">App info</h2>' +
        '<div class="app-info-grid">' +
          '<div class="info-row"><span>Version</span><strong>' + escapeHtml(app.version) + "</strong></div>" +
          '<div class="info-row"><span>Updated</span><strong>' + escapeHtml(app.updated) + "</strong></div>" +
          '<div class="info-row"><span>Download size</span><strong>' + escapeHtml(app.size) + "</strong></div>" +
          '<div class="info-row"><span>Requires Android</span><strong>' + escapeHtml(app.android) + "</strong></div>" +
          '<div class="info-row"><span>Category</span><strong>' + escapeHtml(app.category) + "</strong></div>" +
          '<div class="info-row"><span>Package name</span><strong>' + escapeHtml(app.packageName) + "</strong></div>" +
        "</div>" +
        '<div class="install-note"><span class="install-note-icon">i</span><div><strong>Installing outside Google Play</strong><p>Android may ask you to allow installs from this browser. Review the app name and source before continuing.</p></div></div>' +
      "</section>";

    mobileBar.hidden = false;
    document.getElementById("mobile-app-name").textContent = app.name;
    document.getElementById("mobile-version").textContent = "Version " + app.version;
    document.title = app.name + " – " + config.name;
  }

  function showPage(pageName) {
    homePage.hidden = pageName !== "home";
    detailPage.hidden = pageName !== "detail";
    aboutPage.hidden = pageName !== "about";
    searchShell.hidden = pageName === "detail" || pageName === "about";
    mobileBar.hidden = pageName !== "detail";

    document.querySelectorAll("[data-nav]").forEach(function (item) {
      var target = item.getAttribute("data-nav");
      item.classList.toggle("is-active", pageName === "home" ? target === "home" : target === pageName);
    });
  }

  function route() {
    var hash = window.location.hash || "#/";
    var match = hash.match(/^#\/app\/([^/?#]+)/);

    if (match) {
      var app = apps.filter(function (item) { return item.id === decodeURIComponent(match[1]); })[0];
      if (app) {
        renderDetails(app);
        showPage("detail");
        window.scrollTo(0, 0);
        return;
      }
      window.location.hash = "#/";
      return;
    }

    if (hash.indexOf("#/about") === 0) {
      currentApp = null;
      showPage("about");
      document.title = "About – " + config.name;
      window.scrollTo(0, 0);
      return;
    }

    currentApp = null;
    showPage("home");
    document.title = config.name;

    if (hash.indexOf("#/apps") === 0) {
      window.setTimeout(function () {
        document.querySelector(".app-list-heading").scrollIntoView({ behavior: "smooth", block: "start" });
      }, 30);
      document.querySelectorAll("[data-nav]").forEach(function (item) {
        item.classList.toggle("is-active", item.getAttribute("data-nav") === "apps");
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  function findApp(id) {
    return apps.filter(function (app) { return app.id === id; })[0] || null;
  }

  function openApp(id) {
    if (findApp(id)) {
      window.location.hash = "#/app/" + encodeURIComponent(id);
    }
  }

  function downloadApp(app) {
    if (!app) return;
    if (!app.apkUrl) {
      showToast("APK link for " + app.name + " is not set yet. Add it in Zenhub Admin.");
      return;
    }
    var anchor = document.createElement("a");
    anchor.href = app.apkUrl;
    anchor.rel = "noopener";
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function shareApp(app) {
    if (!app) return;
    var url = window.location.href;
    var data = {
      title: app.name,
      text: "Download " + app.name + " from " + config.name + ".",
      url: url
    };

    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        showToast("App link copied.");
      });
    } else {
      var area = document.createElement("textarea");
      area.value = url;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      showToast("App link copied.");
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 3400);
  }

  function openScreenshot(index) {
    if (!currentApp || !currentApp.screenshots[index]) return;
    var shot = currentApp.screenshots[index];
    dialogMedia.innerHTML = screenshotFrame(shot, currentApp);
    dialogCaption.innerHTML = "<strong>" + escapeHtml(shot.title) + "</strong><span>" + escapeHtml(shot.caption || "") + "</span>";
    screenshotDialog.showModal();
  }

  function applyStoreDetails() {
    document.querySelectorAll("[data-store-name]").forEach(function (node) {
      node.textContent = config.name;
    });
    document.querySelectorAll("[data-store-logo]").forEach(function (node) {
      if (config.logo) node.src = config.logo;
    });
    if (/^#[0-9a-f]{6}$/i.test(config.accent || "")) {
      document.documentElement.style.setProperty("--green", config.accent);
      document.documentElement.style.setProperty("--green-hover", "color-mix(in srgb, " + config.accent + " 78%, white)");
      document.documentElement.style.setProperty("--green-soft", "color-mix(in srgb, " + config.accent + " 20%, transparent)");
    }
    document.title = config.name;
    document.documentElement.setAttribute("data-theme", "dark");
    document.querySelector('meta[name="theme-color"]').setAttribute("content", "#101114");
  }

  document.addEventListener("click", function (event) {
    var openTarget = event.target.closest("[data-open-app]");
    var downloadTarget = event.target.closest("[data-download-app]");
    var shareTarget = event.target.closest("[data-share-app]");
    var screenshotTarget = event.target.closest("[data-screenshot]");
    var homeTarget = event.target.closest("[data-home-link]");

    if (openTarget) openApp(openTarget.getAttribute("data-open-app"));
    if (downloadTarget) downloadApp(findApp(downloadTarget.getAttribute("data-download-app")));
    if (shareTarget) shareApp(currentApp);
    if (screenshotTarget) openScreenshot(Number(screenshotTarget.getAttribute("data-screenshot")));
    if (homeTarget) window.location.hash = "#/";
  });

  searchInput.addEventListener("input", function () {
    renderApps(searchInput.value);
  });

  document.getElementById("clear-search").addEventListener("click", function () {
    searchInput.value = "";
    renderApps("");
    searchInput.focus();
  });

  document.getElementById("back-button").addEventListener("click", function () {
    window.location.hash = "#/";
  });

  document.getElementById("share-button").addEventListener("click", function () {
    shareApp(currentApp);
  });

  document.getElementById("mobile-download-button").addEventListener("click", function () {
    downloadApp(currentApp);
  });

  document.getElementById("dialog-close").addEventListener("click", function () {
    screenshotDialog.close();
  });

  screenshotDialog.addEventListener("click", function (event) {
    if (event.target === screenshotDialog) screenshotDialog.close();
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("scroll", function () {
    document.getElementById("topbar").classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });

  applyStoreDetails();
  renderFeatured();
  renderApps("");
  route();
}());
