const {test} = require('node:test')
const assert = require('node:assert/strict')
const {allowFullscreen} = require('../desktop/permissions.cjs')

test('fullscreen is limited to the trusted app main frame', () => {
  const contents = {}, window = {webContents:contents, isDestroyed:() => false}
  const details = {isMainFrame:true, requestingUrl:'app://matterforge/'}
  assert.equal(allowFullscreen(window, contents, 'fullscreen', details), true)
  for (const permission of ['media', 'notifications', 'clipboard-read', 'automatic-fullscreen', 'geolocation']) assert.equal(allowFullscreen(window, contents, permission, details), false)
  for (const url of ['https://matterforge/', 'app://other/', 'app://user@matterforge/', 'app://matterforge:80/', 'invalid']) assert.equal(allowFullscreen(window, contents, 'fullscreen', {...details, requestingUrl:url}), false)
  assert.equal(allowFullscreen(window, contents, 'fullscreen', {...details, isMainFrame:false}), false)
  assert.equal(allowFullscreen(window, {}, 'fullscreen', details), false)
  assert.equal(allowFullscreen(undefined, contents, 'fullscreen', details), false)
  assert.equal(allowFullscreen({...window, isDestroyed:() => true}, contents, 'fullscreen', details), false)
  assert.equal(allowFullscreen(window, contents, 'fullscreen', undefined), false)
})
