function allowFullscreen(window, contents, permission, details) {
  if (permission !== 'fullscreen' || !window || window.isDestroyed() || !contents || contents !== window.webContents || !details?.isMainFrame) return false
  try {
    const url = new URL(details.requestingUrl)
    return url.protocol === 'app:' && url.hostname === 'matterforge' && !url.username && !url.password && !url.port
  } catch { return false }
}
module.exports = {allowFullscreen}
