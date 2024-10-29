"use strict";

/* globals define, app, ajaxify, bootbox, socket, templates, utils */

define("forum/points/overview", [], function () {
  console.log(ajaxify.data, "data");
  var module = {},
    columns = 4,
    className = "col-lg-3 col-md-3 col-xs-12 points-fade-in",
    delay = 0.1;

  module.init = function () {
    var container = document.getElementsByClassName("points-users")[0];
    var i,
      len = ajaxify.data.users.length,
      payload,
      htmlRow,
      htmlUser;

    for (i = 0; i < len; ++i) {
      payload = ajaxify.data.users[i];

      if (i % columns === 0) {
        htmlRow = document.createElement("div");
        htmlRow.className = "row";
        container.appendChild(htmlRow);
      }

      htmlUser = document.createElement("div");
      htmlUser.className = className;
      htmlUser.style["animation-delay"] = delay * i + "s";
      htmlUser.innerHTML = payload;
      htmlRow.appendChild(htmlUser);
    }
  };

  return module;
});
