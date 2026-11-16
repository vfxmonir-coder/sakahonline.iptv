# SAKAH ONLINE IPTV

A lightweight, responsive Progressive Web App (PWA) for browsing and playing publicly listed IPTV streams. It can be hosted free with GitHub Pages.

## Features
- Sports, Drama, News and Movies category tabs
- Channel search, favourites (long-press/right-click a channel), HLS playback and fullscreen
- Android install prompt where supported; users can also use browser menu → Install app / Add to Home screen
- Responsive mobile and desktop layout
- SAKAH ONLINE and Credit By VFX MONIR branding

## Deploy to GitHub Pages
1. Create a new GitHub repository, for example `sakah-online`.
2. Upload all files and folders from this project to the repository root (keep `index.html` in the root).
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main`, folder `/ (root)`, then Save.
6. Wait for GitHub Pages to publish. Your website will be at `https://YOUR-USERNAME.github.io/sakah-online/`.
7. Open that HTTPS address on Android Chrome. Use the Install App button or Chrome menu → Install app / Add to Home screen.

## Playlist sources
The app fetches these IPTV-Org category playlists at runtime:
- Sports: `https://iptv-org.github.io/iptv/categories/sports.m3u`
- Drama: `series.m3u` and `entertainment.m3u`
- News: `https://iptv-org.github.io/iptv/categories/news.m3u`
- Movies: `https://iptv-org.github.io/iptv/categories/movies.m3u`

If category endpoints fail, it tries the supplied main playlist:
`https://iptv-org.github.io/iptv/index.m3u`

The IPTV-Org list is community-maintained and channels can disappear, move, or stop working. Drama is a practical grouping of Series and Entertainment categories; it is not an official IPTV-Org category.

## Important limitations
- PWA is an installable website, not a separately compiled APK. This keeps the project lightweight and avoids an Android build toolchain.
- Browser playback depends on the stream format, broadcaster restrictions, CORS, codec support and stream uptime. HLS `.m3u8` is best supported; not every stream in a public M3U will play in a browser.
- The app does not host, record, proxy or redistribute streams. It links to third-party stream URLs. Only use streams you are legally authorized to watch or distribute.
- IPTV-Org is an independent community project. SAKAH ONLINE is not affiliated with IPTV-Org.

## Customization
Edit `index.html` to change the branding. Edit `SOURCES` in `app.js` to add/remove playlist categories. For GitHub Pages project sites, keep relative paths (`./`) as provided.
