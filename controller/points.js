"use strict";

const controller = require("../plugin/controller");
const pagination = require("../plugin/nodebb").pagination;
const { formatDate } = require("../plugin/utils");

const from2Text = {
  post: "回复",
  topic: "发表主题",
  unvote: "取消点赞",
  upvote: "点赞",
  signIn: "签到",
};

const pointsConrtoller = {
  /**
   * 渲染管理员积分页面
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  renderAdminPointsPage: (req, res, next) => {
    res.render("admin/plugins/points", {});
  },
  /**
   * 渲染用户积分排行榜
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  renderClientPoinstsOverviewPage: async (req, res, next) => {
    controller.getTopUsers(function (error, payload) {
      if (error) {
        return res.status(500).json(error);
      }
      res.render("points/overview", payload);
    });
  },
  /**
   * 渲染用户积分列表
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
  renderClientUserPointsPage: async (req, res, next) => {
    try {
      const { uid, page = 1 } = req.query;
      const resultsPerPage = 10;
      const numUid = Number(uid);
      if (numUid <= 0 || isNaN(numUid)) {
        next(new Error("[[error:invalid-url]]"));
      }
      const { total, list } = await controller.getUserPointsLogsByUid(
        numUid,
        page,
        resultsPerPage
      );
      res.render("points-log/user", {
        total,
        list: list.map((item, index) => {
          const { value } = item;
          const data = JSON.parse(value);
          return {
            ...data,
            points: data.points > 0 ? "+" + data.points : data.points,
            from: from2Text[data.from] || "未知",
            index: (page - 1) * resultsPerPage + index + 1,
            timestamp: formatDate(new Date(data.timestamp)),
          };
        }),
        pagination: pagination.create(page, Math.ceil(total / resultsPerPage), {
          uid,
        }),
      });
    } catch (error) {
      next(new Error("[[error:invalid-url]]"));
    }
  },
};

module.exports = pointsConrtoller;
