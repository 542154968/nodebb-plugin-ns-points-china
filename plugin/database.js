"use strict";

const async = require("async");

const nodebb = require("./nodebb"),
  constants = require("./constants"),
  { formatDate } = require("./utils");

const db = nodebb.db,
  user = nodebb.user;

const dataBase = {};

//FIXME Remove Points object if User is deleted or create utility method for ACP
dataBase.delete = function (uid, done) {
  db.sortedSetRemove(constants.NAMESPACE, uid, done);
};

dataBase.getPoints = function (uid, done) {
  db.sortedSetScore(constants.NAMESPACE, uid, done);
};

dataBase.getUsers = function (limit, done) {
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

dataBase.incrementBy = function (uid, increment, done) {
  db.sortedSetIncrBy(constants.NAMESPACE, increment, uid, done);
};

/**
 *
 * @param {string} uid
 * @param {number} points
 * @param {number} countPoints
 * @param {'post' | 'topic' | 'unvote' | 'upvote' | 'signIn'} from 来源
 */
dataBase.addPointsChangeLog = (uid, points, countPoints, from) => {
  const logData = {
    // 时间
    timestamp: new Date().getTime(),
    // 用户id
    userId: uid,
    // 当前变动的积分数量
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

/**
 * 查询用户积分日志列表
 * @param {stirng} uid 用户id
 * @param {number} page 当前页数
 * @param {number} resultsPerPage 每页多少条
 * @returns {Promise<{total: number, list: [ score: number, value: stirng ]}> }
 */
dataBase.getUserPointsLogsByUid = async (
  uid,
  page = 1,
  resultsPerPage = 50
) => {
  const start = (page - 1) * resultsPerPage;
  const stop = start + resultsPerPage - 1;
  const NAME_SPCAE = `${constants.LOG_NAMESPACE}:${uid}`;
  const [list = [], total = 0] = await Promise.all([
    db.getSortedSetRevRangeWithScores(NAME_SPCAE, start, stop),
    dataBase.countSet(NAME_SPCAE),
  ]);
  return {
    list,
    total,
  };
};

/**
 * 统计namesapce的数量
 *
 * 根据NodeBB/src/database/mongo/sorted/intersect.js中的countSets修改而来
 * @param {string} set 数据的名称在这里就是namespace
 * @param {number} limit 集合统计文档数量时的最大限制，默认25000
 * @returns {Promise<number>}
 */
dataBase.countSet = async (set, limit) => {
  const objects = db.client.collection("objects");
  const count = await objects.countDocuments(
    { _key: set },
    {
      limit: limit || 25000,
    }
  );
  return count;
};

/**
 * 查询用户今日签到情况
 * @param {*} uid
 * @param {*} date
 * @returns {Promise<number>}
 */
dataBase.getUserSignInStatusByDate = async (uid, date = new Date()) => {
  const NAME_SPCAE = `${constants.SIGN_IN_DATE_NAMESPACE}:${formatDate(
    date,
    "yyyyMMdd"
  )}`;

  // sortedSetRangeWithScores 获取集合
  // sortedSetScore 获取单个值
  const list = await db.getSortedSetRevRangeWithScores(NAME_SPCAE, -0, -1);
  // 倒序排列 获取顺位
  list.reverse();
  const index = list.findIndex(item => {
    try {
      const data = JSON.parse(item.value);
      return data.userId === uid;
    } catch (error) {
      return false;
    }
  });
  return index;
};

/**
 * 签到
 * @param {*} uid
 * @returns
 */
dataBase.signIn = async uid => {
  const date = new Date();
  const signInData = {
    // 时间
    timestamp: date.getTime(),
    // 用户id
    userId: uid,
  };
  const stringSignInData = JSON.stringify(signInData);
  await Promise.all([
    // 记录这天的签到用户
    db.sortedSetAdd(
      `${constants.SIGN_IN_DATE_NAMESPACE}:${formatDate(date, "yyyyMMdd")}`,
      signInData.timestamp,
      stringSignInData
    ),

    // 记录用户共签到了哪些
    db.sortedSetAdd(
      `${constants.SIGN_IN_USER_NAMESPACE}:${uid}`,
      signInData.timestamp,
      formatDate(date, "yyyy-MM-dd")
    ),
  ]);
};

/**
 * 查询用户签到日期列表
 * @param {*} uid
 * @returns
 */
dataBase.getUserSignInDates = async uid => {
  const NAME_SPCAE = `${constants.SIGN_IN_USER_NAMESPACE}:${uid}`;
  const list = await db.getSortedSetRevRangeWithScores(NAME_SPCAE, -0, -1);
  return list.map(item => item.value);
};

module.exports = dataBase;
