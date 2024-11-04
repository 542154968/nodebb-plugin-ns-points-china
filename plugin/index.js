(function (Plugin) {
  "use strict";

  const async = require("async");
  const meta = require.main.require("./src/meta");
  const actions = require("./actions"),
    controller = require("./controller"),
    files = require("./files"),
    filters = require("./filters"),
    settings = require("./settings"),
    sockets = require("./sockets"),
    Ranking = require("./default-ranking");

  //NodeBB list of Hooks: https://github.com/NodeBB/NodeBB/wiki/Hooks
  Plugin.hooks = {
    actions: actions,
    filters: filters,
    statics: {
      load: function (params, callback) {
        var router = params.router,
          middleware = params.middleware,
          pluginUri = "/admin/plugins/points",
          renderAdmin = function (req, res, next) {
            res.render(pluginUri.substring(1), {});
          },
          renderOverviewSection = async function (req, res, next) {
            controller.getTopUsers(function (error, payload) {
              if (error) {
                return res.status(500).json(error);
              }
              res.render("points/overview", payload);
            });
          };
        meta.notifications?.types?.push("nodebb-plugin-points-notify");
        router.get(pluginUri, middleware.admin.buildHeader, renderAdmin);
        // 这个是请求接口
        router.get("/api" + pluginUri, renderAdmin);

        // Overview Page
        router.get("/points", middleware.buildHeader, renderOverviewSection);
        // 这个是请求接口
        router.get("/api/points", renderOverviewSection);

        router.get("/api/points/user", async (req, res, next) => {
          try {
            const { uid, page = 1, resultsPerPage = 50 } = req.query;
            console.log("uid", uid, typeof uid);
            const numUid = Number(uid);
            if (numUid <= 0 || isNaN(numUid)) {
              return res.status(500).json("[[error:invalid-url]]");
            }
            const datas = await controller.getUserPointsLogsByUid(
              numUid,
              page,
              resultsPerPage
            );
            res.json(datas);
          } catch (error) {
            return res.status(500).json(error);
          }
        });

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
      filterAccountProfileBuild: async function (hookData) {
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
    },
  };
})(module.exports);
