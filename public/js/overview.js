"use strict";

/* globals define, app, ajaxify, bootbox, socket, templates, utils */

define("forum/points/overview", [], function () {
  console.log(ajaxify.data, "data");
  var module = {};
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
  };

  return module;
});
