"use strict";

const controller = {};

const async = require("async"),
  benchpress = require("./nodebb").benchpress,
  nconf = require("./nodebb").nconf;

const database = require("./database"),
  Ranking = require("./default-ranking"),
  files = require("./files"),
  settings = require("./settings");

controller.deleteUser = function (uid, done) {
  database.delete(uid, done);
};

controller.getCalculationProperties = function (done) {
  async.waterfall(
    [
      async.apply(settings.getData),
      function (cachedSettings, next) {
        let result = Object.assign({}, cachedSettings);
        delete result.maxUsers;
        next(null, result);
      },
    ],
    done
  );
};

controller.getSettings = function (done) {
  async.waterfall(
    [
      async.apply(settings.getData),
      function (settings, callback) {
        callback(null, {
          maxUsers: settings.maxUsers,
        });
      },
    ],
    done
  );
};

controller.getTopUsers = function (done) {
  let templateData, rankMeta;

  async.waterfall(
    [
      function (next) {
        async.parallel(
          {
            settingsData: async.apply(settings.getData),
            userTemplate: async.apply(files.getUserTemplate),
          },
          next
        );
      },
      function (payload, next) {
        database.getUsers(
          payload.settingsData.maxUsers - 1,
          function (error, users) {
            if (error) {
              return next(error);
            }

            async.map(
              users,
              (user, callback) => {
                rankMeta = Ranking.compute(payload.settingsData, user.points);

                templateData = Object.assign(
                  {
                    progress:
                      (rankMeta.rankProgress / rankMeta.rankTotal) * 100,
                    rank: rankMeta.rank,
                    rankProgress: `${rankMeta.rankProgress} / ${rankMeta.rankTotal}`,
                    upgradeRequiredPoints:
                      rankMeta.rankTotal - rankMeta.rankProgress,
                    relative_path: nconf.get("relative_path"),
                  },
                  user
                );

                benchpress
                  .compileRender(payload.userTemplate, templateData)
                  .then(template => {
                    callback(null, template);
                  });
              },
              next
            );
          }
        );
      },
      (users, next) => next(null, { users }),
    ],
    done
  );
};

controller.injectSettings = function (response, done) {
  async.waterfall(
    [
      async.apply(settings.getData),
      function (settingsData, next) {
        response.pointsSettings = settingsData;
        next(null, response);
      },
    ],
    done
  );
};

controller.saveCalculationProperties = function (payload, done) {
  let scheme = [
    "postWeight",
    "topicWeight",
    "reputationWeight",
    "reputationActionWeight",
    "basePoints",
    "baseGrow",
    "baseSignInPoints",
  ];
  async.waterfall(
    [
      function composePayload(callback) {
        let result = {},
          value;
        scheme.forEach(function (field) {
          value = payload[field];
          if (payload.hasOwnProperty(field) && value) {
            result[field] = parseInt(value, 10);
          }
        });
        callback(null, result);
      },
      function save(data, callback) {
        settings.save(data, callback);
      },
    ],
    done
  );
};

controller.saveSettings = function (payload, done) {
  async.waterfall(
    [
      function validatePayload(callback) {
        let users = parseInt(payload.maxUsers);
        if (isNaN(users)) {
          return callback(new Error("Max Users is not a number."));
        }
        callback(null, users);
      },
      function save(users, callback) {
        settings.save(
          {
            maxUsers: users,
          },
          callback
        );
      },
    ],
    done
  );
};

/**
 * 获取用户的积分
 * @param {*} uid
 * @returns {Promise}
 */
controller.getUserPointsByUid = function (uid) {
  return new Promise((resolve, reject) => {
    database.getPoints(uid, (error, points) => {
      if (error) {
        return reject(error);
      }
      resolve(points);
    });
  });
};

/**
 * 查询用户积分日志列表
 * @param {stirng} uid 用户id
 * @param {number} page 当前页数
 * @param {number} resultsPerPage 每页多少条
 * @returns
 */
controller.getUserPointsLogsByUid = async function (
  uid,
  page = 1,
  resultsPerPage = 50
) {
  if (uid <= 0) {
    return {
      list: [],
      total: 0,
    };
  }
  return await database.getUserPointsLogsByUid(uid, page, resultsPerPage);
};

/**
 * 查询用户今日签到情况
 * @param {*} uid
 * @param {*} date
 * @returns {Promise<number>}
 */
controller.getUserSignInStatusByDate = async (uid, date = new Date()) => {
  if (!uid) {
    return Promise.reject("没有实际用户存在");
  }
  return await database.getUserSignInStatusByDate(uid, date);
};

controller.getUserSignInDates = async uid => {
  if (!uid) {
    return Promise.reject("没有实际用户存在");
  }
  return await database.getUserSignInDates(uid);
};

module.exports = controller;
