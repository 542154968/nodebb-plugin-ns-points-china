"use strict";
const async = require("async");
const actions = require("./actions"),
  controller = require("./controller"),
  files = require("./files"),
  filters = require("./filters"),
  settings = require("./settings"),
  sockets = require("./sockets"),
  Ranking = require("./default-ranking");

const pointsConrtoller = require("../controller/points");
const signInConrtoller = require("../controller/signIn");

const plugin = {};
//NodeBB list of Hooks: https://github.com/NodeBB/NodeBB/wiki/Hooks
plugin.hooks = {
  actions: actions,
  filters: filters,
  statics: {
    load: function (params, callback) {
      var router = params.router,
        middleware = params.middleware;

      // 管理端的积分
      router.get(
        "/admin/plugins/points",
        middleware.admin.buildHeader,
        pointsConrtoller.renderAdminPointsPage
      );
      router.get(
        "/api/admin/plugins/points",
        pointsConrtoller.renderAdminPointsPage
      );

      // 客户端的积分排行榜
      router.get(
        "/points",
        middleware.buildHeader,
        pointsConrtoller.renderClientPoinstsOverviewPage
      );
      router.get(
        "/api/points",
        pointsConrtoller.renderClientPoinstsOverviewPage
      );

      // 客户端的用户积分获取列表日志
      router.get(
        "/points-log-user",
        middleware.buildHeader,
        pointsConrtoller.renderClientUserPointsPage
      );
      router.get(
        "/api/points-log-user",
        pointsConrtoller.renderClientUserPointsPage
      );

      router.get(
        "/api/signIn/getUserStatus",
        middleware.applyCSRF,
        middleware.requireUser,
        signInConrtoller.getUserSignInStatus
      );

      router.get(
        "/api/signIn",
        middleware.applyCSRF,
        middleware.requireUser,
        signInConrtoller.signIn
      );

      async.parallel(
        {
          settings: async.apply(settings.init),
          sockets: async.apply(sockets.init),
          files: async.apply(files.init),
        },
        callback
      );
    },

    userDelete: function ({ uid }, callback) {
      controller.deleteUser(uid, callback);
    },

    /**
     * 用户主页设置显示积分和等级
     * @param {*} hookData
     * @returns
     */
    filterAccountProfileBuild: async hookData => {
      if (hookData.templateData) {
        const uid = hookData.templateData.uid;
        if (uid) {
          const points = await controller
            .getUserPointsByUid(uid)
            .catch(() => {});
          const settingData = settings.get();
          hookData.templateData.points = points || 0;
          const rankData = Ranking.compute(settingData, points || 0);
          hookData.templateData.level = rankData.rank;
        }
      }

      return hookData;
    },
    /**
     * 将用户等级塞入到 帖子列表中的用户信息中
     * @param {*} hookData
     * @returns
     */
    filterPostsGetUserInfoForPosts: async hookData => {
      // 使用 Promise.all 等待所有异步操作完成
      hookData.users = await Promise.all(
        hookData.users.map(async user => {
          const points = await controller.getUserPointsByUid(user.uid);
          const settingData = settings.get();
          const rankData = Ranking.compute(settingData, points || 0);
          return {
            ...user,
            level: rankData.rank,
          };
        })
      );

      return hookData;
    },
  },
};
module.exports = plugin;
