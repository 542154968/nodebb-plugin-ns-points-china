"use strict";

/**
 * This file shows how client-side javascript can be included via a plugin.
 * If you check `plugin.json`, you'll see that this file is listed under "scripts".
 * That array tells NodeBB which files to bundle into the minified javascript
 * that is served to the end user.
 *
 * There are two (standard) ways to wait for when NodeBB is ready.
 * This one below executes when NodeBB reports it is ready...
 */

(async () => {
  const hooks = await app.require("hooks");
  const alerts = await app.require("alerts");

  hooks.on("action:post.save action:topic.save", () => {
    alerts.success("恭喜您，积分增加了！", 2000);
  });

  hooks.on("action:ajaxify.end", (/* data */) => {
    // called everytime user navigates between pages including first load
  });
})();

/**
 * ... and this one reports when the DOM is loaded (but NodeBB might not be fully ready yet).
 * For most cases, you'll want the one above.
 */

$(document).ready(function () {
  // ...
});
