import asyncHandler from "express-async-handler";
import MonitoringTools from "../models/monitoringToolsModel.js";
import Notification from "../models/alertNotificationModel.js";
import { io } from "../server.js";
import {
  getPublicID,
  isValidEmail,
  isValidPhoneNumber,
} from "../helpers/helpers.js";

/**
 * @description : get all Incoming Letter
 * @method : GET
 * @access : public
 * @route : '/api/v1/incoming'
 */
export const monitoringToolsAvailability = asyncHandler(async (req, res) => {
  try {
    const {
      sessionUserId,
      sessionUserName,
      tools,
      loginStatus,
      operationalStatus,
      forwardTo,
      needToDo,
    } = req.body;

    if (
      !sessionUserId ||
      !sessionUserName ||
      !tools ||
      tools.trim() === "" ||
      !loginStatus ||
      !operationalStatus
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find latest session for user
    let session = await MonitoringTools.findOne({ sessionUserId }).sort({
      createdAt: -1,
    });

    if (!session || session.sessionTools.length >= 8) {
      // create new session if none exists or last session has 8 tools
      session = await MonitoringTools.create({
        sessionUserId,
        sessionUserName,
        sessionTools: [],
      });
    }

    // Check if the tool already exists in the session
    const existingToolIndex = session.sessionTools.findIndex(
      (t) => t.tools === tools
    );

    if (existingToolIndex > -1) {
      // Update existing tool's loginStatus and operationalStatus
      session.sessionTools[existingToolIndex].loginStatus = loginStatus;
      session.sessionTools[existingToolIndex].operationalStatus =
        operationalStatus;
    } else {
      // Push new tool if it doesn't exist
      session.sessionTools.push({ tools, loginStatus, operationalStatus });
    }

    await session.save();

    // const toRoles = ["Level_2", "Admin"];
    for (let role of forwardTo) {
      const action = needToDo[role] || "no action assigned"; // get action for this role

      const notif = await Notification.create({
        fromRole: req.me?.role,
        toRoles: [role],
        message: `${req.me?.name} found the ${tools} tools Login Status : ${loginStatus} and Operational Status : ${operationalStatus}.You have to ${action}.`,
      });

      io.to(role).emit("newNotification", notif);
    }
    res.status(200).json({ success: true, tools: session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export const getMonitoringToolsAvailability = asyncHandler(async (req, res) => {
  try {
    const allTools = await MonitoringTools.find()
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(201).json({
      tools: allTools,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to save data",
      error: error.message,
    });
  }
});
