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
  /**
   * 积分增长规则
   */
  let settingData = {};
  /**
   * 积分增加提示消息
   */
  const MSG_DURATION = 2000;

  // 拉取积分设置
  window.socket.emit(
    // 来源于client/acp/model/socket-api.js
    "plugins.ns-points.getCalculationProperties",
    {},
    (error, settings) => {
      if (error) {
        //App.alertError(error.message);
        return;
      }
      settingData = settings;
      console.log(settings, "设置的set");
    }
  );

  /**
   * 快速回复时触发的钩子
   */
  hooks.on("action:quickreply.success", data => {
    alerts.success(
      `回复成功，积分 ${
        settingData.postWeight ? `+${settingData.postWeight}` : "增加了"
      }！`,
      MSG_DURATION
    );
  });

  /**
   * 点击富文本提交时触发的钩子
   */
  $(window).on("action:composer.submit", function (ev, data) {
    // 如果是发帖
    if (data.action === "topics.post") {
      alerts.success(
        `发帖成功，积分 ${
          settingData.topicWeight ? `+${settingData.topicWeight}` : "增加了"
        }！`,
        MSG_DURATION
      );
    } else if (data.action === "posts.reply") {
      alerts.success(
        `回复成功，积分 ${
          settingData.postWeight ? `+${settingData.postWeight}` : "增加了"
        }！`,
        MSG_DURATION
      );
    }
  });
})();

/**
 * ... and this one reports when the DOM is loaded (but NodeBB might not be fully ready yet).
 * For most cases, you'll want the one above.
 */

$(document).ready(function () {
  // ...
});
