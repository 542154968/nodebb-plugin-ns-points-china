"use strict";
const db = require.main.require("./src/database");
const notifications = require.main.require("./src/notifications");
const user = require.main.require("./src/user");

async function createNotification(uid, content = "", title = "提示") {
  const notification = {
    nid: "nodebb-plugin-points-notify:" + Date.now(), // 唯一的通知ID
    from: "system", // 发送者的用户ID
    to: [uid], // 接收者的用户ID数组
    bodyShort: title, // 短描述
    bodyLong: content, // 长描述
    type: "nodebb-plugin-points-notify", // 通知类型
  };
  console.log("开始创建notify");
  const notifyInstance = await notifications.create(notification);
  console.log("创建notify成功");
  return notifyInstance;
}

/**
 *
 * @param {number} uid
 * @param {string} [content] 默认是空字符串
 * @param {string} [title] 默认是提示
 */
async function sendNotification(uid, content, title) {
  const notification = await createNotification(uid, content, title);
  console.log("准备推送notify", notification);
  if (notification) {
    await notifications.push(notification, notification.to);
    console.log("推送notify 成功");
  }
}

module.exports = {
  sendNotification,
};
