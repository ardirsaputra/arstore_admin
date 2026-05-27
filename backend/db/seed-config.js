require("dotenv").config();
const { sql } = require("./client");

const defaultConfigs = {
  disabled_tools: [],
  downloader_twitter_api: "https://api.fxtwitter.com/status/",
  downloader_cobalt_instances: [
    "https://api.cobalt.tools/",
    "https://cobalt.api.timelessnesses.me/",
    "https://cobalt.lunar.icu/"
  ],
  downloader_tiktok_api: "https://tikwm.com/api/",
  downloader_facebook_regex_hd: [
    '"hd_src":"([^"]+)"',
    '"hd_src_no_ratelimit":"([^"]+)"',
    'browser_native_hd_url":"([^"]+)"'
  ],
  downloader_facebook_regex_sd: [
    '"sd_src":"([^"]+)"',
    '"sd_src_no_ratelimit":"([^"]+)"',
    'browser_native_sd_url":"([^"]+)"'
  ],
  downloader_threads_regex: [
    '"video_url":"([^"]+)"',
    '"video_versions":\\[{"type":104,"url":"([^"]+)"'
  ],
  adblock_domains: [
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "adservice.google.com",
    "adservice.google.co.id",
    "pagead2.googlesyndication.com",
    "ads.google.com",
    "googletagmanager.com",
    "google-analytics.com",
    "analytics.google.com",
    "stats.g.doubleclick.net",
    "ssl.google-analytics.com",
    "adnxs.com",
    "ads.yahoo.com",
    "adsymptotic.com",
    "amazon-adsystem.com",
    "adsafeprotected.com",
    "pubmatic.com",
    "rubiconproject.com",
    "taboola.com",
    "outbrain.com",
    "criteo.com",
    "moatads.com",
    "scorecardresearch.com",
    "chartbeat.com",
    "mixpanel.com",
    "hotjar.com",
    "quantserve.com",
    "adsrvr.org",
    "advertising.com",
    "revcontent.com",
    "mgid.com",
    "propellerads.com",
    "securepubads.g.doubleclick.net",
    "imasdk.googleapis.com",
    "static.doubleclick.net",
    "tpc.googlesyndication.com"
  ],
  adblock_yt_selectors: [
    ".ytp-ad-overlay-container",
    ".ytp-ad-text-overlay", ".ytp-ad-progress",
    ".ytp-ad-progress-list", "#player-ads", "#masthead-ad",
    ".ytd-banner-promo-renderer", "ytd-banner-promo-renderer",
    "ytd-statement-banner-renderer", "ytd-ad-slot-renderer",
    "ytd-in-feed-ad-layout-renderer", ".ytd-rich-item-renderer[is-ad]",
    "ytd-promoted-sparkles-web-renderer", "ytd-promoted-video-renderer",
    "ytd-action-companion-ad-renderer", "ytd-display-ad-renderer",
    "ytd-companion-slot-renderer", "ytd-player-legacy-desktop-watch-ads-renderer",
    "#ad-badge", ".ytd-ads-renderer", "tp-yt-paper-dialog[aria-label*=\"ad\"]",
    ".ytd-mealbar-promo-renderer", "ytd-mealbar-promo-renderer",
    ".ytp-ce-element", ".ytp-suggested-action",
    ".ytp-youtube-button",
    ".ytm-app-promo-wrapper",
    "ytm-app-dialog-popup-container",
    "ytm-continue-in-browser-button-view-model",
    "ytd-rich-item-renderer[is-promoted-content]",
    "ytd-rich-item-renderer[data-is-promoted]"
  ],
  adblock_yt_skip_selectors: [
    ".ytp-skip-ad-button", ".ytp-ad-skip-button", ".ytp-ad-skip-button-modern",
    ".ytp-skip-ad-button__text", "[class*=\"skip-ad\"]", "[class*=\"skipAd\"]",
    "button.ytp-skip-ad-button"
  ],
  adblock_general_selectors: [
    "iframe[src*=\"ads\"]", "iframe[src*=\"adsystem\"]", "iframe[src*=\"doubleclick\"]",
    "iframe[id*=\"ads\"]", "div[id^=\"ad-\"]", "div[class*=\"ad-\"]:not(.nav):not(.header)", 
    ".adsbygoogle", ".ad-slot", ".ad-container", "#ad-container",
    "div[data-ad-slot]", "div[data-ad-unit]", "ins.adsbygoogle",
    ".ad-banner", ".ad-box", ".ad-wrapper", ".ad-placeholder",
    "div[id*=\"google_ads_\"]", "div[id*=\"banner-ad\"]"
  ],
  manga_mangaplus_api: "https://jumpg-webapi.tokyo-cdn.com/api/viewer",
  manga_css_selectors: [
    ".reading-content .page-break img",
    "#readerarea img",
    ".reading-content img",
    ".chapter-content img",
    "img.wp-manga-chapter-img",
    ".comic-reader img",
    ".reader-area img",
    ".chapter-reader img"
  ],
  manga_js_patterns: [
    "chapter_preloaded_images\\s*=\\s*(\\[[\\s\\S]*?\\])",
    "chapter_images\\s*=\\s*(\\[[\\s\\S]*?\\])",
    "(?:var|let|const)\\s+pages\\s*=\\s*(\\[[\\s\\S]*?\\])",
    "(?:var|let|const)\\s+imageList\\s*=\\s*(\\[[\\s\\S]*?\\])",
    "(?:var|let|const)\\s+imgs\\s*=\\s*(\\[[\\s\\S]*?\\])",
    "\"images\"\\s*:\\s*(\\[[\\s\\S]{10,}?\\])"
  ]
};

async function run() {
  console.log("Seeding app config...");
  try {
    for (const [key, value] of Object.entries(defaultConfigs)) {
      await sql(
        `INSERT INTO app_config (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      );
      console.log(`- Upserted: ${key}`);
    }
    console.log("Seed completed successfully!");
  } catch (err) {
    console.error("Error seeding config:", err);
  }
}

run();
