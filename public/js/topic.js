"use strict";

$(window).on("action:topic.loaded action:posts.loaded", function (ev, data) {
  if (ajaxify.data.template.name === "topic") {
    data.posts.forEach(post => {
      var postEl = $(`[component="post"][data-pid=${post.pid}]`);
      var level = post.user.level;
      // 这个是多语言转换的
      // const translator = await app.require('translator');
      postEl.each((i, el) => {
        var $el = $(el);
        var $aEl = $el.find(".post-container a[data-username]");
        if ($aEl) {
          $aEl.after(
            '<span class="badge rounded-pill text-bg-success">lv.' +
              level +
              "</span>"
          );
        }
      });
    });
  }
});
