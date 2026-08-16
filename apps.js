/* Offline fallback data. The live GitHub Pages store loads apps.json.
 * Use admin.html to manage and publish the live catalog. */
window.STORE_CONFIG = {
  name: "Zenhub",
  developer: "Zen Corpuz",
  tagline: "All your apps. One trusted hub.",
  logo: "https://raw.githubusercontent.com/missnapokita/masterkiter/refs/heads/main/jajajs.png",
  accent: "#f5c518",
  apps: [
    {
      id: "bisaya-toolkit",
      name: "Bisaya Toolkit",
      developer: "Zen Corpuz",
      category: "Tools",
      tagline: "Your MLBB companion in one clean toolkit.",
      shortDescription: "Hero guides, builds, equipment, battle effects, and useful MLBB tools in one place.",
      description: [
        "Bisaya Toolkit brings your most-used Mobile Legends companion tools into one fast and organized app.",
        "Browse hero information, suggested builds, equipment, battle effects, and other utilities through a clean interface designed for Android."
      ],
      version: "1.0.0",
      size: "Add size",
      android: "Android 8.0+",
      updated: "August 2026",
      packageName: "com.bisayatoolkit.ph",
      apkUrl: "",
      iconImage: "",
      iconText: "BT",
      accent: "#64b553",
      accentDark: "#2f7f38",
      featured: true,
      whatsNew: [
        "Clean green interface",
        "Hero guides and useful MLBB tools",
        "Performance and stability improvements"
      ],
      screenshots: [
        { title: "For You", caption: "Discover heroes and the latest content.", theme: "green", layout: "feed" },
        { title: "Hero Guide", caption: "View stats, builds, skills, and counters.", theme: "forest", layout: "hero" },
        { title: "Equipments", caption: "Browse equipment by category.", theme: "mint", layout: "grid" },
        { title: "Tools", caption: "Quick access to useful calculators and tools.", theme: "lime", layout: "tools" }
      ]
    },
    {
      id: "masterkit",
      name: "MasterKit",
      developer: "Zen Corpuz",
      category: "Tools",
      tagline: "Guides and customization tools for MLBB players.",
      shortDescription: "A compact MLBB toolkit with hero guides, preparations, maps, and customization features.",
      description: [
        "MasterKit collects practical game references and customization tools in one Android app.",
        "Its organized sections make it easy to move from hero information to preparations, maps, and other utilities."
      ],
      version: "1.0.0",
      size: "Add size",
      android: "Android 8.0+",
      updated: "August 2026",
      packageName: "com.iandev.masterkit",
      apkUrl: "",
      iconImage: "",
      iconText: "MK",
      accent: "#f5c518",
      accentDark: "#8b6800",
      whatsNew: [
        "Updated guide presentation",
        "Improved app navigation",
        "Bug fixes and performance updates"
      ],
      screenshots: [
        { title: "Home", caption: "Open every major feature from one screen.", theme: "gold", layout: "feed" },
        { title: "Heroes", caption: "Explore hero guides and details.", theme: "amber", layout: "hero" },
        { title: "Preparations", caption: "Review builds and setups.", theme: "yellow", layout: "grid" },
        { title: "Maps", caption: "Browse available battlefield options.", theme: "bronze", layout: "tools" }
      ]
    },
    {
      id: "bidamax",
      name: "BidaMax",
      developer: "Zen Corpuz",
      category: "Entertainment",
      tagline: "Movies and series in one easy-to-browse app.",
      shortDescription: "Discover movies, series, anime, and new releases through a simple streaming catalog.",
      description: [
        "BidaMax presents movies and series in a clean catalog made for mobile viewing.",
        "Browse titles, read information, explore episodes, and quickly return to the shows you want to watch."
      ],
      version: "1.0.0",
      size: "Add size",
      android: "Android 8.0+",
      updated: "August 2026",
      packageName: "Add package name",
      apkUrl: "",
      iconImage: "",
      iconText: "BM",
      accent: "#e14664",
      accentDark: "#921d3d",
      whatsNew: [
        "Fresh catalog design",
        "Improved title and episode browsing",
        "Playback stability improvements"
      ],
      screenshots: [
        { title: "Discover", caption: "Browse featured movies and series.", theme: "rose", layout: "feed" },
        { title: "Movie Details", caption: "Read the overview before watching.", theme: "wine", layout: "hero" },
        { title: "Series", caption: "Find seasons and episodes quickly.", theme: "coral", layout: "grid" },
        { title: "My List", caption: "Keep your favorite titles close.", theme: "plum", layout: "tools" }
      ]
    }
  ]
};
