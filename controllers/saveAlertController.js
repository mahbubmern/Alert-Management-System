import asyncHandler from "express-async-handler";

import Users from "../models/userModel.js";
import Alert from "../models/alertModel.js";
import Notification from "../models/alertNotificationModel.js";
import AlertSerial from "../models/alertSerialModel.js";
import bcrypt from "bcrypt";
import { fileDeleteFromCloud, fileUploadToCloud } from "../utils/cloudinary.js";
import {
  getPublicID,
  isValidEmail,
  isValidPhoneNumber,
} from "../helpers/helpers.js";
import { incomingFile } from "../utils/mullter.js";
// import {
//   createOrUpdateAndEmitNotification,
//   getTargetRolesForEscalation,
// } from "../helpers/notificationService.js";

/**
 * @description : create Event
 * @method : POST
 * @access : public
 * @route : '/api/v1/event'
 */
export const saveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. False Positive Case
  if (req.body.verdict === "false_positive") {
    const { verdict, fpNote } = req.body;

    const updatedAlert = await Alert.findByIdAndUpdate(
      id,
      {
        verdict,
        fpNote,
      },
      { new: true, runValidators: true }
    );

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    return res.status(200).json({ message: "Save Successfully" });
  }

  // 2. True Positive Without Escalation
if (req.body.verdict === "true_positive" && req.body.escalation === "no") {
  const { verdict, tpImpact, escalation, caseDetails, tpRemedationNote } =
    req.body;

  const existingAlert = await Alert.findById(id);
  if (!existingAlert) {
    return res.status(404).json({ message: "Alert not found" });
  }

  // ✅ Merge old evidence with new files
  const newFiles = req.files?.length ? req.files.map((file) => file.filename) : [];
  const mergedEvidence = [
    ...(existingAlert.uploadedEvidence || []),
    ...newFiles,
  ];

  const updatedAlert = await Alert.findByIdAndUpdate(
    id,
    {
      verdict,
      tpImpact,
      escalation,
      caseDetails,
      tpRemedationNote,
      uploadedEvidence: mergedEvidence, // ✅ use correct field name
    },
    { new: true, runValidators: true }
  );

  if (!updatedAlert) {
    res.status(404);
    throw new Error("Alert not found");
  }

  return res.status(200).json({ message: "Save Successfully", alert: updatedAlert });
}

  // 3. True Positive With Escalation (Initial Escalation Step)
  if (req.body.verdict === "true_positive" && req.body.escalation === "yes") {


    
    const {
      verdict,
      tpImpact,
      escalation,
      caseDetails,
      tpRemedationNote,
      escalationReason,
    } = req.body;

    const existingAlert = await Alert.findById(id);

  // ✅ Merge old evidence with new files
  const newFiles = req.files?.length ? req.files.map((file) => file.filename) : [];
  const mergedEvidence = [
    ...(existingAlert.uploadedEvidence || []),
    ...newFiles,
  ];

    const updatedAlert = await Alert.findByIdAndUpdate(
      id,
      {
        verdict,
        tpImpact,
        escalation,
        caseDetails,
        uploadedEvidence: mergedEvidence,
        tpRemedationNote,
        escalationReason,
      },
      { new: true, runValidators: true }
    );

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    return res.status(200).json({ message: "Data Saved Successfully" });
  }
});

// export const getAllAlert = asyncHandler(async (req, res) => {
//   const allAlert = await Alert.find()
//     .populate("author", "-password -accessToken")
//     .populate("assignedTo", "-password -accessToken");

//   //check Incoming Letter
//   if (allAlert.length === 0) {
//     return res.status(404).json();
//   }
//   res.status(200).json({ alert: allAlert });
// });

//update alert

// export const updateAlert = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const {
//     alertName,
//     eventTime,
//     alertSource,
//     severity,
//     affectedIpWebsite,
//     affectedUserDevice,
//     status,
//   } = req.body;

//   let updatedAlert;

