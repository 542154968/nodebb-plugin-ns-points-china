(function (Database) {
  "use strict";

  const async = require("async");

  const nodebb = require("./nodebb"),
    constants = require("./constants");

  const db = nodebb.db,
    user = nodebb.user;

  //FIXME Remove Points object if User is deleted or create utility method for ACP
  Database.delete = function (uid, done) {
    db.sortedSetRemove(constants.NAMESPACE, uid, done);
  };

  Database.getPoints = function (uid, done) {
    db.sortedSetScore(constants.NAMESPACE, uid, done);
  };

  Database.getUsers = function (limit, done) {
    async.waterfall(
      [
        async.apply(
          db.getSortedSetRevRangeWithScores,
          constants.NAMESPACE,
          0,
          limit
        ),
        function (scoredUsers, next) {
          var scores = {},
            ids = scoredUsers.map(function (scoredUser) {
              scores[scoredUser.value] = scoredUser.score;
              return scoredUser.value;
            });
          next(null, ids, scores);
        },
        function (uids, scoreMap, next) {
          user.getUsersFields(
            uids,
            ["picture", "username", "userslug"],
            function (error, users) {
              if (error) {
                return next(error);
              }

              next(
                null,
                users.map(function (user) {
                  user.points = scoreMap[user.uid] || 0;
                  return user;
                })
              );
            }
          );
        },
      ],
      done
    );
  };

  Database.incrementBy = function (uid, increment, done) {
    db.sortedSetIncrBy(constants.NAMESPACE, increment, uid, done);
  };

  /**
   *
   * @param {string} uid
   * @param {number} points
   * @param {number} countPoints
   * @param {'post' | 'topic' | 'unvote' | 'upvote'} from 来源
   */
  Database.addPointsChangeLog = (uid, points, countPoints, from) => {
    const logData = {
      // 时间
      timestamp: new Date().getTime(),
      // 用户id
      userId: uid,
      // 当前积分
      points,
      // 积分总数
      countPoints,
      // 增加还是减少
      action: points > 0 ? "increment" : "decrement",
      // 变动来源
      from,
    };
    const stringLogData = JSON.stringify(logData);

    /**
     * gpt 推荐这样分开存储
     * 优点
     * 高效查询：通过为每个用户创建独立的有序集合，可以快速查询特定用户的积分日志。
     * 灵活性：主有序集合可以用于全局查询，用户有序集合用于特定用户的查询。
     * 注意事项
     * 键名管理：确保 constants.LOG_NAMESPACE 和用户ID的组合键名唯一且易于管理。
     * 数据冗余：每个日志记录在主有序集合和用户有序集合中各存储一次，可能会增加存储开销，但提高了查询效率。
     */

    // 将日志记录到数据库或其他存储介质 作为总数据
    db.sortedSetAdd(
      constants.LOG_NAMESPACE,
      logData.timestamp,
      stringLogData,
      err => {
        if (err) {
          console.error("Error adding points change log:", err);
        }
      }
    );
    // 记录单个用户的日志变动数据
    db.sortedSetAdd(
      `${constants.LOG_NAMESPACE}:${uid}`,
      logData.timestamp,
      stringLogData,
      err => {
        if (err) {
          console.error("Error adding points change log:", err);
        }
      }
    );
  };
})(module.exports);
