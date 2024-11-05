"use strict";

/* globals define, app, ajaxify, bootbox, socket, templates, utils */

define("forum/points/overview", [], function () {
  var module = {};

  function getOverviewCount() {
    window.socket.emit(
      // 来源于client/acp/model/socket-api.js
      "plugins.ns-points.getSettings",
      {},
      (error, settings) => {
        if (error) {
          //App.alertError(error.message);
          return;
        }
        var h2El = document.getElementById("points-overview-title");
        if (h2El && settings.maxUsers) {
          var title = `<span>积分榜 - 前${settings.maxUsers}名</span>`;
          if (ajaxify.data.rank) {
            title +=
              '<span style="font-size:12px; color:#999;">您位于积分榜第<strong style="color:rgba(var(--bs-primary-rgb))"> ' +
              ajaxify.data.rank +
              " </strong>名</span>";
          }
          h2El.innerHTML = title;
        }
      }
    );
  }

  module.init = function () {
    var container = document.getElementsByClassName("points-container")[0];
    var i,
      len = ajaxify.data.users.length,
      payload,
      innerHTML = "";

    for (i = 0; i < len; ++i) {
      payload = ajaxify.data.users[i];
      innerHTML += payload;
    }
    container.innerHTML = innerHTML;

    getOverviewCount();
  };

  return module;
});
