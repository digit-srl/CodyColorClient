/*
 * File di configurazione del service worker. Permette di effettuare la build di quest'ultimo tramite il comando
 * 'workbox injectManifest workbox-config.js'. Permette in particolare di impostare i path dei file da
 * pre-cachare, così da permettere l'utilizzo del gioco anche offline.
 */
module.exports = {
    "globDirectory": ".",
    "globPatterns": [
        "audio/*.mp3",              /* Audio */
        "img/*.png",                /* Images */
        "icons/*.png",              /* Icons */
        "favicon.ico",              /* Icons */
        "fonts/*.*",                /* Fonts */
        "locales/*.*",              /* locales */
        "build/*.*",                /* Minified css and js */
        "pages/*.html",             /* Pages */
        "index.html",               /* Website Index */
        "browserconfig.xml",        /* Auxiliary...*/
        "humans.txt",
        "manifest.json",
        "robots.txt",
        "site.webmanifest"
    ],
    "swSrc": "src-service-worker.js",
    // "maximumFileSizeToCacheInBytes": 12 * 1024 * 1024, // 12mb
    "swDest": "service-worker.js"
};
