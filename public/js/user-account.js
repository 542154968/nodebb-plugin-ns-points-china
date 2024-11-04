"use strict";

$(window).on("action:ajaxify.end", async function () {
  if (ajaxify.data.template.name === "account/profile") {
    var currentLevel = ajaxify.data.level;
    var currentPoints = ajaxify.data.points;
    var levelDom = $(
      '<a class="stat" style="cursor: pointer" href="/points-log-user?uid=' +
        ajaxify.data.uid +
        '&page=1">' +
        '<div class="align-items-center justify-content-center card card-header px-0 py-3 border-0 rounded-1 h-100">' +
        '<span class="stat-label text-xs fw-semibold">等级</span>' +
        '<span class="fs-2 ff-secondary" title="0">' +
        currentLevel +
        "</span>" +
        "</div>" +
        "</a>"
    );
    var pointsDom = $(
      '<a class="stat" style="cursor: pointer" href="/points-log-user?uid=' +
        ajaxify.data.uid +
        '&page=1">' +
        '<div class="align-items-center justify-content-center card card-header px-0 py-3 border-0 rounded-1 h-100">' +
        '<span class="stat-label text-xs fw-semibold">积分</span>' +
        '<span class="fs-2 ff-secondary" title="0">' +
        currentPoints +
        "</span>" +
        "</div>" +
        "</a>"
    );
    $(".account-stats.container > .row").prepend(levelDom).prepend(pointsDom);
  }
});
