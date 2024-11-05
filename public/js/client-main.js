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
    }
  );

  /**
   * 快速回复时触发的钩子
   */
  hooks.on("action:quickreply.success", data => {
    settingData.postWeight &&
      alerts.success(
        `回复成功，积分 +${settingData.postWeight}！`,
        MSG_DURATION
      );
  });

  /**
   * 点赞时触发的钩子
   */

  hooks.on("action:post.toggleVote", data => {
    if (settingData.reputationActionWeight) {
      data.unvote
        ? alerts.success(
            `取消点赞，积分 -${settingData.reputationActionWeight}！`,
            MSG_DURATION
          )
        : alerts.success(
            `点赞成功，积分 +${settingData.reputationActionWeight}！`,
            MSG_DURATION
          );
    }
  });

  /**
   * 点击富文本提交时触发的钩子
   */
  $(window).on("action:composer.submit", function (ev, data) {
    // 如果是发帖
    if (data.action === "topics.post") {
      settingData.topicWeight &&
        alerts.success(
          `发帖成功，积分 +${settingData.topicWeight}！`,
          MSG_DURATION
        );
    } else if (data.action === "posts.reply") {
      settingData.postWeight &&
        alerts.success(
          `回复成功，积分 +${settingData.postWeight}！`,
          MSG_DURATION
        );
    }
  });

  hooks.on("action:app.load", () => {
    if (app.user.uid > 0) {
      handleGetUserSignInStatus();
    }
  });

  /**
   * 获取用户今日签到状态
   */
  function handleGetUserSignInStatus() {
    $.ajax({
      url: "/api/signIn/getUserStatus",
      method: "GET",
      dataType: "json",
      success: function (data) {
        if (!data) {
          return;
        }
        $("#panel .brand-container > div").append(getSignBtnDom(data));
      },
    });
  }

  /**
   * 点击签到
   * @param {*} data
   * @returns
   */
  function getSignBtnDom(data) {
    var isSignIn = data.isSignIn;
    var index = data.index;
    var isDisabled = isSignIn ? " disabled " : "";
    var btnText = isSignIn ? "已签到" : "签到";

    if (isSignIn) {
      return (
        '<span class="d-flex align-items-center" style="margin-left: auto; color: #999; font-size: 12px">今日第' +
        index +
        "名签到</span>"
      );
    } else {
      var signInBtn = $(
        "<button " +
          isDisabled +
          ' style="margin-left: auto" type="button" class="btn btn-primary" id="sign-in-btn">' +
          btnText +
          "</button>"
      ).click(handleSignIn);
      return signInBtn;
    }
  }

  function handleSignIn() {
    var signInBtn = $("#sign-in-btn");
    signInBtn.prop("disabled", true);
    $.ajax({
      url: "/api/signIn",
      method: "GET",
      dataType: "json",
      success: function (data) {
        signInBtn.attr("disabled", false);
        if (!data) {
          return;
        }

        if (data.status) {
          var pointsMsg = settingData.baseSignInPoints
            ? "+" + settingData.baseSignInPoints + "积分！"
            : "";
          alerts.success(data.msg + pointsMsg, 3000);
        } else {
          alerts.warning(data.msg, 3000);
        }
        signInBtn.remove();
        $("#panel .brand-container > div").append(getSignBtnDom(data));
      },
      error: function () {
        signInBtn.prop("disabled", false);
      },
    });
  }
})();

/**
 * ... and this one reports when the DOM is loaded (but NodeBB might not be fully ready yet).
 * For most cases, you'll want the one above.
 */

$(document).ready(function () {
  // ...
});
