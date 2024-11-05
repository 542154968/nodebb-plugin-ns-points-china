"use strict";
const async = require("async");

const settings = require("./settings"),
  database = require("./database");
const action = {};

const debug = function (id, delta, total) {
  console.log(
    "User %d changed amount of points on %d, total: %d",
    id,
    delta,
    total
  );
};

const groupChange = function (users, done, from) {
  async.each(
    users,
    function (user, next) {
      incrementPoints(user.uid, user.points, from, next);
    },
    done
  );
};

/**
 *
 * @param {number} uid 用户id
 * @param {number} increment 增加的积分
 * @param {'post' | 'topic' | 'unvote' | 'upvote' | 'signIn'} from 来源
 * @param {()=>{}} [done] 回调函数
 * @returns
 */
const incrementPoints = function (uid, increment, from, done) {
  done = done || (() => undefined);
  if (uid <= 0) {
    done(null);
    return;
  }
  database.incrementBy(uid, increment, function (error, points) {
    if (error) {
      return done(error);
    }
    //TODO Today Statistics
    //debug(uid, increment, points);
    // try {
    //   sendNotification(
    //     uid,
    //     `您现在一共有${points}积分，太厉害了！`,
    //     "您的积分增加了！"
    //   );
    // } catch (error) {
    //   console.log("notify失败了", error);
    // }
    database.addPointsChangeLog(uid, increment, points, from);

    done(null);
  });
};

/**
 * Adding post
 * @param postData {object} Post with signature - { pid:3, uid:1, tid:'1', content:'text', timestamp:1429974406764, reputation:0, votes: 0, edited: 0, deleted: 0, cid:2 }
 */
action.postSave = function (postData) {
  // 说明是topic 不是post
  if (postData.post.isMain) {
    return;
  }

  const value = settings.get().postWeight;
  incrementPoints(postData.post.uid, value, "post");
};

/**
 * Removing of previous up-vote for the post
 * Reputation actions could be found in favourites.js, line 206
 * @param metadata {object} aggregated data -  { pid:'2', uid:1, owner:2, current:'unvote'}
 */
action.postUnvote = function (metadata) {
  //Handle unvotes only for upvotes
  if (metadata.current === "upvote") {
    groupChange(
      [
        { uid: metadata.owner, points: -settings.get().reputationWeight },
        { uid: metadata.uid, points: -settings.get().reputationActionWeight },
      ],
      function (error) {
        if (error) {
          console.error(error);
        }
      },
      "unvote"
    );
  }
};

action.postUpvote = function (metadata) {
  groupChange(
    [
      { uid: metadata.owner, points: settings.get().reputationWeight },
      { uid: metadata.uid, points: settings.get().reputationActionWeight },
    ],
    function (error) {
      if (error) {
        console.error(error);
      }
    },
    "upvote"
  );
};

/**
 *
 * @param topicData {object} Signature - { tid:2, uid:1, cid:'1', mainPid:0, title: 'text', slug:'text', timestamp: 429976183015, lastposttime:0, postcount:0, viewcount:0, locked:0, deleted:0, pinned:0 }
 */
action.topicSave = function (topicData) {
  let value = settings.get().topicWeight;
  incrementPoints(topicData.topic.uid, value, "topic");
};

/**
 * 签到
 * @param {*} uid
 * @returns
 */
action.signIn = async function (uid) {
  if (uid <= 0) {
    return Promise.reject("没有实际用户存在");
  }
  const signInData = await database.signIn(uid);
  let value = settings.get().baseSignInPoints;
  await incrementPoints(uid, value, "signIn");
  return signInData;
};

module.exports = action;
