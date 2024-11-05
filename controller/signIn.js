"use strict";

const controller = require("../plugin/controller");
const action = require("../plugin/actions");

const signInConrtoller = {
  /**
   * 获取用户今日签到状态
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  async getUserSignInStatus(req, res, next) {
    const uid = req.uid;
    if (!uid) {
      next(new Error("[[error:invalid-login-credentials]]"));
      return;
    }
    const index = await controller.getUserSignInStatusByDate(uid);
    const dates = controller.getUserSignInDates();
    console.log(dates, "!!!");
    const isSignIn = index !== -1;
    res.json({
      isSignIn,
      index: isSignIn ? index + 1 : -1,
    });
  },

  async signIn(req, res, next) {
    const uid = req.uid;
    if (!uid) {
      next(new Error("[[error:invalid-login-credentials]]"));
      return;
    }
    let index = await controller.getUserSignInStatusByDate(uid);
    if (index === -1) {
      await action.signIn(uid);
      index = await controller.getUserSignInStatusByDate(uid);

      const isSignIn = index !== -1;
      res.json({
        isSignIn,
        index: isSignIn ? index + 1 : -1,
        status: true,
        msg: `签到成功，您今天是第${index + 1}名！`,
      });
    } else {
      res.json({
        index: index + 1,
        isSignIn: true,
        status: false,
        msg: "今日已经签到过了，请不要重复签到！",
      });
    }
  },
};

module.exports = signInConrtoller;