//   // ✅ LEVEL 1 / ADMIN: Update main alert info
//   if (req.me?.role === "Level_1" || req.me?.role === "admin") {
//     updatedAlert = await Alert.findByIdAndUpdate(
//       id,
//       {
//         alertName,
//         eventTime,
//         alertSource,
//         severity,
//         affectedIpWebsite,
//         affectedUserDevice,
//         status,
//         $addToSet: { assignedTo: req.me._id },
//         acceptedTime: new Date(),
//         acceptedBy: req.me?._id,
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedAlert) {
//       res.status(404);
//       throw new Error("Alert not found");
//     }

//     // ✅ Send notification if status is closed
//     if (status === "closed") {
//       await createOrUpdateAndEmitNotification(req.io, {
//         title: "Alert Closed",
//         message: `${req.me?.name} Closed the alert named ${updatedAlert.alertName}`,
//         type: "Alert Closed",
//         createdBy: req.me?._id,
//         alertId: updatedAlert._id,
//         targetRoles: getTargetRolesForEscalation(
//           updatedAlert,
//           req.me,
//           "closeByL1"
//         ),
//       });
//     }
//   }

//   // ✅ LEVEL 2 / ADMIN: Assign escalation
//   if (req.me?.role === "Level_2" || req.me?.role === "admin") {
//     updatedAlert = await Alert.findByIdAndUpdate(
//       id,
//       {
//         $addToSet: { assignedTo: req.me._id }, // prevents duplicates
//         escalatedAlertReceiveTime: new Date(),
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedAlert) {
//       res.status(404);
//       throw new Error("Alert not found");
//     }

//     await createOrUpdateAndEmitNotification(req.io, {
//       title: "Alert Accepted",
//       message: `${req.me?.name} Accepted the alert ${updatedAlert.alertName}`,
//       type: "Alert Accepted",
//       createdBy: req.me?._id,
//       alertId: updatedAlert._id,
//     });
//   }

//   // ✅ Return response at the end
//   return res.status(200).json({ alert: updatedAlert });
// });

// //update investigation with verdict

// export const updateInvestigationAlert = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   // 1. False Positive Case
//   if (req.body.verdict === "false_positive") {
//     const { verdict, fpNote } = req.body;

//     if (!verdict || !fpNote) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const updatedAlert = await Alert.findByIdAndUpdate(
//       id,
//       {
//         verdict,
//         fpNote,
//         status: "closed",
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedAlert) {
//       res.status(404);
//       throw new Error("Alert not found");
//     }

//     // ✅ Emit notification for false positive closure
//     await createOrUpdateAndEmitNotification(req.io, {
//       title: "Alert Closed",
//       message: `${req.me?.name} closed alert ${updatedAlert.alertName} as False Positive`,
//       type: "Alert Closed",
//       createdBy: req.me?._id,
//       alertId: updatedAlert._id,
//       targetRoles: getTargetRolesForEscalation(updatedAlert, req.me),
//     });

//     return res.status(200).json({ alert: updatedAlert });
//   }

//   // 2. True Positive Without Escalation
//   if (req.body.verdict === "true_positive" && req.body.escalation === "no") {
//     const {
//       verdict,
//       tpImpact,
//       escalation,
//       caseDetails,

//       tpRemedationNote,
//     } = req.body;

//     if (
//       !verdict ||
//       !tpImpact ||
//       !caseDetails ||
//       !escalation ||
//       !tpRemedationNote
//     ) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const tpEvidenceFiles = req.files || [];
//     const uploadEvidence = tpEvidenceFiles.map((file) => file.filename);

//     const updatedAlert = await Alert.findByIdAndUpdate(
//       id,
//       {
//         verdict,
//         tpImpact,
//         escalation,
//         caseDetails,
//         uploadedEvidence: uploadEvidence,
//         tpRemedationNote,
//         status: "closed",
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedAlert) {
//       res.status(404);
//       throw new Error("Alert not found");
//     }

//     // ✅ Emit notification for TP closure without escalation
//     await createOrUpdateAndEmitNotification(req.io, {
//       title: "Alert Closed",
//       message: `${req.me?.name} closed alert ${updatedAlert.alertName} as True Positive`,
//       type: "Alert Closed",
//       createdBy: req.me?._id,
//       alertId: updatedAlert._id,
//       targetRoles: getTargetRolesForEscalation(updatedAlert, req.me),
//     });

//     return res.status(200).json({ alert: updatedAlert });
//   }

//   // 3. True Positive With Escalation (Initial Escalation Step)
//   if (
//     req.body.verdict === "true_positive" &&
//     req.body.escalation === "yes"
//     // && !req.body.communication?.trim()
//   ) {
//     const {
//       verdict,
//       tpImpact,
//       escalation,
//       caseDetails,
//       tpRemedationNote,
//       escalationReason,
//     } = req.body;

//     if (
//       !verdict ||
//       !tpImpact ||
//       !caseDetails ||
//       !escalation ||
//       !tpRemedationNote ||
//       !escalationReason
//     ) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const tpEvidenceFiles = req.files || [];
//     const uploadEvidence = tpEvidenceFiles.map((file) => file.filename);

//     const updatedAlert = await Alert.findByIdAndUpdate(
//       id,
//       {
//         verdict,
//         tpImpact,
//         escalation,
//         caseDetails,
//         uploadedEvidence: uploadEvidence,

//         tpRemedationNote,
//         escalationReason,
//         escalatedTime: new Date(),
//         status: "escalated",
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedAlert) {
//       res.status(404);
//       throw new Error("Alert not found");
//     }

//     // ✅ Emit/update notification
//     await createOrUpdateAndEmitNotification(req.io, {
//       title: "Alert Escalated",
//       message: `${req.me?.name} escalated alert ${updatedAlert.alertName}`,
//       type: "Alert Escalated",
//       createdBy: req.me?._id,
//       alertId: updatedAlert._id,
//       targetRoles: getTargetRolesForEscalation(updatedAlert, req.me, "default"),
//     });

//     return res.status(200).json({ alert: updatedAlert });
//   }
// });

// //update level 2 investigation alert section

export const save_Levle_2_Alert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const {
      infoValidationNotes,
      iocValidationNotes,
      investigationFindings,
      investigationToolsUsed,
      incidentDeclarationRequired,
    } = req.body;

    if (
      !incidentDeclarationRequired ||
      incidentDeclarationRequired === "Choose"
    ) {
      const updateFields = {
        infoValidationNotes,
        iocValidationNotes,
        investigationFindings,
        investigationToolsUsed,
      };

      const updatedAlert = await Alert.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
      });

      if (!updatedAlert) {
        res.status(404);
        throw new Error("Alert not found");
      }

      return res.status(200).json({ message: "Data Saved Successfully" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Failed to level 2 update alert",
      error: error.message,
    });
  }
});

export const save_Levle_3_Alert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const {
      irp,
      rootCause,
      l2RemediationPlan,
      l2RemediationExecutionLog,
      l2RemediationValidation,
      l2RemediationActionDoc,
      l2ResolutionTimestamp,
    } = req.body;

    const updateFields = { ...req.body };
    delete updateFields._id;

    const updatedAlert = await Alert.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    return res.status(200).json({ message: "Data Saved Successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to level 2 update alert",
      error: error.message,
    });
  }
});

// // indidence declaration update

// export const updateIncidenceDeclaration = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   try {
//     const { isIncidence } = req.body;

//     const updatedAlert = await Alert.findByIdAndUpdate(
//       id,
//       {
//         isIncidence,
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!updatedAlert) {
//       res.status(404);
//       throw new Error("Alert not found");
//     }

//     await createOrUpdateAndEmitNotification(req.io, {
//       title: "Incidence declared",
//       message: `${req.me?.name} declared this ${updatedAlert.alertName} Alert as Incidence`,
//       type: "Incidence declared",
//       createdBy: req.me?._id,
//       alertId: updatedAlert._id,
//       targetRoles: getTargetRolesForEscalation(
//         updatedAlert,
//         req.me,
//         "isIncidenceTrue"
//       ),
//     });

//     return res.status(200).json({ alert: updatedAlert });
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to level 2 update alert",
//       error: error.message,
//     });
//   }
// });

// // chatting Controller

// export const handleSocketChatMessage = async (data, io) => {
//   try {
//     const { alertId, messageData } = data;

//     const alert = await Alert.findById(alertId).populate("assignedTo");

//     if (!alert) {
//       console.warn("Alert not found for chat message:", alertId);
//       return;
//     }

//     alert.communicationLog.push({
//       name: messageData.name,
//       index: messageData.index,
//       role: messageData.role,
//       message: messageData.message,
//       msgTime: messageData.msgTime,
//     });

//     const otherUsers = alert.assignedTo
//       .filter((u) => u.role !== messageData.role)
//       .map((user) => user.role);

//     alert.unreadBy = [...alert.unreadBy, ...otherUsers];
//     // alert.unreadBy = [...new Set([...alert.unreadBy, ...otherUsers])];
//     await alert.save();

//     io.to(alertId).emit("receiveMessage", {
//       alertId,
//       message: messageData,
//       unreadBy: alert.unreadBy,
//     });
//   } catch (error) {
//     console.error("Error saving chat:", error);
//   }
// };

// // getting all chat
// export const getAllChatting = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const alert = await Alert.findById(id);

//   if (!alert) {
//     return res.status(404).json({ message: "Alert not found" });
//   }

//   res.json(alert.communicationLog);
// });

// // mark as read chatting

// export const markAsReadChat = asyncHandler(async (data, io) => {
//   const { alertId, userRole } = data;
//   const alert = await Alert.findById(alertId);
//   alert.unreadBy = alert.unreadBy.filter((u) => u !== userRole);

//   await alert.save();

//   io.to(alertId).emit("updateUnread", {
//     alertId,
//     unreadBy: alert.unreadBy,
//   });
// });

// // notification Controller

// export const handleSocketNotification = async (data, io) => {
//   try {
//     const { title, message, type, createdBy, alertId } = data;

//     const notification = await createOrUpdateAndEmitNotification(io, {
//       title,
//       message,
//       type,
//       createdBy,
//       alertId,
//     });

//     return notification;
//   } catch (error) {
//     console.error("🔔 Notification error:", error.message);
//     return null;
//   }
// };

// // get all notification

// export const getAllNotification = asyncHandler(async (req, res) => {
//   const allNotification = await Notification.find()
//     .sort({ createdAt: -1 }) // Sort by newest first
//     .limit(50);

//   //check Incoming Letter
//   if (allNotification.length === 0) {
//     return res.status(404).json();
//   }
//   res.status(200).json({ notification: allNotification });
// });

// // unread notification count

// export const unReadCountNotification = asyncHandler(async (req, res) => {
//   const count = await Notification.countDocuments({
//     read: false,
//   });
//   res.json({ unreadCount: count });
// });

// // mark read notification

// // unread notification count

// export const markReadNotification = asyncHandler(async (req, res) => {
//   await Notification.updateMany({ read: false }, { $set: { read: true } });
//   res.json({ success: true });
// });
