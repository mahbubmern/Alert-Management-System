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
import mongoose from "mongoose";

import { io } from "../server.js";

/**
 * @description : create Event
 * @method : POST
 * @access : public
 * @route : '/api/v1/event'
 */
export const createAlert = asyncHandler(async (req, res) => {
  try {
    const {
      eventTime,
      severity,
      alertName,
      alertSource,
      affectedIpWebsite,
      affectedUserDevice,
    } = req.body;

    if (
      !eventTime ||
      !alertName ||
      !severity ||
      !alertSource ||
      !affectedIpWebsite ||
      !affectedUserDevice
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Step 1: Generate today's date string
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(now.getDate()).padStart(2, "0")}`;

    // Step 2: Get or create AlertSerial record
    let serialRecord = await AlertSerial.findOne({ date: dateStr });
    if (!serialRecord) {
      serialRecord = await AlertSerial.create({ date: dateStr, serial: 1 });
    } else {
      serialRecord.serial += 1;
      await serialRecord.save();
    }

    // Step 3: Build Alert ID
    const serialFormatted = String(serialRecord.serial).padStart(7, "0");
    const alertId = `ALERT-${dateStr}-${serialFormatted}`;

    // Step 4: Create alert
    const newAlert = new Alert({
      alertId,
      eventTime,
      severity,
      alertName,
      alertSource,
      affectedIpWebsite,
      affectedUserDevice,
      author: req.me?._id, // assuming you're attaching the user
    });

    const savedAlert = await newAlert.save();

    res.status(201).json({
      message: "Alert created successfully",
      alert: savedAlert,
    });
  } catch (error) {
    console.error("❌ Alert creation error:", error);
    res.status(500).json({
      message: "Failed to create alert",
      error: error.message,
    });
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



export const getAllAlert = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  // 'view' decides which filter logic to apply
  const view = req.query.view || "all";
  const user = req.me;
  const userId = user._id;
  const userRole = user.role;
  const userBranch = user.branch; 

  // 1. Base Query Object
  let match = {};

  // --- VIEW LOGIC START (Kept exactly as original) ---
  if (view === "unassigned") {
    match.status = "unassigned";
  } else if (view === "self_assigned") {
    if (userRole === "Level_1") {
      match = { acceptedBy: userId, status: "open" };
    } else if (userRole === "Level_2") {
      match = {
        assignedTo: userId,
        $or: [
          { handBackToL1Assignee: { $ne: "yes" } },
          { handBackToL1Assignee: { $exists: false } },
        ],
      };
    } else if (["Admin", "SOC Manager", "CISO"].includes(userRole)) {
      match = {
        $or: [
          { acceptedBy: userId },
          {
            status: "escalated",
            $or: [
              { investigationFindings: { $exists: false } },
              { rootCause: { $exists: false } },
            ],
          },
          { status: "open", "assignedTo.0": { $exists: true } },
        ],
      };
    }
  } else if (view === "follow_up") {
    const hasInvestigation = {
      investigationToolsUsed: { $exists: true, $ne: "" },
      investigationFindings: { $exists: true, $ne: "" },
    };

    if (userRole === "Level_1") {
      match = {
        $or: [
          { author: userId, status: "escalated" },
          { assignedTo: userId, status: "escalated", ...hasInvestigation },
          { handBackToL1Assignee: "yes", status: { $ne: "closed" } },
          {
            L2verdict: "true_positive",
            verdict: "true_positive",
            handBackToL1Assignee: "yes",
            status: { $ne: "closed" },
          },
        ],
      };
    } else if (userRole === "Level_2") {
      match = {
        status: "escalated",
        ...hasInvestigation,
        $or: [
          { author: userId },
          { handBackToL1Assignee: "yes" },
          { assignedTo: userId },
        ],
      };
    } else {
      match = {
        status: "escalated",
        assignedTo: { $exists: true, $not: { $size: 0 } },
      };
    }
  } else if (view === "archive") {
    const SECURITY_BRANCH = "99341-Information Security, IT Risk Management & Fraud Control Division";
    if (userBranch === SECURITY_BRANCH) {
      match = { status: "closed" };
    } else {
      match = {
        assignedTo: userId,
        "escalationToOtherUsersRole.toRoles": userRole,
        fieldsToFill: {
          $elemMatch: {
            role: userRole,
            $or: [
              { isPerformed: "performed" },
              { comments: { $exists: true, $ne: "" } }
            ]
          }
        }
      };
    }
  }
  // --- VIEW LOGIC END ---

  // 2. Build the FINAL Match Object
  const finalMatch = { $and: [match] };

  // 3. Add Search Logic (If search exists)
  if (search) {
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isObjectId = mongoose.Types.ObjectId.isValid(search);
    const searchConditions = [
      { alertName: { $regex: searchSafe, $options: "i" } },
      { alertId: { $regex: searchSafe, $options: "i" } },
      { alertSource: { $regex: searchSafe, $options: "i" } },
      { severity: { $regex: searchSafe, $options: "i" } },
      { status: { $regex: searchSafe, $options: "i" } },
      { author: { $regex: searchSafe, $options: "i" } },
      { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
      { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
    ];
    if (isObjectId) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }
    finalMatch.$and.push({ $or: searchConditions });
  }

  // 4. Execution
  const [result] = await Alert.aggregate([
    { $match: finalMatch }, // Applies Permissions & View Logic
    {
      $facet: {
        // --- 1. Main List (Pagination Preserved) ---
        items: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "assignedTo",
            },
          },
          {
            $project: {
              "author.password": 0,
              "author.accessToken": 0,
              "assignedTo.password": 0,
              "assignedTo.accessToken": 0,
            },
          },
        ],
        
        // --- 2. Meta Data (Total Count Preserved) ---
        meta: [{ $count: "totalAlerts" }],

        // --- 3. Statistics (NEW: For Count Cards) ---
        statistics: [
          {
            $group: {
              _id: null,
              totalOpen: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
              totalClosed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
              totalEscalated: { $sum: { $cond: [{ $eq: ["$status", "escalated"] }, 1, 0] } },
              totalIncidence: { $sum: { $cond: [{ $eq: ["$isIncidence", "yes"] }, 1, 0] } }
            }
          }
        ],

        // --- 4. User Wise Alert Stats (NEW: For User Table) ---
        userWiseStats: [
          // A. Filter only Not-Closed alerts
          { $match: { status: { $ne: "closed" } } },

          // B. Combine Author and Assignees into a single list of IDs
          {
            $project: {
              originalDoc: "$$ROOT", 
              involvedUsers: {
                $setUnion: [
                  [{ $ifNull: ["$author", null] }], // Wrap single author in array
                  { $ifNull: ["$assignedTo", []] }  // Assignees is already array
                ]
              }
            }
          },

          // C. Unwind so we have 1 document per User-Alert connection
          { $unwind: "$involvedUsers" },

          // D. Group by User ID to count their alerts
          {
            $group: {
              _id: "$involvedUsers",
              alertCount: { $sum: 1 },
              // Push the alert doc so you can view it in the popup
              alert: { $push: "$originalDoc" } 
            }
          },

          // E. Lookup User Details (Name, Role, Index) for the Table Row
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "userDetails"
            }
          },
          { $unwind: "$userDetails" },

          // F. Format for Frontend
          {
            $project: {
              userId: "$_id",
              name: "$userDetails.name",
              index: "$userDetails.index",
              role: "$userDetails.role",
              alertCount: 1,
              alert: 1 
            }
          }
        ]
      },
    },
    {
      $project: {
        items: 1,
        totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
        stats: { $ifNull: [{ $arrayElemAt: ["$statistics", 0] }, {}] },
        userWiseStats: "$userWiseStats" 
      },
    },
  ]);

  const totalAlerts = result?.totalAlerts ?? 0;
  const totalPages = Math.ceil(totalAlerts / limit);
  const stats = result?.stats || {};

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      userWiseStats: result?.userWiseStats || [], // Used for your user table
      counts: {                                   // Used for your top cards
        open: stats.totalOpen || 0,
        closed: stats.totalClosed || 0,
        escalated: stats.totalEscalated || 0,
        incidence: stats.totalIncidence || 0,
      },
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

// export const getAllAlert = asyncHandler(async (req, res) => {
//   const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//   const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
//   const skip = (page - 1) * limit;
//   const search = (req.query.search || "").trim();

//   // 'view' decides which filter logic to apply
//   const view = req.query.view || "all";
//   const user = req.me;
//   const userId = user._id;
//   const userRole = user.role;
//   const userBranch = user.branch; // Needed for Archive logic

//   // 1. Base Query Object
//   let match = {};

//   // --- VIEW LOGIC START ---

//   if (view === "unassigned") {
//     match.status = "unassigned";
//   } 
  
//   else if (view === "self_assigned") {
//     if (userRole === "Level_1") {
//       match = { acceptedBy: userId, status: "open" };
//     } else if (userRole === "Level_2") {
//       match = {
//         assignedTo: userId,
//         $or: [
//           { handBackToL1Assignee: { $ne: "yes" } },
//           { handBackToL1Assignee: { $exists: false } },
//         ],
//       };
//     } else if (["Admin", "SOC Manager", "CISO"].includes(userRole)) {
//       match = {
//         $or: [
//           { acceptedBy: userId },
//           {
//             status: "escalated",
//             $or: [
//               { investigationFindings: { $exists: false } },
//               { rootCause: { $exists: false } },
//             ],
//           },
//           { status: "open", "assignedTo.0": { $exists: true } },
//         ],
//       };
//     }
//   } 
  
//   else if (view === "follow_up") {
//     const hasInvestigation = {
//       investigationToolsUsed: { $exists: true, $ne: "" },
//       investigationFindings: { $exists: true, $ne: "" },
//     };

//     if (userRole === "Level_1") {
//       match = {
//         $or: [
//           { author: userId, status: "escalated" },
//           { assignedTo: userId, status: "escalated", ...hasInvestigation },
//           { handBackToL1Assignee: "yes", status: { $ne: "closed" } },
//           {
//             L2verdict: "true_positive",
//             verdict: "true_positive",
//             handBackToL1Assignee: "yes",
//             status: { $ne: "closed" },
//           },
//         ],
//       };
//     } else if (userRole === "Level_2") {
//       match = {
//         status: "escalated",
//         ...hasInvestigation,
//         $or: [
//           { author: userId },
//           { handBackToL1Assignee: "yes" },
//           { assignedTo: userId },
//         ],
//       };
//     } else {
//       match = {
//         status: "escalated",
//         assignedTo: { $exists: true, $not: { $size: 0 } },
//       };
//     }
//   }

//   // ✅ NEW: ARCHIVE VIEW LOGIC (Translated from useEffect)
//   else if (view === "archive") {
//     const SECURITY_BRANCH = "99341-Information Security, IT Risk Management & Fraud Control Division";

//     if (userBranch === SECURITY_BRANCH) {
//       // Logic: For this branch: only closed alerts
//       match = { status: "closed" };
//     } else {
//       // Logic: 
//       // 1. user must be in assignedTo array
//       // 2. user's role must be in escalationToOtherUsersRole
//       // 3. user must have performed action OR commented in fieldsToFill
//       match = {
//         assignedTo: userId, 
//         "escalationToOtherUsersRole.toRoles": userRole,
//         fieldsToFill: {
//           $elemMatch: {
//             role: userRole,
//             $or: [
//               { isPerformed: "performed" },
//               { comments: { $exists: true, $ne: "" } }
//             ]
//           }
//         }
//       };
//     }
//   }

//   // --- VIEW LOGIC END ---

//   // 2. Build the FINAL Match Object
//   // We use $and to combine the "View Logic" with the "Search Logic"
//   const finalMatch = { $and: [match] };

//   // 3. Add Search Logic (If search exists)
//   if (search) {
//     const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//     // Check if search term looks like an ObjectId (for searching by ID directly)
//     const isObjectId = mongoose.Types.ObjectId.isValid(search);

//     const searchConditions = [
//       { alertName: { $regex: searchSafe, $options: "i" } },
//       { alertId: { $regex: searchSafe, $options: "i" } },
//       { alertSource: { $regex: searchSafe, $options: "i" } },
//       { severity: { $regex: searchSafe, $options: "i" } },
//       { status: { $regex: searchSafe, $options: "i" } },
//       { author: { $regex: searchSafe, $options: "i" } },
//       { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
//       { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
//     ];

//     // If it's a valid ID, add exact ID match to the search
//     if (isObjectId) {
//       searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
//     }

//     // Add the OR search to the AND array
//     finalMatch.$and.push({ $or: searchConditions });
//   }

//   // // 4. Execution
//   // const [result] = await Alert.aggregate([
//   //   { $match: finalMatch }, // Applies both View Logic AND Search Logic
//   //   {
//   //     $facet: {
//   //       items: [
//   //         { $sort: { createdAt: -1 } },
//   //         { $skip: skip },
//   //         { $limit: limit },
//   //         {
//   //           $lookup: {
//   //             from: "users",
//   //             localField: "author",
//   //             foreignField: "_id",
//   //             as: "author",
//   //           },
//   //         },
//   //         { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
//   //         {
//   //           $lookup: {
//   //             from: "users",
//   //             localField: "assignedTo",
//   //             foreignField: "_id",
//   //             as: "assignedTo",
//   //           },
//   //         },
//   //         {
//   //           $project: {
//   //             "author.password": 0,
//   //             "author.accessToken": 0,
//   //             "assignedTo.password": 0,
//   //             "assignedTo.accessToken": 0,
//   //           },
//   //         },
//   //       ],
//   //       meta: [{ $count: "totalAlerts" }],
//   //     },
//   //   },
//   //   {
//   //     $project: {
//   //       items: 1,
//   //       totalAlerts: {
//   //         $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0],
//   //       },
//   //     },
//   //   },
//   // ]);

//   // const totalAlerts = result?.totalAlerts ?? 0;
//   // const totalPages = Math.ceil(totalAlerts / limit);

//   // return res.status(200).json({
//   //   success: true,
//   //   data: {
//   //     alerts: result?.items || [],
//   //     pagination: {
//   //       totalAlerts,
//   //       totalPages,
//   //       currentPage: page,
//   //       hasNext: page < totalPages,
//   //       hasPrev: page > 1,
//   //     },
//   //   },
//   // });
//   // 4. Execution
//   const [result] = await Alert.aggregate([
//     { $match: finalMatch }, // Applies User permissions & View logic
//     {
//       $facet: {
//         // 1. Your existing pagination logic
//         items: [
//           { $sort: { createdAt: -1 } },
//           { $skip: skip },
//           { $limit: limit },
//           // ... (Your existing lookups and projects) ...
//           {
//             $lookup: {
//               from: "users",
//               localField: "author",
//               foreignField: "_id",
//               as: "author",
//             },
//           },
//           { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
//           {
//             $lookup: {
//               from: "users",
//               localField: "assignedTo",
//               foreignField: "_id",
//               as: "assignedTo",
//             },
//           },
//           {
//             $project: {
//               "author.password": 0,
//               "author.accessToken": 0,
//               "assignedTo.password": 0,
//               "assignedTo.accessToken": 0,
//             },
//           },
//         ],
//         // 2. Your existing total count
//         meta: [{ $count: "totalAlerts" }],

//         // 3. ✅ NEW: Statistics Count (Counts independent of pagination)
//         statistics: [
//           {
//             $group: {
//               _id: null,
//               totalOpen: { 
//                 $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } 
//               },
//               totalClosed: { 
//                 $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } 
//               },
//               totalEscalated: { 
//                 $sum: { $cond: [{ $eq: ["$status", "escalated"] }, 1, 0] } 
//               },
//               totalIncidence: { 
//                 $sum: { $cond: [{ $eq: ["$isIncidence", "yes"] }, 1, 0] } 
//               }
//             }
//           }
//         ]
//       },
//     },
//     {
//       $project: {
//         items: 1,
//         totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
//         stats: { $ifNull: [{ $arrayElemAt: ["$statistics", 0] }, {}] } // Unwind stats
//       },
//     },
//   ]);

//   const totalAlerts = result?.totalAlerts ?? 0;
//   const totalPages = Math.ceil(totalAlerts / limit);
  
//   // Extract stats with default values (0)
//   const stats = result?.stats || {};

//   return res.status(200).json({
//     success: true,
//     data: {
//       alerts: result?.items || [],
//       // ✅ Send the stats to the frontend
//       counts: {
//         open: stats.totalOpen || 0,
//         closed: stats.totalClosed || 0,
//         escalated: stats.totalEscalated || 0,
//         incidence: stats.totalIncidence || 0,
//       },
//       pagination: {
//         totalAlerts,
//         totalPages,
//         currentPage: page,
//         hasNext: page < totalPages,
//         hasPrev: page > 1,
//       },
//     },
//   });
// });

export const getEscalatedAlerts = asyncHandler(async (req, res) => {
  // 1. Pagination & Search Setup
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  // 2. Initial Filter: Only Escalated Alerts
  // We start with this because it's indexed and reduces the dataset immediately.
  const baseMatch = { 
    status: "escalated" 
  };

  // 3. Search Logic
  // We apply search BEFORE the lookup to make it faster.
  if (search) {
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { alertName: { $regex: searchSafe, $options: "i" } },
      { alertId: { $regex: searchSafe, $options: "i" } },
      { alertSource: { $regex: searchSafe, $options: "i" } },
      { severity: { $regex: searchSafe, $options: "i" } },
      { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
      { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }
    
    // Combine status filter with search filter
    baseMatch.$or = searchConditions;
  }

  // 4. Aggregation Pipeline
  const [result] = await Alert.aggregate([
    // STAGE A: Filter by Status & Search Keyword
    { $match: baseMatch },

    // STAGE B: Filter by "No Level_2 Assigned"
    // We need to look inside the 'assignedTo' array to check user roles.
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedUsersTemp", // Temporary field for filtering
      },
    },
    {
      $match: {
        // Logic: "assignedUsersTemp.role" creates an array of roles.
        // { $ne: "Level_2" } ensures NO element in that array is "Level_2".
        "assignedUsersTemp.role": { $ne: "Level_2" },
      },
    },

    // STAGE C: Pagination & Formatting (Facet)
    {
      $facet: {
        items: [
          { $sort: { createdAt: -1 } }, // Ensure index exists on createdAt
          { $skip: skip },
          { $limit: limit },
          
          // Clean up the temp field we made
          { $project: { assignedUsersTemp: 0 } },

          // Now perform the ACTUAL lookups for the frontend display
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "assignedTo",
            },
          },
          // Final Projection to sanitize data
          {
            $project: {
              "author.password": 0,
              "author.accessToken": 0,
              "assignedTo.password": 0,
              "assignedTo.accessToken": 0,
            },
          },
        ],
        meta: [{ $count: "totalAlerts" }],
      },
    },
    
    // STAGE D: Result Unwrapping
    {
      $project: {
        items: 1,
        totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
      },
    },
  ]);

  const totalAlerts = result?.totalAlerts ?? 0;
  const totalPages = Math.ceil(totalAlerts / limit);

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});



export const getIncidenceAlerts = asyncHandler(async (req, res) => {
  // 1. Pagination & Search Setup
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  const userId = req.me?._id;
  
  if (!userId) {
     return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Base Filter Logic (Replicating your useEffect)
  // Logic: incidentDeclarationRequired === "yes" AND isIncidence === "yes" AND status === "closed"
  const baseMatch = {
    incidentDeclarationRequired: "yes",
    isIncidence: "yes",
    status: "closed",
  };

  // 3. Search Logic (Optional but recommended)
  if (search) {
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { alertName: { $regex: searchSafe, $options: "i" } },
      { alertId: { $regex: searchSafe, $options: "i" } },
      { alertSource: { $regex: searchSafe, $options: "i" } },
      { severity: { $regex: searchSafe, $options: "i" } },
      { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
      { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }

    baseMatch.$or = searchConditions;
  }

  // 4. Aggregation Pipeline
  const [result] = await Alert.aggregate([
    // STAGE A: Filter first (This is the most critical step for speed)
    { $match: baseMatch },

    // STAGE B: Sort, Skip, Limit, and Lookup (Facet)
    {
      $facet: {
        items: [
          { $sort: { createdAt: -1 } }, // Ensure 'createdAt' is indexed
          { $skip: skip },
          { $limit: limit },
          
          // Join Author Details
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          
          // Join AssignedTo Details
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "assignedTo",
            },
          },
          
          // Project only necessary fields
          {
            $project: {
              "author.password": 0,
              "author.accessToken": 0,
              "assignedTo.password": 0,
              "assignedTo.accessToken": 0,
            },
          },
        ],
        // Count total matching documents for pagination
        meta: [{ $count: "totalAlerts" }],
      },
    },

    // STAGE C: Result Formatting
    {
      $project: {
        items: 1,
        totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
      },
    },
  ]);

  const totalAlerts = result?.totalAlerts ?? 0;
  const totalPages = Math.ceil(totalAlerts / limit);

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});



// export const getPendingAlerts = asyncHandler(async (req, res) => {
//   // 1. Pagination & Search Setup
//   const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//   const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
//   const skip = (page - 1) * limit;
//   const search = (req.query.search || "").trim();

//   // Ensure user is authenticated
//   if (!req.me?._id) {
//      return res.status(401).json({ message: "Unauthorized" });
//   }

//   // 2. Base Filter Logic (Replicating your useEffect)
//   // Logic: incidentDeclarationRequired === "yes" AND isIncidence === "pending"
//   const baseMatch = {
//     incidentDeclarationRequired: "yes",
//     isIncidence: "pending",
//   };

//   // 3. Search Logic
//   if (search) {
//     const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     const searchConditions = [
//       { alertName: { $regex: searchSafe, $options: "i" } },
//       { alertId: { $regex: searchSafe, $options: "i" } },
//       { alertSource: { $regex: searchSafe, $options: "i" } },
//       { severity: { $regex: searchSafe, $options: "i" } },
//       { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
//       { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
//     ];

//     if (mongoose.Types.ObjectId.isValid(search)) {
//       searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
//     }

//     // Combine strict filters with search text
//     baseMatch.$or = searchConditions;
//   }

//   // 4. Aggregation Pipeline
//   const [result] = await Alert.aggregate([
//     // STAGE A: Filter (Fastest operation first)
//     { $match: baseMatch },

//     // STAGE B: Facet (Parallel execution for Data + Count)
//     {
//       $facet: {
//         items: [
//           { $sort: { createdAt: -1 } }, // Needs Index
//           { $skip: skip },
//           { $limit: limit },
          
//           // Join Author Details
//           {
//             $lookup: {
//               from: "users",
//               localField: "author",
//               foreignField: "_id",
//               as: "author",
//             },
//           },
//           { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          
//           // Join AssignedTo Details
//           {
//             $lookup: {
//               from: "users",
//               localField: "assignedTo",
//               foreignField: "_id",
//               as: "assignedTo",
//             },
//           },
          
//           // Project (Clean up payload)
//           {
//             $project: {
//               "author.password": 0,
//               "author.accessToken": 0,
//               "assignedTo.password": 0,
//               "assignedTo.accessToken": 0,
//             },
//           },
//         ],
//         // Count total matching documents
//         meta: [{ $count: "totalAlerts" }],
//       },
//     },

//     // STAGE C: Unwrap Result
//     {
//       $project: {
//         items: 1,
//         totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
//       },
//     },
//   ]);

//   const totalAlerts = result?.totalAlerts ?? 0;
//   const totalPages = Math.ceil(totalAlerts / limit);

//   return res.status(200).json({
//     success: true,
//     data: {
//       alerts: result?.items || [],
//       pagination: {
//         totalAlerts,
//         totalPages,
//         currentPage: page,
//         hasNext: page < totalPages,
//         hasPrev: page > 1,
//       },
//     },
//   });
// });





export const getPendingAlerts = asyncHandler(async (req, res) => {
  // 1. Pagination & Search Setup
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  // Ensure user is authenticated
  if (!req.me?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userRole = req.me.role;
  const isPrivileged = ["Admin", "SOC Manager", "CISO"].includes(userRole);

  // 2. Base Filter (Modified to accept BOTH 'pending' and 'yes')
  const initialMatch = {
    // ✅ UPDATE: Use $in to match either "pending" OR "yes"
    isIncidence: { $in: ["pending", "yes", "no"] },
    
    // Optional: If you want to make this dynamic via URL (e.g. ?status=yes), use this instead:
    // isIncidence: req.query.status ? req.query.status : { $in: ["pending", "yes"] },
  };

  // 3. Search Logic
  if (search) {
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { alertName: { $regex: searchSafe, $options: "i" } },
      { alertId: { $regex: searchSafe, $options: "i" } },
      { alertSource: { $regex: searchSafe, $options: "i" } },
      { severity: { $regex: searchSafe, $options: "i" } },
      { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
      { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }
    initialMatch.$or = searchConditions;
  }

  // 4. Role-Based Filter Stage (Replicating useEffect)
  let roleBasedFilterStage = {};

  if (isPrivileged) {
    // LOGIC: Check if ANY 'fieldsToFill.role' is MISSING from 'currentAssignedRoles'
    roleBasedFilterStage = {
      $expr: {
        $gt: [
          { 
            $size: { 
              $setDifference: [
                { $ifNull: ["$fieldsToFill.role", []] }, 
                "$currentAssignedRoles"
              ] 
            } 
          },
          0
        ]
      }
    };
  } else {
    // LOGIC: Escalated to ME AND NOT assigned to ME
    roleBasedFilterStage = {
      $and: [
        { "escalationToOtherUsersRole.toRoles": userRole },
        { 
          currentAssignedRoles: { $ne: userRole } 
        }
      ]
    };
  }

  // 5. Aggregation Pipeline
  const [result] = await Alert.aggregate([
    // STAGE A: Fast Filter (Now includes pending + yes)
    { $match: initialMatch },

    // STAGE B: Lookup Assigned Users
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        pipeline: [{ $project: { role: 1 } }], 
        as: "assignedUsersData",
      },
    },

    // STAGE C: Flatten Assigned Roles
    {
      $addFields: {
        currentAssignedRoles: {
          $map: {
            input: "$assignedUsersData",
            as: "user",
            in: "$$user.role",
          },
        },
      },
    },

    // STAGE D: Apply Role Logic
    { $match: roleBasedFilterStage },

    // STAGE E: Sort (Newest First)
    { $sort: { createdAt: -1 } },

    // STAGE F: Facet (Pagination)
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },

          // Join Author
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },

          // Join AssignedTo
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "assignedTo",
            },
          },

          // Cleanup
          {
            $project: {
              "author.password": 0,
              "author.accessToken": 0,
              "assignedTo.password": 0,
              "assignedTo.accessToken": 0,
              assignedUsersData: 0,
              currentAssignedRoles: 0,
            },
          },
        ],
        meta: [{ $count: "totalAlerts" }],
      },
    },

    // STAGE G: Unwrap
    {
      $project: {
        items: 1,
        totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
      },
    },
  ]);

  const totalAlerts = result?.totalAlerts ?? 0;
  const totalPages = Math.ceil(totalAlerts / limit);

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});





export const getEscalationPendingAlerts = asyncHandler(async (req, res) => {
  // 1. Setup
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  const user = req.me;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const userRole = user.role;
  const isAdminOrManager = ["Admin", "SOC Manager", "CISO"].includes(userRole);

  // 2. Build the Logic Pipeline
  const pipeline = [];

  // STAGE A: Preliminary Filter & Search (Reduce dataset ASAP)
  // We only care about alerts that actually HAVE escalation fields or fields to fill
  const initialMatch = {
    $or: [
      { fieldsToFill: { $exists: true, $not: { $size: 0 } } },
      { escalationToOtherUsersRole: { $exists: true, $not: { $size: 0 } } },
    ],
  };

  if (search) {
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { alertName: { $regex: searchSafe, $options: "i" } },
      { alertId: { $regex: searchSafe, $options: "i" } },
      { alertSource: { $regex: searchSafe, $options: "i" } },
      { severity: { $regex: searchSafe, $options: "i" } },
      { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
      { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
    ];
    if (mongoose.Types.ObjectId.isValid(search)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }
    initialMatch.$and = [{ $or: searchConditions }];
  }

  pipeline.push({ $match: initialMatch });

  // STAGE B: Join with Users to get "Assigned Roles"
  // We need to know the roles of the people currently assigned to the alert
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "assignedTo",
      foreignField: "_id",
      as: "assignedUsersDetails",
    },
  });

  // STAGE C: Project Helper Fields for Logic
  // Convert complex arrays into simple arrays of strings for comparison
  pipeline.push({
    $addFields: {
      // Extract just the roles: ["Level_1", "Network Admin"]
      currentAssignedRoles: {
        $map: { input: "$assignedUsersDetails", as: "u", in: "$$u.role" },
      },
      // Extract required roles: ["Network Admin", "System Admin"]
      requiredRoles: {
        $map: { input: "$fieldsToFill", as: "f", in: "$$f.role" },
      },
      // Flatten the escalation roles logic
      escalationTargetRoles: {
        $reduce: {
          input: "$escalationToOtherUsersRole",
          initialValue: [],
          in: { $concatArrays: ["$$value", "$$this.toRoles"] },
        },
      },
    },
  });

  // STAGE D: THE CORE FILTER LOGIC (Replicating your useEffect)
  let logicMatch = {};

  if (isAdminOrManager) {
    // ADMIN LOGIC:
    // "Check: Are ALL fieldsToFill roles present in assignedRole?"
    // If NOT all matched, we keep it.
    // MongoDB Translation: If (RequiredRoles - CurrentRoles) is NOT empty, keep it.
    logicMatch = {
      $expr: {
        $gt: [
          { $size: { $setDifference: ["$requiredRoles", "$currentAssignedRoles"] } },
          0,
        ],
      },
    };
  } else {
    // REGULAR USER LOGIC:
    // 1. User's role must be in 'escalationToOtherUsersRole'
    // 2. User's role must NOT be in 'assignedRoles' (alreadyAssignedRole check)
    logicMatch = {
      $expr: {
        $and: [
          // 1. My role IS requested
          { $in: [userRole, "$escalationTargetRoles"] },
          // 2. My role is NOT already assigned
          { $not: { $in: [userRole, "$currentAssignedRoles"] } },
        ],
      },
    };
  }

  pipeline.push({ $match: logicMatch });

  // STAGE E: Facet for Pagination (Standard)
  pipeline.push({
    $facet: {
      items: [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Clean up temp fields
        {
          $project: {
            assignedUsersDetails: 0,
            currentAssignedRoles: 0,
            requiredRoles: 0,
            escalationTargetRoles: 0,
          },
        },
        // Populate standard fields for display
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignedTo",
          },
        },
        {
          $project: {
            "author.password": 0,
            "author.accessToken": 0,
            "assignedTo.password": 0,
            "assignedTo.accessToken": 0,
          },
        },
      ],
      meta: [{ $count: "totalAlerts" }],
    },
  });

  // Execute
  const [result] = await Alert.aggregate(pipeline);

  const totalAlerts = result?.meta[0]?.totalAlerts ?? 0;
  const totalPages = Math.ceil(totalAlerts / limit);

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});



export const getIncidencePendingAlerts = asyncHandler(async (req, res) => {
  // 1. Pagination & Search Setup
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  // Ensure user is authenticated
  if (!req.me?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Exact Match Logic (Strictly from your useEffect)
  // Logic: incidentDeclarationRequired === "yes" && isIncidence === "pending"
  const matchConditions = {
    incidentDeclarationRequired: "yes",
    isIncidence: "pending",
  };

  // 3. Search Logic
  if (search) {
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { alertName: { $regex: searchSafe, $options: "i" } },
      { alertId: { $regex: searchSafe, $options: "i" } },
      { alertSource: { $regex: searchSafe, $options: "i" } },
      { severity: { $regex: searchSafe, $options: "i" } },
      { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
      { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }
    
    // Combine strict filters with search (AND logic)
    matchConditions.$or = searchConditions;
  }

  // 4. Aggregation Pipeline
  const [result] = await Alert.aggregate([
    // STAGE A: Filter (Match exact logic + Search)
    { $match: matchConditions },

    // STAGE B: Sort (Newest first)
    { $sort: { createdAt: -1 } },

    // STAGE C: Facet (Pagination & Data Fetching)
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },

          // Join Author Details
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },

          // Join AssignedTo Details
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "assignedTo",
            },
          },

          // Cleanup Sensitive Data
          {
            $project: {
              "author.password": 0,
              "author.accessToken": 0,
              "assignedTo.password": 0,
              "assignedTo.accessToken": 0,
            },
          },
        ],
        // Count Total
        meta: [{ $count: "totalAlerts" }],
      },
    },

    // STAGE D: Unwrap Result
    {
      $project: {
        items: 1,
        totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
      },
    },
  ]);

  const totalAlerts = result?.totalAlerts ?? 0;
  const totalPages = Math.ceil(totalAlerts / limit);

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});



export const getPendingActionAlerts = asyncHandler(async (req, res) => {
  // 1. Setup Pagination & Search
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  // 2. User Context
  const user = req.me;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const isAdmin = ["Admin", "SOC Manager", "CISO"].includes(user.role);
  const SECURITY_BRANCH = "99341-Information Security, IT Risk Management & Fraud Control Division";

  // 3. Define Reusable Search Logic
  let searchMatch = {};
  if (search) {
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { alertName: { $regex: searchSafe, $options: "i" } },
      { alertId: { $regex: searchSafe, $options: "i" } },
      { severity: { $regex: searchSafe, $options: "i" } },
      { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
    ];
    if (mongoose.Types.ObjectId.isValid(search)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
    }
    searchMatch = { $or: searchConditions };
  }

  // 4. Build Pipeline Based on Role
  const pipeline = [];

  if (isAdmin) {
    // ==========================================
    // 🟩 ADMIN LOGIC
    // ==========================================
    // Rule: Show if (assignedTo has non-security branch) AND (ANY fieldsToFill is pending)

    // A. Filter by "Pending Action exists for ANYONE" first (Cheaper operation)
    // "(!option.comments || option.comments.trim() === "")"
    pipeline.push({
      $match: {
        fieldsToFill: {
          $elemMatch: {
            isPerformed: "notPerformed",
            $or: [
              { comments: { $exists: false } },
              { comments: "" },
              { comments: { $regex: /^\s*$/ } } // Handle "   " whitespace only
            ]
          }
        },
        ...searchMatch // Apply search early
      }
    });

    // B. Lookup Users to check Branch (Expensive operation, so we do it second)
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedUsersDetails",
      }
    });

    // C. Filter: At least one assigned user is NOT from Security Branch
    pipeline.push({
      $match: {
        assignedUsersDetails: {
          $elemMatch: {
            branch: { $ne: SECURITY_BRANCH }
          }
        }
      }
    });
    
    // Clean up the heavy lookup array immediately
    pipeline.push({ $project: { assignedUsersDetails: 0 } });

  } else {
    // ==========================================
    // 🟦 NORMAL USER LOGIC
    // ==========================================
    // Rule: (My Role Allowed) AND (I am Assigned) AND (I have Pending Action)

    const normalUserMatch = {
      // 1. "alreadyAssigned" check
      assignedTo: user._id,

      // 2. "roleAllowed" check
      "escalationToOtherUsersRole.toRoles": user.role,

      // 3. "hasPendingAction" (Specific to MY role)
      fieldsToFill: {
        $elemMatch: {
          role: user.role,
          isPerformed: "notPerformed",
          $or: [
            { comments: { $exists: false } },
            { comments: "" },
            { comments: { $regex: /^\s*$/ } }
          ]
        }
      },
      ...searchMatch // Add search logic
    };

    pipeline.push({ $match: normalUserMatch });
  }

  // 5. Shared Pagination Stage (Facet)
  pipeline.push({
    $facet: {
      items: [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        
        // Final Lookups for Display
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignedTo",
          },
        },
        // Security Projection
        {
          $project: {
            "author.password": 0, "author.accessToken": 0,
            "assignedTo.password": 0, "assignedTo.accessToken": 0,
          },
        },
      ],
      meta: [{ $count: "totalAlerts" }],
    },
  });

  // 6. Execute
  const [result] = await Alert.aggregate(pipeline);

  const totalAlerts = result?.meta[0]?.totalAlerts ?? 0;
  const totalPages = Math.ceil(totalAlerts / limit);

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

// export const getAllAlert = asyncHandler(async (req, res) => {
//   const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//   const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
//   const skip = (page - 1) * limit;
//   const search = (req.query.search || "").trim();

//   const view = req.query.view || "all";
//   const user = req.me;
//   const userId = user._id;
//   const userRole = user.role;
//   const userBranch = user.branch;

//   // 1. Base Query
//   let match = {};

//   // --- VIEW LOGIC ---

//   if (view === "unassigned") {
//     match.status = "unassigned";
//   } 
  
//   else if (view === "self_assigned") {
//     if (userRole === "Level_1") {
//       match = { acceptedBy: userId, status: "open" };
//     } else if (userRole === "Level_2") {
//       match = {
//         assignedTo: userId,
//         $or: [{ handBackToL1Assignee: { $ne: "yes" } }, { handBackToL1Assignee: { $exists: false } }]
//       };
//     } else if (["Admin", "SOC Manager", "CISO"].includes(userRole)) {
//       match = {
//         $or: [
//           { acceptedBy: userId },
//           { status: "escalated", $or: [{ investigationFindings: { $exists: false } }, { rootCause: { $exists: false } }] },
//           { status: "open", "assignedTo.0": { $exists: true } }
//         ]
//       };
//     }
//   } 
  
//   else if (view === "follow_up") {
//     const hasInvestigation = { investigationToolsUsed: { $exists: true, $ne: "" }, investigationFindings: { $exists: true, $ne: "" } };
//     if (userRole === "Level_1") {
//       match = {
//         $or: [
//           { author: userId, status: "escalated" },
//           { assignedTo: userId, status: "escalated", ...hasInvestigation },
//           { handBackToL1Assignee: "yes", status: { $ne: "closed" } },
//           { L2verdict: "true_positive", verdict: "true_positive", handBackToL1Assignee: "yes", status: { $ne: "closed" } }
//         ]
//       };
//     } else if (userRole === "Level_2") {
//       match = { status: "escalated", ...hasInvestigation, $or: [{ author: userId }, { handBackToL1Assignee: "yes" }, { assignedTo: userId }] };
//     } else {
//       match = { status: "escalated", assignedTo: { $exists: true, $not: { $size: 0 } } };
//     }
//   }

//   // ARCHIVE VIEW
//   else if (view === "archive") {
//     const SECURITY_BRANCH = "99341-Information Security, IT Risk Management & Fraud Control Division";
//     if (userBranch === SECURITY_BRANCH) {
//       match = { status: "closed" };
//     } else {
//       match = {
//         assignedTo: userId,
//         "escalationToOtherUsersRole.toRoles": userRole,
//         fieldsToFill: {
//           $elemMatch: {
//             role: userRole,
//             $or: [{ isPerformed: "performed" }, { comments: { $exists: true, $ne: "" } }]
//           }
//         }
//       };
//     }
//   }

//   // ✅ NEW 1: PENDING ALERT (pendingAlert.jsx)
//   else if (view === "pending_alert") {
//     const isAdmin = ["Admin", "SOC Manager", "CISO"].includes(userRole);

//     if (isAdmin) {
//       // Logic: Show if there are roles in fieldsToFill that are NOT in assignedUsers
//       match = {
//         $expr: {
//           $gt: [
//             {
//               $size: {
//                 $setDifference: [
//                   { $map: { input: { $ifNull: ["$fieldsToFill", []] }, as: "field", in: "$$field.role" } },
//                   "$assignedUsers.role" // Compare needed roles vs existing assigned roles
//                 ]
//               }
//             },
//             0
//           ]
//         }
//       };
//     } else {
//       // Logic: My role is allowed AND My role is NOT already assigned
//       match = {
//         "escalationToOtherUsersRole.toRoles": userRole,
//         "assignedUsers.role": { $ne: userRole } 
//       };
//     }
//   }

//   // ✅ NEW 2: ASSIGNED ALERT (AssignedAlert.jsx)
//   else if (view === "assigned_alert") {
//     const SECURITY_BRANCH = "99341-Information Security, IT Risk Management & Fraud Control Division";
//     const isAdmin = ["Admin", "SOC Manager", "CISO"].includes(userRole);

//     const pendingActionCondition = {
//       isPerformed: "notPerformed",
//       $or: [{ comments: { $exists: false } }, { comments: "" }]
//     };

//     if (isAdmin) {
//       // Logic: (Assigned User is NOT Security Branch) AND (Any Action Pending)
//       match = {
//         "assignedUsers.branch": { $ne: SECURITY_BRANCH },
//         fieldsToFill: { $elemMatch: pendingActionCondition }
//       };
//     } else {
//       // Logic: (Role Allowed) AND (Assigned to Me) AND (Action Pending for ME)
//       match = {
//         "escalationToOtherUsersRole.toRoles": userRole,
//         assignedTo: userId,
//         fieldsToFill: {
//           $elemMatch: { ...pendingActionCondition, role: userRole }
//         }
//       };
//     }
//   }

//   // 2. Build Final Query
//   const finalMatch = { $and: [match] };

//   // 3. Search Logic
//   if (search) {
//     const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     const isObjectId = mongoose.Types.ObjectId.isValid(search);
//     const searchConditions = [
//       { alertName: { $regex: searchSafe, $options: "i" } },
//       { alertId: { $regex: searchSafe, $options: "i" } },
//       { alertSource: { $regex: searchSafe, $options: "i" } },
//       { severity: { $regex: searchSafe, $options: "i" } },
//       { status: { $regex: searchSafe, $options: "i" } },
//       { author: { $regex: searchSafe, $options: "i" } },
//       { affectedIpWebsite: { $regex: searchSafe, $options: "i" } },
//       { affectedUserDevice: { $regex: searchSafe, $options: "i" } },
//       { "assignedUsers.name": { $regex: searchSafe, $options: "i" } } // Search by assigned name
//     ];
//     if (isObjectId) searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
//     finalMatch.$and.push({ $or: searchConditions });
//   }

//   // 4. Execute Aggregation
//   const [result] = await Alert.aggregate([
//     // ✅ STEP 1: POPULATE USERS (Crucial for filters based on Role/Branch)
//     {
//       $lookup: {
//         from: "users",
//         localField: "assignedTo",
//         foreignField: "_id",
//         as: "assignedUsers"
//       }
//     },
//     // ✅ STEP 2: APPLY FILTERS
//     { $match: finalMatch }, 
//     // ✅ STEP 3: PAGINATION
//     {
//       $facet: {
//         items: [
//           { $sort: { createdAt: -1 } },
//           { $skip: skip },
//           { $limit: limit },
//           { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author" } },
//           { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
//           {
//             $project: {
//               "author.password": 0, "author.accessToken": 0,
//               "assignedUsers.password": 0, "assignedUsers.accessToken": 0,
//               assignedTo: "$assignedUsers" // Map back for frontend
//             }
//           }
//         ],
//         meta: [{ $count: "totalAlerts" }]
//       }
//     },
//     {
//       $project: {
//         items: 1,
//         totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] }
//       }
//     }
//   ]);

//   const totalAlerts = result?.totalAlerts ?? 0;
//   const totalPages = Math.ceil(totalAlerts / limit);

//   return res.status(200).json({
//     success: true,
//     data: {
//       alerts: result?.items || [],
//       pagination: { totalAlerts, totalPages, currentPage: page, hasNext: page < totalPages, hasPrev: page > 1 }
//     }
//   });
// });

export const updateAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    alertName,
    eventTime,
    alertSource,
    severity,
    affectedIpWebsite,
    affectedUserDevice,
    status,
  } = req.body;

  const userRole = req.me?.role;
  const userId = req.me?._id;
  const userName = req.me?.name;
  const io = req.io;

  // 🚀 PERFORMANCE OPTIMIZATION 1: INTENT DETECTION
  // We check if the request actually contains data to update. 
  // This prevents Admins from accidentally triggering the "Escalation/Accept" logic 
  // when they just wanted to edit a field.
  const isEditAction =
    alertName ||
    eventTime ||
    alertSource ||
    severity ||
    affectedIpWebsite ||
    affectedUserDevice ||
    status;

  // Helper: Is user a Super Admin?
  const isSuperUser = ["Admin", "SOC Manager", "CISO"].includes(userRole);

  let updatedAlert;

  // =================================================================================
  // BLOCK 1: General Update / Close Logic
  // (Runs for Level 1 OR SuperUsers acting as editors)
  // =================================================================================
  if (userRole === "Level_1" || (isSuperUser && isEditAction)) {
    // 1. Prepare dynamic update object
    const updateFields = {
      alertName,
      eventTime,
      alertSource,
      severity,
      affectedIpWebsite,
      affectedUserDevice,
      status,
      $addToSet: { assignedTo: userId }, // Ensure user is in list
      acceptedBy: userId,
    };

    // 2. Set Timestamps ATOMICALLY (No extra .save() calls)
    if (status === "open") {
      updateFields.acceptedTime = new Date();
    }
    if (status === "closed") {
      updateFields.investigationEndTime = new Date();
    }

    // 3. Execute ONE fast Query
    updatedAlert = await Alert.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    // 4. Batch Notifications (Super Fast)
    if (status === "closed") {
      const toRoles = ["Level_2", "Admin", "SOC Manager", "CISO"];
      
      // Prepare bulk data
      const notifications = toRoles.map((role) => ({
        fromRole: userRole,
        alertId: id,
        toRoles: [role],
        message: `${updatedAlert.alertName} Alert Closed`,
      }));

      // ONE DB Call for all notifications
      await Notification.insertMany(notifications);

      // Fire & Forget Socket events (Instant)
      toRoles.forEach((role) => {
        io.to(role).emit("newNotification", {
           message: `${updatedAlert.alertName} Alert Closed`,
           alertId: id,
           fromRole: userRole
        });
      });
    }
  }

  // =================================================================================
  // BLOCK 2: Escalation / Accept Logic
  // (Runs for Level 2 OR SuperUsers acting as acceptors - i.e., empty body)
  // =================================================================================
  else if (userRole === "Level_2" || (isSuperUser && !isEditAction)) {
    // 1. Execute ONE fast Query (Assign & Timestamp)
    updatedAlert = await Alert.findByIdAndUpdate(
      id,
      {
        $addToSet: { assignedTo: userId },
        escalatedAlertReceiveTime: new Date(),
      },
      { new: true, runValidators: true }
    ).populate("assignedTo");

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    // 2. Batch Notifications (Super Fast)
    const toRoles = ["Level_1", "Admin", "CISO", "SOC Manager"];
    
    const notifications = toRoles.map((role) => ({
      fromRole: userRole,
      alertId: id,
      toRoles: [role],
      message: `${userName} Accepted the alert ${updatedAlert.alertName}`,
    }));

    await Notification.insertMany(notifications);

    toRoles.forEach((role) => {
      io.to(role).emit("newNotification", {
          message: `${userName} Accepted the alert ${updatedAlert.alertName}`,
          alertId: id,
          fromRole: userRole
      });
    });
  }

  // Fallback for unauthorized roles/actions
  else {
      // If we got here, a user (likely Admin) sent a request that didn't match
      // the criteria for either block, or it's a role we don't handle.
      // However, usually one of the above matches. 
      // If no update happened, we should fetch the alert to return SOMETHING or error.
      if(!updatedAlert) {
           res.status(400);
           throw new Error("No changes made or invalid action.");
      }
  }

  return res.status(200).json({ alert: updatedAlert });
});

//update investigation with verdict

export const updateInvestigationAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userRole = req.me?.role;

  // 1. False Positive Case
  if (req.body.verdict === "false_positive") {
    const { verdict, fpNote, forwardTo } = req.body;

    if (!verdict || !fpNote) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedAlert = await Alert.findByIdAndUpdate(
      id,
      {
        verdict,
        fpNote,
        status: "closed",
      },
      { new: true, runValidators: true }
    );

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    // // ✅ Emit notification for false positive closure
    // await createOrUpdateAndEmitNotification(req.io, {
    //   title: "Alert Closed",
    //   message: `${req.me?.name} closed alert ${updatedAlert.alertName} as False Positive`,
    //   type: "Alert Closed",
    //   createdBy: req.me?._id,
    //   alertId: updatedAlert._id,
    //   targetRoles: getTargetRolesForEscalation(updatedAlert, req.me),
    // });

    return res.status(200).json({ alert: updatedAlert });
  }

  // 2. True Positive Without Escalation
  if (req.body.verdict === "true_positive" && req.body.escalation === "no") {
    const {
      verdict,
      tpImpact,
      escalation,
      caseDetails,
      tpRemedationNote,
      forwardTo,
      needToDo,
    } = req.body;

    if (
      !verdict ||
      !tpImpact ||
      !caseDetails ||
      !escalation ||
      !tpRemedationNote
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAlert = await Alert.findById(id);

    // ✅ Merge old evidence with new files
    const newFiles = req.files?.length
      ? req.files.map((file) => file.filename)
      : [];
    const mergedEvidence = [
      ...(existingAlert.uploadedEvidence || []),
      ...newFiles,
    ];

    let updatePayload = {
      verdict,
      tpImpact,
      escalation,
      caseDetails,
      tpRemedationNote,
      uploadedEvidence: mergedEvidence,
    };

    // ✅ If forwardTo has values, build escalation objects
    if (
      forwardTo &&
      Array.isArray(JSON.parse(forwardTo)) &&
      JSON.parse(forwardTo).length > 0
    ) {
      const parsedForwardTo = JSON.parse(forwardTo);
      const parsedNeedToDo = needToDo ? JSON.parse(needToDo) : {};

      // Extract role names
      const forwardRoleNames = parsedForwardTo.map((item) => item.value);

      // Build escalationToOtherUsersRole
      const escalationToOtherUsersRole = {
        fromRole: userRole,
        toRoles: forwardRoleNames,
        date: new Date(),
      };

      // Build fieldsToFill
      const fieldsToFill =
        parsedNeedToDo && Object.keys(parsedNeedToDo).length > 0
          ? Object.entries(parsedNeedToDo).map(([role, value]) => ({
              role,
              value,
              isPerformed: "notPerformed",
              comments: "",
            }))
          : [];

      updatePayload.$push = {
        escalationToOtherUsersRole: escalationToOtherUsersRole,
        ...(fieldsToFill.length > 0 && {
          fieldsToFill: { $each: fieldsToFill },
        }),
      };

      // Status remains open/pending
      updatePayload.status = "open";
    } else {
      // ✅ No forwardTo → close alert
      updatePayload.status = "closed";
    }

    const updatedAlert = await Alert.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    // const updatedAlert = await Alert.findByIdAndUpdate(
    //   id,
    //   {
    //     verdict,
    //     tpImpact,
    //     escalation,
    //     caseDetails,
    //     tpRemedationNote,
    //     uploadedEvidence: uploadEvidence,
    //     status: "closed",
    //   },
    //   {
    //     new: true,
    //     runValidators: true,
    //   }
    // );

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    const toRoles = ["Level_2", "Admin", "CISO", "SOC Manager"];
    for (let role of toRoles) {
      const notif = await Notification.create({
        fromRole: userRole,
        alertId: id,
        toRoles: [role],
        message: `${req.me?.name} ${
          updatePayload.status === "closed" ? "closed" : "updated"
        } alert ${updatedAlert.alertName} as True Positive`,
      });

      io.to(role).emit("newNotification", notif);
    }

    // // ✅ Emit notification for TP closure without escalation
    // await createOrUpdateAndEmitNotification(req.io, {
    //   title: "Alert Closed",
    //   message: `${req.me?.name} closed alert ${updatedAlert.alertName} as True Positive`,
    //   type: "Alert Closed",
    //   createdBy: req.me?._id,
    //   alertId: updatedAlert._id,
    //   targetRoles: getTargetRolesForEscalation(updatedAlert, req.me),
    // });

    return res.status(200).json({ alert: updatedAlert });
  }

  // 3. True Positive With Escalation (Initial Escalation Step)
  if (
    req.body.verdict === "true_positive" &&
    req.body.escalation === "yes"
    // && !req.body.communication?.trim()
  ) {
    const {
      verdict,
      tpImpact,
      escalation,
      caseDetails,
      tpRemedationNote,
      escalationReason,
      forwardTo,
      needToDo,
    } = req.body;

    if (
      !verdict ||
      !tpImpact ||
      !caseDetails ||
      !escalation ||
      !tpRemedationNote ||
      !escalationReason
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAlert = await Alert.findById(id);

    // ✅ Merge old evidence with new files
    const newFiles = req.files?.length
      ? req.files.map((file) => file.filename)
      : [];
    const mergedEvidence = [
      ...(existingAlert.uploadedEvidence || []),
      ...newFiles,
    ];

    let updatePayload = {
      verdict,
      tpImpact,
      escalation,
      caseDetails,
      tpRemedationNote,
      escalationReason,
      uploadedEvidence: mergedEvidence,
      escalatedTime: new Date(),
      status: "escalated",
    };

    // ✅ If forwardTo has values, build escalation objects
    if (
      forwardTo &&
      Array.isArray(JSON.parse(forwardTo)) &&
      JSON.parse(forwardTo).length > 0
    ) {
      const parsedForwardTo = JSON.parse(forwardTo);
      const parsedNeedToDo = needToDo ? JSON.parse(needToDo) : {};

      // Extract role names
      const forwardRoleNames = parsedForwardTo.map((item) => item.value);

      // Build escalationToOtherUsersRole
      const escalationToOtherUsersRole = {
        fromRole: userRole,
        toRoles: forwardRoleNames,
        date: new Date(),
      };

      // Build fieldsToFill
      const fieldsToFill =
        parsedNeedToDo && Object.keys(parsedNeedToDo).length > 0
          ? Object.entries(parsedNeedToDo).map(([role, value]) => ({
              role,
              value,
              isPerformed: "notPerformed",
              comments: "",
            }))
          : [];

      updatePayload.$push = {
        escalationToOtherUsersRole: escalationToOtherUsersRole,
        ...(fieldsToFill.length > 0 && {
          fieldsToFill: { $each: fieldsToFill },
        }),
      };
    }

    const updatedAlert = await Alert.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedAlert) {
      res.status(404);
      throw new Error("Alert not found");
    }

    const toRoles = ["Level_2", "Admin", "CISO", "SOC Manager"];
    for (let role of toRoles) {
      const notif = await Notification.create({
        fromRole: userRole,
        alertId: id,
        toRoles: [role],
        message: `${req.me?.name} ${
          updatePayload.status === "escalated" ? "escalated" : "updated"
        } alert ${updatedAlert.alertName} as True Positive`,
      });

      io.to(role).emit("newNotification", notif);
    }

    return res.status(200).json({ alert: updatedAlert });
  }
});

//update level 2 investigation alert section

export const updateLevel2InvestigationAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userRole = req.me?.role;

  try {
    const {
      investigationFindings,
      investigationToolsUsed,
      incidentDeclarationRequired,
      handBackNoteToL1,
      irp,
      L2verdict,
      rootCause,
      l2RemediationPlan,
      forwardTo,
      needToDo,
      l2RemediationValidation,
      incidentDeclarationReason,
      isIncidence,
      fieldsToFill,
    } = req.body;

    if (
      !investigationFindings ||
      !investigationFindings.trim() ||
      !investigationToolsUsed ||
      !investigationToolsUsed.trim() ||
      !L2verdict
    ) {
      return res.status(400).json({ message: "all fields are required" });
    }

    if (L2verdict === "false_positive") {
      let setPayload = {
        investigationFindings,
        investigationToolsUsed,
        L2verdict,
      };

      let pushPayload = {};
      let forwardRoleNames = [];

      // Case 1: forwardTo empty → handBackNoteToL1 mandatory
      if (!forwardTo || forwardTo.length === 0) {
        if (!handBackNoteToL1?.trim()) {
          return res
            .status(400)
            .json({ message: "Hand Back Note must be filled Up" });
        }
        setPayload.handBackNoteToL1 = handBackNoteToL1;
        setPayload.handBackToL1Assignee = "yes";
        setPayload.handBackTime = new Date();
      } else {
        // Case 2: forwardTo has values → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          return res
            .status(400)
            .json({ message: "Please select the User and Note" });
        }

        const parsedForwardTo = forwardTo;
        const parsedNeedToDo = needToDo || {};

        forwardRoleNames = parsedForwardTo.map((item) => item.value);

        const escalationToOtherUsersRole = {
          fromRole: userRole,
          toRoles: forwardRoleNames,
          date: new Date(),
        };

        const fieldsToFill = Object.entries(parsedNeedToDo).map(
          ([role, value]) => ({
            role,
            value,
            isPerformed: "notPerformed",
            comments: "",
          })
        );

        // ✅ Use $each for both arrays
        pushPayload.escalationToOtherUsersRole = {
          $each: [escalationToOtherUsersRole],
        };
        if (fieldsToFill.length > 0) {
          pushPayload.fieldsToFill = { $each: fieldsToFill };
        }
      }

      // ✅ update alert
      const updatedAlert = await Alert.findByIdAndUpdate(
        id,
        {
          $set: setPayload,
          ...(Object.keys(pushPayload).length > 0 && { $push: pushPayload }),
        },
        { new: true, runValidators: true }
      );

      if (!updatedAlert) {
        res.status(404);
        throw new Error("Alert not found");
      }

      const toRoles = [
        "Level_1",
        "Admin",
        "CISO",
        "SOC Manager",
        ...(forwardRoleNames || []),
      ];
      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId: id,
          toRoles: [role],
          message: `${req.me?.name} marked alert ${
            updatedAlert.alertName
          } as false positive. ${
            setPayload.handBackNoteToL1?.trim()
              ? "Requested Level 1 to close the alert."
              : "Requested mentioned department to perform requested tasks."
          }`,
        });

        io.to(role).emit("newNotification", notif);
      }

      return res.status(200).json({ alert: updatedAlert });
    }

    if (
      L2verdict === "true_positive" &&
      incidentDeclarationRequired === "no" &&
      isIncidence === "pending"
    ) {
      // ✅ L2 Remediation Plan mandatory
      if (!l2RemediationPlan?.trim()) {
        return res
          .status(400)
          .json({ message: "You must provide L2 Remediation Plan" });
      }

      let updateData = {
        investigationFindings,
        investigationToolsUsed,
        L2verdict,
        incidentDeclarationRequired,
        isIncidence,
        l2RemediationPlan,
      };

      if ((forwardTo?.length || 0) === 0) {
        // forwardTo নেই → handBackNoteToL1 mandatory
        if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
          return res.status(400).json({ message: "All fields are required" });
        }

        updateData.l2RemediationValidation = l2RemediationValidation;
        updateData.handBackNoteToL1 = handBackNoteToL1;
        updateData.l2ResolutionTimestamp = new Date();
        updateData.handBackTime = new Date();
        updateData.handBackToL1Assignee = "yes";
      } else {
        // forwardTo আছে → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          return res
            .status(400)
            .json({ message: "Please select the user and create Note" });
        }

        // ✅ Extract role names
        const forwardRoleNames = forwardTo.map((item) => item.value);

        // ✅ Build escalationToOtherUsersRole
        const escalationToOtherUsersRole = {
          fromRole: userRole,
          toRoles: forwardRoleNames,
          date: new Date(),
        };

        // ✅ Build fieldsToFill
        const fieldsToFill = Object.entries(needToDo).map(([role, value]) => ({
          role,
          value,
          isPerformed: "notPerformed",
          comments: "",
        }));

        updateData.$push = {
          escalationToOtherUsersRole,
          fieldsToFill: { $each: fieldsToFill },
        };

        updateData.forwardTo = forwardTo;
        updateData.needToDo = needToDo;
       
      }

      // ✅ Update alert
      const updatedAlert = await Alert.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedAlert) {
        res.status(404);
        throw new Error("Alert not found");
      }

      // ✅ Notifications
      const toRoles = [
        "Level_1",
        "Admin",
        "CISO",
        "SOC Manager",
        ...(forwardTo?.map((item) => item.value) || []),
      ];

      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId: id,
          toRoles: [role],
          message: `${req.me?.name} marked alert ${updatedAlert.alertName} as True Positive but no incident declaration required, sent for further process.`,
        });

        io.to(role).emit("newNotification", notif);
      }

      return res.status(200).json({ alert: updatedAlert });
    }

    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired === "no" &&
    //   l2RemediationPlan?.trim() &&
    //   !handBackNoteToL1?.trim() &&
    //   !l2RemediationValidation?.trim() &&
    //   isIncidence === "pending"
    // ) {
    //   if (
    //     Array.isArray(forwardTo) &&
    //     ((forwardTo.length > 0 && Object.keys(needToDo || {}).length === 0) ||
    //       (forwardTo.length > 0 &&
    //         forwardTo.length !== Object.keys(needToDo || {}).length))
    //   ) {
    //     return res.status(400).json({ message: "all fields are required" });
    //   }

    //   // ✅ Extract role names
    //   const forwardRoleNames = forwardTo?.length
    //     ? forwardTo.map((item) => item.value)
    //     : [];

    //   // ✅ build escalationToOtherUsersRole (single object, not array)

    //   // ✅ Build escalationToOtherUsersRole and fieldsToFill only if forwardTo has values
    //   let escalationToOtherUsersRole;
    //   let fieldsToFill = [];

    //   if (forwardTo?.length) {
    //     escalationToOtherUsersRole = {
    //       fromRole: userRole,
    //       toRoles: forwardRoleNames,
    //       date: new Date(),
    //     };

    //     fieldsToFill =
    //       needToDo && Object.keys(needToDo).length > 0
    //         ? Object.entries(needToDo).map(([role, value]) => ({
    //             role,
    //             value,
    //             isPerformed: "notPerformed",
    //             comments: "",
    //           }))
    //         : [];
    //   }

    //   // ✅ Build update object dynamically
    //   const updateData = {
    //     investigationFindings,
    //     investigationToolsUsed,
    //     L2verdict,
    //     incidentDeclarationRequired,
    //     l2RemediationPlan,
    //   };

    //   if (forwardTo?.length) {
    //     updateData.$push = {
    //       escalationToOtherUsersRole,
    //       ...(fieldsToFill.length > 0 && {
    //         fieldsToFill: { $each: fieldsToFill },
    //       }),
    //     };
    //   }

    //   // ✅ Update alert
    //   const updatedAlert = await Alert.findByIdAndUpdate(id, updateData, {
    //     new: true,
    //     runValidators: true,
    //   });

    //   if (!updatedAlert) {
    //     res.status(404);
    //     throw new Error("Alert not found");
    //   }

    //   const toRoles = [
    //     "Level_1",
    //     "Admin",
    //     "CISO",
    //     "SOC Manager",
    //     ...(forwardRoleNames || []),
    //   ];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} find this alert ${updatedAlert.alertName} as ture Positive but not need to declare incident and send it to Further Process`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }

    //   return res.status(200).json({ alert: updatedAlert });
    // }

    if (
      L2verdict === "true_positive" &&
      incidentDeclarationRequired === "yes" &&
      isIncidence === "pending"
    ) {


       // ✅ incident Declaration Reason mandatory
      if (!incidentDeclarationReason?.trim()) {
        return res
          .status(400)
          .json({ message: "Incident Declaration Reason Must be filledUp" });
      }

      let updateData = {
        investigationFindings,
        investigationToolsUsed,
        L2verdict,
        incidentDeclarationRequired,
        isIncidence,
       cisoNotifiedTime: new Date(),
      };

      if ((forwardTo?.length || 0) === 0) {
        // forwardTo none → handBackNoteToL1 mandatory
        if (!incidentDeclarationReason?.trim()) {
          return res.status(400).json({ message: "Incident Declaration Reason Must be filledUp" });
        }

        updateData.incidentDeclarationReason = incidentDeclarationReason;
      } else {
        // forwardTo আছে → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          return res
            .status(400)
            .json({ message: "Please select the user and create Note" });
        }

        // ✅ Extract role names
        const forwardRoleNames = forwardTo.map((item) => item.value);

        // ✅ Build escalationToOtherUsersRole
        const escalationToOtherUsersRole = {
          fromRole: userRole,
          toRoles: forwardRoleNames,
          date: new Date(),
        };

        // ✅ Build fieldsToFill
        const fieldsToFill = Object.entries(needToDo).map(([role, value]) => ({
          role,
          value,
          isPerformed: "notPerformed",
          comments: "",
        }));

        updateData.$push = {
          escalationToOtherUsersRole,
          fieldsToFill: { $each: fieldsToFill },
        };

        updateData.forwardTo = forwardTo;
        updateData.needToDo = needToDo;
        updateData.incidentDeclarationReason = incidentDeclarationReason;

       
      }


       const findAdmin = await Users.findOne({ role: "Admin" });
      const adminId = findAdmin._id;

      // Fetch the existing alert to preserve and modify assignedTo
      const existingAlert = await Alert.findById(id);

      if (!existingAlert) {
        res.status(404);
        throw new Error("Alert not found");
      }

      // Add admin (req.me._id) to assignedTo if not already there
      const currentAssignedTo = existingAlert.assignedTo || [];

      if (!currentAssignedTo.includes(adminId)) {
        currentAssignedTo.push(adminId);
      }

      updateData.assignedTo = currentAssignedTo;

      // ✅ Update alert
      const updatedAlert = await Alert.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedAlert) {
        res.status(404);
        throw new Error("Alert not found");
      }

      // ✅ Notifications
      const toRoles = [
        "Level_1",
        "Admin",
        "CISO",
        "SOC Manager",
        ...(forwardTo?.map((item) => item.value) || []),
      ];

      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId: id,
          toRoles: [role],
          message: `${req.me?.name} marked alert ${updatedAlert.alertName} as True Positive and think incident declaration required, sent for further process.`,
        });

        io.to(role).emit("newNotification", notif);
      }


      return res.status(200).json({ alert: updatedAlert });





















      // if (
      //   !incidentDeclarationRequired ||
      //   !incidentDeclarationRequired?.trim() ||
      //   !incidentDeclarationReason?.trim()
      // ) {
      //   return res.status(400).json({ message: "all fields are required" });
      // }

      // const updateFields = {
      //   investigationFindings,
      //   investigationToolsUsed,
      //   L2verdict,
      //   incidentDeclarationRequired,
      //   cisoNotifiedTime: new Date(),
      //   incidentDeclarationReason,
      // };

      // const findAdmin = await Users.findOne({ role: "Admin" });
      // const adminId = findAdmin._id;

      // // Fetch the existing alert to preserve and modify assignedTo
      // const existingAlert = await Alert.findById(id);

      // if (!existingAlert) {
      //   res.status(404);
      //   throw new Error("Alert not found");
      // }

      // // Add admin (req.me._id) to assignedTo if not already there
      // const currentAssignedTo = existingAlert.assignedTo || [];

      // if (!currentAssignedTo.includes(adminId)) {
      //   currentAssignedTo.push(adminId);
      // }

      // updateFields.assignedTo = currentAssignedTo;

      // // update alert
      // const updatedAlert = await Alert.findByIdAndUpdate(id, updateFields, {
      //   new: true,
      //   runValidators: true,
      // });

      // if (!updatedAlert) {
      //   res.status(404);
      //   throw new Error("Alert not found");
      // }

      // const toRoles = ["Level_1", "Admin"];
      // for (let role of toRoles) {
      //   const notif = await Notification.create({
      //     fromRole: userRole,
      //     alertId: id,
      //     toRoles: [role],
      //     message: `${req.me?.name} find this alert ${updatedAlert.alertName} as ture Positive send it to the CISO for incident declaration`,
      //   });

      //   io.to(role).emit("newNotification", notif);
      // }

      // return res.status(200).json({ alert: updatedAlert });
    }

if (
  L2verdict === "true_positive" &&
  incidentDeclarationRequired === "yes" &&
  isIncidence === "yes"
) {
  // 🔎 Mandatory field checks
  const mandatoryChecks = [
    { field: irp, message: "IRP must be filled up" },
    { field: rootCause, message: "Root Cause Analysis must be filled up" },
    { field: l2RemediationPlan, message: "L2 Remediation Plan must be filled up" },
  ];

  for (const { field, message } of mandatoryChecks) {
    if (!field?.trim()) {
      return res.status(400).json({ message });
    }
  }

  let updateData = {
    irp,
    rootCause,
    l2RemediationPlan,
    incidentDeclarationRequired,
    isIncidence,
    L2verdict,
  };

  if ((forwardTo?.length || 0) === 0) {
    // forwardTo empty → l2RemediationValidation + handBackNoteToL1 mandatory
    if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
      return res.status(400).json({
        message: "L2 Remediation Validation as well as Hand Back Note To L1 must be filled up",
      });
    }

    updateData.l2RemediationValidation = l2RemediationValidation;
    updateData.handBackNoteToL1 = handBackNoteToL1;
    updateData.l2ResolutionTimestamp = new Date();
    updateData.handBackTime = new Date();
    updateData.handBackToL1Assignee = "yes";
  } else {
    // forwardTo has value → needToDo mandatory
    if (
      !needToDo ||
      Object.keys(needToDo).length === 0 ||
      forwardTo.length !== Object.keys(needToDo).length
    ) {
      return res.status(400).json({ message: "Please select the user and create Note" });
    }

    // ✅ Extract role names
    const forwardRoleNames = forwardTo.map((item) => item.value);

    // ✅ Build escalationToOtherUsersRole
    const escalationToOtherUsersRole = {
      fromRole: userRole,
      toRoles: forwardRoleNames,
      date: new Date(),
    };

    // ✅ Build fieldsToFill
    const fieldsToFill = Object.entries(needToDo).map(([role, value]) => ({
      role,
      value,
      isPerformed: "notPerformed",
      comments: "",
    }));

    updateData.forwardTo = forwardTo;
    updateData.needToDo = needToDo;
    updateData.$push = {
      escalationToOtherUsersRole,
      fieldsToFill: { $each: fieldsToFill },
    };
  }

  // ✅ Update alert
  const updatedAlert = await Alert.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedAlert) {
    return res.status(404).json({ message: "Alert not found" });
  }

  // ✅ Notifications
  const toRoles = [
    "Level_1",
    "Admin",
    "CISO",
    "SOC Manager",
    ...(forwardTo?.map((item) => item.value) || []),
  ];

  for (let role of toRoles) {
    const notif = await Notification.create({
      fromRole: userRole,
      alertId: id,
      toRoles: [role],
      message: `${req.me?.name} marked alert ${updatedAlert.alertName} as true positive. CISO declared it as incident for further processing.`,
    });

    io.to(role).emit("newNotification", notif);
  }

  return res.status(200).json({ alert: updatedAlert });
}


    // -----------------------------------------------------------------------
    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired === "yes" &&
    //   isIncidence === "yes" &&
    //   fieldsToFill?.length > 0
    // ) {
    //   let updateFields = {};

    //   if (fieldsToFill?.length > 0) {
    //     // Case: forwardTo not selected → require validation + handback note
    //     if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
    //       return res.status(400).json({
    //         message:
    //           "Remediation Validation and Hand Back Note must be filled up",
    //       });
    //     }

    //     updateFields = {
    //       l2RemediationValidation,
    //       handBackNoteToL1,
    //       l2ResolutionTimestamp: new Date(),
    //       handBackTime: new Date(),
    //       handBackToL1Assignee: "yes",
    //     };
    //   }

    //   // ✅ update alert
    //   const updatedAlert = await Alert.findByIdAndUpdate(
    //     id,
    //     {
    //       $set: updateFields,
    //     },
    //     {
    //       new: true,
    //       runValidators: true,
    //     }
    //   );

    //   if (!updatedAlert) {
    //     res.status(404);
    //     throw new Error("Alert not found");
    //   }

    //   // ✅ notifications

    //   const toRoles = ["Level_1", "Admin"];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} marked alert ${updatedAlert.alertName} as True Positive, declared incident, and requested Level_1 to close the alert`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }

    //   return res.status(200).json({ alert: updatedAlert });
    // }
    // -----------------------------------------------------------------------













    if (
      L2verdict === "true_positive" &&
      incidentDeclarationRequired === "yes" &&
      isIncidence === "no"
    ) {
      // ✅ L2 Remediation Plan mandatory
      if (!l2RemediationPlan?.trim()) {
        return res.status(400).json({ message: "L2 Remediation Plan must be filled up" });
      }

      let updateData = {
        investigationFindings,
        investigationToolsUsed,
        L2verdict,
        incidentDeclarationRequired,
        isIncidence,
        l2RemediationPlan,
      };

      if ((forwardTo?.length || 0) === 0) {
        // forwardTo having no value → l2RemediationValidation + handBackNoteToL1 mandatory
        if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
          return res.status(400).json({ message: "L2 Remediation Validation as well as hand Back Note To L1 must be filled Up" });
        }

        updateData.l2RemediationValidation = l2RemediationValidation;
        updateData.handBackNoteToL1 = handBackNoteToL1;
        updateData.l2ResolutionTimestamp = new Date();
        updateData.handBackTime = new Date();
        updateData.handBackToL1Assignee = "yes";

      } else {
        // forwardTo having value → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          return res.status(400).json({ message: "Please select the user and create Note" });
        }

        // ✅ Extract role names
        const forwardRoleNames = forwardTo.map((item) => item.value);

        // ✅ Build escalationToOtherUsersRole
        const escalationToOtherUsersRole = {
          fromRole: userRole,
          toRoles: forwardRoleNames,
          date: new Date(),
        };

        // ✅ Build fieldsToFill
        const fieldsToFill = Object.entries(needToDo).map(([role, value]) => ({
          role,
          value,
          isPerformed: "notPerformed",
          comments: "",
        }));

        updateData.forwardTo = forwardTo;
        updateData.needToDo = needToDo;
        updateData.$push = {
          escalationToOtherUsersRole,
          fieldsToFill: { $each: fieldsToFill },
        };
      }

      // ✅ Update alert
      const updatedAlert = await Alert.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // ✅ Notifications
      const toRoles = [
        "Level_1",
        "Admin",
        "CISO",
        "SOC Manager",
        ...(forwardTo?.map((item) => item.value) || []),
      ];

      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId: id,
          toRoles: [role],
          message: `${req.me?.name} find this alert ${updatedAlert.alertName} as ture Positive and  CISO declare it  as Non incident sent for further process.`,

        });

        io.to(role).emit("newNotification", notif);
      }

      return res.status(200).json({ alert: updatedAlert });
    }

    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired === "no" &&
    //   isIncidence === "no" &&
    //   !l2RemediationValidation?.trim() &&
    //   !handBackNoteToL1?.trim()
    // ) {
    //   if (
    //     !incidentDeclarationRequired ||
    //     !incidentDeclarationRequired?.trim() ||
    //     !l2RemediationPlan?.trim() ||
    //     // !l2RemediationValidation?.trim() ||
    //     // !handBackNoteToL1?.trim() ||
    //     !Array.isArray(forwardTo) ||
    //     forwardTo.length === 0 ||
    //     (forwardTo.length > 0 && Object.keys(needToDo).length === 0) ||
    //     (forwardTo.length > 0 &&
    //       forwardTo.length !== Object.keys(needToDo).length)
    //   ) {
    //     return res.status(400).json({ message: "all fields are required" });
    //   }

    //   // ✅ Extract role names from forwardTo
    //   const forwardRoleNames = forwardTo.map((item) => item.value);

    //   // ✅ build escalationToOtherUsersRole (single object, not array)
    //   const escalationToOtherUsersRole = {
    //     fromRole: userRole,
    //     toRoles: forwardRoleNames,
    //     date: new Date(),
    //   };

    //   // ✅ build fieldsToFill (array of new entries)
    //   const fieldsToFill =
    //     needToDo && Object.keys(needToDo).length > 0
    //       ? Object.entries(needToDo).map(([role, value]) => ({
    //           role,
    //           value,
    //           isPerformed: "notPerformed",
    //           comments: "",
    //         }))
    //       : [];

    //   const updateFields = {
    //     L2verdict,
    //     incidentDeclarationRequired,
    //     isIncidence,

    //     // l2ResolutionTimestamp: new Date(),
    //     // handBackTime: new Date(),
    //     // handBackNoteToL1,
    //     // handBackToL1Assignee: "yes",
    //   };

    //   if (irp !== undefined) updateFields.irp = irp;
    //   if (rootCause !== undefined) updateFields.rootCause = rootCause;
    //   if (l2RemediationPlan !== undefined)
    //     updateFields.l2RemediationPlan = l2RemediationPlan;
    //   if (l2RemediationValidation !== undefined)
    //     updateFields.l2RemediationValidation = l2RemediationValidation;

    //   //       escalationToOtherUsersRole,
    //   // fieldsToFill,

    //   // build $push part
    //   const pushOps = {
    //     escalationToOtherUsersRole: escalationToOtherUsersRole,
    //   };

    //   if (fieldsToFill.length > 0) {
    //     pushOps.fieldsToFill = { $each: fieldsToFill };
    //   }

    //   // update alert
    //   const updatedAlert = await Alert.findByIdAndUpdate(
    //     id,
    //     {
    //       $set: updateFields,
    //       $push: pushOps,
    //     },
    //     {
    //       new: true,
    //       runValidators: true,
    //     }
    //   );

    //   if (!updatedAlert) {
    //     res.status(404);
    //     throw new Error("Alert not found");
    //   }

    //   const toRoles = ["Level_1", "Admin", ...(forwardRoleNames || [])];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} find this alert ${updatedAlert.alertName} as ture Positive and  CISO declare it  as incident and request to Level_1 user to close the alert`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }

    //   return res.status(200).json({ alert: updatedAlert });
    // }

    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired === "no" &&
    //   isIncidence === "no" &&
    //   l2RemediationValidation?.trim() &&
    //   handBackNoteToL1?.trim()
    // ) {
    //   if (
    //     !incidentDeclarationRequired ||
    //     !incidentDeclarationRequired?.trim() ||
    //     // !l2RemediationPlan?.trim() ||
    //     !l2RemediationValidation?.trim() ||
    //     !handBackNoteToL1?.trim()

    //     // ||
    //     // !Array.isArray(forwardTo) ||
    //     // forwardTo.length === 0 ||
    //     // (forwardTo.length > 0 && Object.keys(needToDo).length === 0) ||
    //     // (forwardTo.length > 0 &&
    //     //   forwardTo.length !== Object.keys(needToDo).length)
    //   ) {
    //     return res.status(400).json({ message: "all fields are required" });
    //   }

    //   // // ✅ Extract role names from forwardTo
    //   // const forwardRoleNames = forwardTo.map((item) => item.value);

    //   // // ✅ build escalationToOtherUsersRole (single object, not array)
    //   // const escalationToOtherUsersRole = {
    //   //   fromRole: userRole,
    //   //   toRoles: forwardRoleNames,
    //   //   date: new Date(),
    //   // };

    //   // // ✅ build fieldsToFill (array of new entries)
    //   // const fieldsToFill =
    //   //   needToDo && Object.keys(needToDo).length > 0
    //   //     ? Object.entries(needToDo).map(([role, value]) => ({
    //   //         role,
    //   //         value,
    //   //         isPerformed: "notPerformed",
    //   //         comments: "",
    //   //       }))
    //   //     : [];

    //   const updateFields = {
    //     L2verdict,
    //     incidentDeclarationRequired,
    //     isIncidence,

    //     l2ResolutionTimestamp: new Date(),
    //     handBackTime: new Date(),
    //     handBackNoteToL1,
    //     handBackToL1Assignee: "yes",
    //   };

    //   if (irp !== undefined) updateFields.irp = irp;
    //   if (rootCause !== undefined) updateFields.rootCause = rootCause;
    //   if (l2RemediationPlan !== undefined)
    //     updateFields.l2RemediationPlan = l2RemediationPlan;
    //   if (l2RemediationValidation !== undefined)
    //     updateFields.l2RemediationValidation = l2RemediationValidation;

    //   //       escalationToOtherUsersRole,
    //   // fieldsToFill,

    //   // build $push part
    //   // const pushOps = {
    //   //   escalationToOtherUsersRole: escalationToOtherUsersRole,
    //   // };

    //   // if (fieldsToFill.length > 0) {
    //   //   pushOps.fieldsToFill = { $each: fieldsToFill };
    //   // }

    //   // update alert
    //   const updatedAlert = await Alert.findByIdAndUpdate(
    //     id,
    //     {
    //       $set: updateFields,
    //       // $push: pushOps,
    //     },
    //     {
    //       new: true,
    //       runValidators: true,
    //     }
    //   );

    //   if (!updatedAlert) {
    //     res.status(404);
    //     throw new Error("Alert not found");
    //   }

    //   const toRoles = ["Level_1", "Admin"];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} find this alert ${updatedAlert.alertName} as ture Positive and  CISO declare it  as Non incident and request to Level_1 user to close the alert`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }

    //   return res.status(200).json({ alert: updatedAlert });
    // }



    // rewrite the code ends here should start dated on 9/12/2025

    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired === "no" &&
    //   isIncidence === "pending" &&
    //   l2RemediationValidation?.trim() &&
    //   handBackNoteToL1?.trim()
    // ) {
    //   if (
    //     !incidentDeclarationRequired ||
    //     !incidentDeclarationRequired?.trim() ||
    //     // !l2RemediationPlan?.trim() ||
    //     !l2RemediationValidation?.trim() ||
    //     !handBackNoteToL1?.trim()

    //     // ||
    //     // !Array.isArray(forwardTo) ||
    //     // forwardTo.length === 0 ||
    //     // (forwardTo.length > 0 && Object.keys(needToDo).length === 0) ||
    //     // (forwardTo.length > 0 &&
    //     //   forwardTo.length !== Object.keys(needToDo).length)
    //   ) {
    //     return res.status(400).json({ message: "all fields are required" });
    //   }

    //   // // ✅ Extract role names from forwardTo
    //   // const forwardRoleNames = forwardTo.map((item) => item.value);

    //   // // ✅ build escalationToOtherUsersRole (single object, not array)
    //   // const escalationToOtherUsersRole = {
    //   //   fromRole: userRole,
    //   //   toRoles: forwardRoleNames,
    //   //   date: new Date(),
    //   // };

    //   // // ✅ build fieldsToFill (array of new entries)
    //   // const fieldsToFill =
    //   //   needToDo && Object.keys(needToDo).length > 0
    //   //     ? Object.entries(needToDo).map(([role, value]) => ({
    //   //         role,
    //   //         value,
    //   //         isPerformed: "notPerformed",
    //   //         comments: "",
    //   //       }))
    //   //     : [];

    //   const updateFields = {
    //     L2verdict,
    //     incidentDeclarationRequired,
    //     isIncidence,
    //     l2RemediationValidation,
    //     l2ResolutionTimestamp: new Date(),
    //     handBackTime: new Date(),
    //     handBackNoteToL1,
    //     handBackToL1Assignee: "yes",
    //   };

    //   if (irp !== undefined) updateFields.irp = irp;
    //   if (rootCause !== undefined) updateFields.rootCause = rootCause;
    //   if (l2RemediationPlan !== undefined)
    //     updateFields.l2RemediationPlan = l2RemediationPlan;
    //   if (l2RemediationValidation !== undefined)
    //     updateFields.l2RemediationValidation = l2RemediationValidation;

    //   //       escalationToOtherUsersRole,
    //   // fieldsToFill,

    //   // build $push part
    //   // const pushOps = {
    //   //   escalationToOtherUsersRole: escalationToOtherUsersRole,
    //   // };

    //   // if (fieldsToFill.length > 0) {
    //   //   pushOps.fieldsToFill = { $each: fieldsToFill };
    //   // }

    //   // update alert
    //   const updatedAlert = await Alert.findByIdAndUpdate(
    //     id,
    //     {
    //       $set: updateFields,
    //       // $push: pushOps,
    //     },
    //     {
    //       new: true,
    //       runValidators: true,
    //     }
    //   );

    //   if (!updatedAlert) {
    //     res.status(404);
    //     throw new Error("Alert not found");
    //   }

    //   const toRoles = ["Level_1", "Admin"];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} find this alert ${updatedAlert.alertName} as ture Positive and  CISO declare it  as Non incident and request to Level_1 user to close the alert`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }

    //   return res.status(200).json({ alert: updatedAlert });
    // }

    // // Build the update object dynamically
    // const updateFields = {

    //   investigationFindings,
    //   investigationToolsUsed,
    //   incidentDeclarationRequired,
    // };

    // if (incidentDeclarationRequired === "yes") {
    //   updateFields.cisoNotifiedTime = new Date();

    //   const findAdmin = await Users.findOne({ role: "Admin" });
    //   const adminId = findAdmin._id;

    //   // Fetch the existing alert to preserve and modify assignedTo
    //   const existingAlert = await Alert.findById(id);

    //   if (!existingAlert) {
    //     res.status(404);
    //     throw new Error("Alert not found");
    //   }

    //   // Add admin (req.me._id) to assignedTo if not already there
    //   const currentAssignedTo = existingAlert.assignedTo || [];

    //   if (!currentAssignedTo.includes(adminId)) {
    //     currentAssignedTo.push(adminId);
    //   }

    //   updateFields.assignedTo = currentAssignedTo;
    // }

    // if (handBackToL1Assignee !== undefined) {
    //   updateFields.handBackToL1Assignee = handBackToL1Assignee;
    //   updateFields.handBackTime = new Date();
    // }

    // if (handBackNoteToL1 !== undefined) {
    //   updateFields.handBackNoteToL1 = handBackNoteToL1;
    // }

    // if (investigationEndTime !== undefined) {
    //   updateFields.investigationEndTime = investigationEndTime;
    // }

    // // ✅ Add remediation fields individually if provided
    // if (irp !== undefined) updateFields.irp = irp;
    // if (rootCause !== undefined) updateFields.rootCause = rootCause;
    // if (l2RemediationPlan !== undefined)
    //   updateFields.l2RemediationPlan = l2RemediationPlan;
    // if (l2RemediationExecutionLog !== undefined)
    //   updateFields.l2RemediationExecutionLog = l2RemediationExecutionLog;
    // if (l2RemediationValidation !== undefined)
    //   updateFields.l2RemediationValidation = l2RemediationValidation;
    // if (l2RemediationActionDoc !== undefined)
    //   updateFields.l2RemediationActionDoc = l2RemediationActionDoc;
    // if (l2ResolutionTimestamp !== undefined)
    //   updateFields.l2ResolutionTimestamp = l2ResolutionTimestamp;

    // const updatedAlert = await Alert.findByIdAndUpdate(id, updateFields, {
    //   new: true,
    //   runValidators: true,
    // });

    // if (!updatedAlert) {
    //   res.status(404);
    //   throw new Error("Alert not found");
    // }

    // // ✅ Now that updatedAlert is available
    // if (incidentDeclarationRequired === "yes" && !handBackToL1Assignee) {
    //   // await createOrUpdateAndEmitNotification(req.io, {
    //   //   title: "Alert send for incidence declaration",
    //   //   message: `${req.me?.name} send the alert for incidence declaration ${updatedAlert.alertName}`,
    //   //   type: "Alert send for incidence declaration",
    //   //   createdBy: req.me?._id,
    //   //   alertId: updatedAlert._id,
    //   //   targetRoles: getTargetRolesForEscalation(
    //   //     updatedAlert,
    //   //     req.me,
    //   //     "incidentDeclaration"
    //   //   ),
    //   // });

    //   const toRoles = ["Admin"];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} send the alert for incidence declaration ${updatedAlert.alertName}`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }
    // }

    // // ✅ Now that updatedAlert is available
    // if (handBackToL1Assignee === "yes") {
    //   // await createOrUpdateAndEmitNotification(req.io, {
    //   //   title: "Alert send for Close",
    //   //   message: `${req.me?.name} send the alert named  ${updatedAlert.alertName} for close`,
    //   //   type: "Alert send for Close",
    //   //   createdBy: req.me?._id,
    //   //   alertId: updatedAlert._id,
    //   //   targetRoles: getTargetRolesForEscalation(
    //   //     updatedAlert,
    //   //     req.me,
    //   //     "handBackToL1"
    //   //   ),
    //   // });

    //   const toRoles = ["Admin", "Level_1"];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} send the alert named  ${updatedAlert.alertName} for close`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }
    // }

    // return res.status(200).json({ alert: updatedAlert });
  } catch (error) {
    res.status(500).json({
      message: "Failed to level 2 update alert",
      error: error.message,
    });
  }
});

// indidence declaration update

export const updateIncidenceDeclaration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userRole = req.me?.role;

  try {
    const { isIncidence } = req.body;

    if (isIncidence === "yes") {
      const updatedAlert = await Alert.findByIdAndUpdate(
        id,
        {
          isIncidence,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedAlert) {
        res.status(404);
        throw new Error("Alert not found");
      }

      const toRoles = ["Level_1", "Level_2"];
      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId: id,
          toRoles: [role],
          message: `${req.me?.name} declared this ${updatedAlert.alertName} Alert as Incidence`,
        });

        io.to(role).emit("newNotification", notif);
      }

      return res.status(200).json({ alert: updatedAlert });
    }

    if (isIncidence === "no") {
      const updatedAlert = await Alert.findByIdAndUpdate(
        id,
        {
          isIncidence,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedAlert) {
        res.status(404);
        throw new Error("Alert not found");
      }

      const toRoles = ["Level_1", "Level_2"];
      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId: id,
          toRoles: [role],
          message: `${req.me?.name} Not declared this ${updatedAlert.alertName} Alert as Incidence`,
        });

        io.to(role).emit("newNotification", notif);
      }

      return res.status(200).json({ alert: updatedAlert });
    }
  } catch (error) {
    res.status(500).json({
      message: "Failed to level 2 update alert",
      error: error.message,
    });
  }
});

// chatting Controller

export const handleSocketChatMessage = async (data, io) => {
  try {
    const { alertId, messageData } = data;

    const alert = await Alert.findById(alertId).populate("assignedTo");

    if (!alert) {
      console.warn("Alert not found for chat message:", alertId);
      return;
    }

    alert.communicationLog.push({
      name: messageData.name,
      index: messageData.index,
      role: messageData.role,
      message: messageData.message,
      msgTime: messageData.msgTime,
    });

    const otherUsers = alert.assignedTo
      .filter((u) => u.role !== messageData.role)
      .map((user) => user.role);

    alert.unreadBy = [...alert.unreadBy, ...otherUsers];
    // alert.unreadBy = [...new Set([...alert.unreadBy, ...otherUsers])];
    await alert.save();

    io.to(alertId).emit("receiveMessage", {
      alertId,
      message: messageData,
      unreadBy: alert.unreadBy,
    });
  } catch (error) {
    console.error("Error saving chat:", error);
  }
};

// getting all chat
export const getAllChatting = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const alert = await Alert.findById(id);

  if (!alert) {
    return res.status(404).json({ message: "Alert not found" });
  }

  res.json(alert.communicationLog);
});

// mark as read chatting

export const markAsReadChat = asyncHandler(async (data, io) => {
  const { alertId, userRole } = data;
  const alert = await Alert.findById(alertId);
  if (alert) {
    alert.unreadBy = alert.unreadBy.filter((u) => u !== userRole);

    await alert.save();

    io.to(alertId).emit("updateUnread", {
      alertId,
      unreadBy: alert.unreadBy,
    });
  }
});

// notification Controller

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

// get all notification

export const getAllNotification = asyncHandler(async (req, res) => {
  const allNotification = await Notification.find()
    .sort({ createdAt: -1 }) // Sort by newest first
    .limit(50);

  //check Incoming Letter
  if (allNotification.length === 0) {
    return res.status(200).json({ notification: [] });
  }
  res.status(200).json({ notification: allNotification });
});

// unread notification count

export const clearNotification = asyncHandler(async (req, res) => {
  const userRole = req.me?.role;

  try {
    // ✅ Update all matching notifications
    await Notification.updateMany(
      { toRoles: { $in: [userRole] }, read: false },
      { $set: { read: true } }
    );

    // ✅ Fetch all updated notifications
    const updatedNotifications = await Notification.find();

    // // ✅ Emit event to that role
    // io.to(userRole).emit("notificationsCleared", updatedNotifications);

    // ✅ Send response
    res.json({ notification: updatedNotifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// mark read notification

// unread notification count

export const markReadNotification = asyncHandler(async (req, res) => {
  await Notification.updateMany({ read: false }, { $set: { read: true } });
  res.json({ success: true });
});

// escalate alert

export const escalateAlert = asyncHandler(async (req, res) => {
  if (req.body.verdict === "false_positive") {
    const { alertId, toRoles, fieldsToFill } = req.body;
    const userRole = req.me.role; // role1 user

    try {
      const alert = await Alert.findById(alertId);
      if (!alert) return res.status(404).json({ error: "Alert not found" });

      alert.escalationToOtherUsersRole.push({
        fromRole: userRole,
        toRoles,
      });

      // Convert fieldsToFill object into array of {role, value} objects
      const fieldsArray = Object.entries(fieldsToFill).map(([role, value]) => ({
        role,
        value,
      }));

      // Push to alert.fieldsToFill
      alert.fieldsToFill.push(...fieldsArray);
      await alert.save();

      // Create notifications
      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId,
          toRoles: [role],
          message: `New alert escalated: ${alert.alertName}`,
        });

        io.to(role).emit("newNotification", notif);
      }

      res.json({ success: true, message: "Alert escalated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  if (req.body.verdict === "true_positive" && req.body.escalation === "no") {
    const {
      alertId,
      tpImpact,
      caseDetails,
      tpRemedationNote,
      escalation,
      verdict,
    } = req.body;
    const userRole = req.me.role; // role1 user
    const fieldsToFill = JSON.parse(req.body.fieldsToFill);
    const toRoles = JSON.parse(req.body.toRoles);

    try {
      const alert = await Alert.findById(alertId);
      if (!alert) return res.status(404).json({ error: "Alert not found" });

      alert.escalationToOtherUsersRole.push({
        fromRole: userRole,
        toRoles,
      });

      // Convert fieldsToFill object into array of {role, value} objects
      const fieldsArray = Object.entries(fieldsToFill).map(([role, value]) => ({
        role,
        value,
      }));

      // Push to alert.fieldsToFill
      alert.fieldsToFill.push(...fieldsArray);
      alert.tpImpact = tpImpact;
      alert.caseDetails = caseDetails;
      alert.tpRemedationNote = tpRemedationNote;
      alert.escalation = escalation;
      alert.verdict = verdict;

      if (req.files?.length) {
        alert.uploadedEvidence = req.files.map((file) => file.filename);
      }

      await alert.save();

      // Create notifications
      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId,
          toRoles: [role],
          message: `New alert escalated: ${alert.alertName}`,
        });

        io.to(role).emit("newNotification", notif);
      }

      res.json({ success: true, message: "Alert escalated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});

// forward and escalate alert to the another user
export const forward_and_escalateAlert = asyncHandler(async (req, res) => {
  // 3. True Positive With Escalation (Initial Escalation Step)
  if (
    req.body.verdict === "true_positive" &&
    req.body.escalation === "yes"
    // && !req.body.communication?.trim()
  ) {
    const {
      verdict,
      tpImpact,
      escalation,
      caseDetails,
      tpRemedationNote,
      escalationReason,
      alertId,
    } = req.body;

    if (
      !verdict ||
      !tpImpact ||
      !caseDetails ||
      !escalation ||
      !tpRemedationNote ||
      !escalationReason
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userRole = req.me.role; // role1 user
    const fieldsToFill = JSON.parse(req.body.fieldsToFill);
    const toRoles = JSON.parse(req.body.toRoles);

    try {
      const alert = await Alert.findById(alertId);
      if (!alert) return res.status(404).json({ error: "Alert not found" });

      alert.escalationToOtherUsersRole.push({
        fromRole: userRole,
        toRoles,
      });

      // Convert fieldsToFill object into array of {role, value} objects
      const fieldsArray = Object.entries(fieldsToFill).map(([role, value]) => ({
        role,
        value,
      }));

      // Push to alert.fieldsToFill
      alert.fieldsToFill.push(...fieldsArray);
      alert.tpImpact = tpImpact;
      alert.caseDetails = caseDetails;
      alert.tpRemedationNote = tpRemedationNote;
      alert.escalation = escalation;
      alert.verdict = verdict;
      alert.escalationReason = escalationReason;
      alert.escalatedTime = new Date();
      alert.status = "escalated";

      if (req.files?.length) {
        alert.uploadedEvidence = req.files.map((file) => file.filename);
      }

      await alert.save();

      const finalToRoles = ["Level_2", "Admin", ...toRoles];

      for (let role of finalToRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId,
          toRoles: [role],
          message: `${req.me?.name} escalated alert ${alert.alertName}`,
        });

        io.to(role).emit("newNotification", notif);
      }

      return res.status(200).json({
        success: true,
        message: "Alert escalated successfully",
        alert: alert,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

    //   const existingAlert = await Alert.findById(id);

    //   const uploadEvidence = req.files?.length
    //     ? req.files.map((file) => file.filename)
    //     : existingAlert.uploadedEvidence || [];

    //   const updatedAlert = await Alert.findByIdAndUpdate(
    //     id,
    //     {
    //       verdict,
    //       tpImpact,
    //       escalation,
    //       caseDetails,
    //       uploadedEvidence: uploadEvidence,

    //       tpRemedationNote,
    //       escalationReason,
    //       escalatedTime: new Date(),
    //       status: "escalated",
    //     },
    //     { new: true, runValidators: true }
    //   );

    //   if (!updatedAlert) {
    //     res.status(404);
    //     throw new Error("Alert not found");
    //   }

    //   const toRoles = ["Level_2", "Admin"];
    //   for (let role of toRoles) {
    //     const notif = await Notification.create({
    //       fromRole: userRole,
    //       alertId: id,
    //       toRoles: [role],
    //       message: `${req.me?.name} escalated alert ${updatedAlert.alertName}`,
    //     });

    //     io.to(role).emit("newNotification", notif);
    //   }

    //   return res.status(200).json({ alert: updatedAlert });
    // }
    // // true positive with escalation
    // if (req.body.verdict === "true_positive" && req.body.escalation === "yes") {
    //   const {
    //     alertId,
    //     tpImpact,
    //     caseDetails,
    //     tpRemedationNote,
    //     escalation,
    //     verdict,
    //     escalationReason,
    //   } = req.body;
    //   const userRole = req.me.role; // role1 user
    //   const fieldsToFill = JSON.parse(req.body.fieldsToFill);
    //   const toRoles = JSON.parse(req.body.toRoles);

    //   try {
    //     const alert = await Alert.findById(alertId);
    //     if (!alert) return res.status(404).json({ error: "Alert not found" });

    //     alert.escalationToOtherUsersRole.push({
    //       fromRole: userRole,
    //       toRoles,
    //     });

    //     // Convert fieldsToFill object into array of {role, value} objects
    //     const fieldsArray = Object.entries(fieldsToFill).map(([role, value]) => ({
    //       role,
    //       value,
    //     }));

    //     // Push to alert.fieldsToFill
    //     alert.fieldsToFill.push(...fieldsArray);
    //     alert.tpImpact = tpImpact;
    //     alert.caseDetails = caseDetails;
    //     alert.tpRemedationNote = tpRemedationNote;
    //     alert.escalation = escalation;
    //     alert.verdict = verdict;
    //     alert.escalationReason = escalationReason;

    //     if (req.files?.length) {
    //       alert.uploadedEvidence = req.files.map((file) => file.filename);
    //     }

    //     await alert.save();

    //     // Create notifications
    //     for (let role of toRoles) {
    //       const notif = await Notification.create({
    //         fromRole: userRole,
    //         alertId,
    //         toRoles: [role],
    //         message: `New alert escalated: ${alert.alertName}`,
    //       });

    //       io.to(role).emit("newNotification", notif);
    //     }

    //     res.json({ success: true, message: "Alert escalated successfully" });
    //   } catch (error) {
    //     res.status(500).json({ error: error.message });
    //   }
  }
});

export const escalateAlertAssignedTo = asyncHandler(async (req, res) => {
  const { alertId, userId } = req.body;
  const userRole = req.me?.role;

  try {
    const updatedAlert = await Alert.findByIdAndUpdate(
      alertId,
      { $addToSet: { assignedTo: userId } }, // prevent duplicates
      { new: true, runValidators: true }
    );

    if (!updatedAlert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const toRoles = ["Level_1"];
    for (let role of toRoles) {
      const notif = await Notification.create({
        fromRole: userRole,
        alertId,
        toRoles: [role],
        message: `${req.me?.name} Accept this ${updatedAlert.alertName} Alert`,
      });

      io.to(role).emit("newNotification", notif);
    }

    return res.status(200).json({ alert: updatedAlert });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// perform Actions Controller

export const performActions = asyncHandler(async (req, res) => {
  const { alertId, isPerformed, comments } = req.body;
  const userRole = req.me?.role;

    // ✅ Validation: require at least one field
  const hasPerformed = !!isPerformed;
  const hasComments = comments && comments.trim() !== "";

  if (!hasPerformed && !hasComments) {
    createToast("Please select 'Performed' or enter comments before submitting.", "error");
    return; // stop execution
  }

  try {
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert Not Found" });
    }
    // ✅ Check if fieldsToFill contains entry for this role
    const fieldIndex = alert.fieldsToFill.findIndex(
      (index) =>
        index.role === userRole &&
        index.isPerformed === "notPerformed" &&
        index.comments === ""
    );

    if (fieldIndex === -1) {
      return res.status(400).json({ error: "No field Found" });
    }

    // ✅ Update the specific entry with isPerformed
    alert.fieldsToFill[fieldIndex].isPerformed = isPerformed;
    alert.fieldsToFill[fieldIndex].comments = comments;

    // Save updated Document
    const updatedAlert = await alert.save();

    const toRoles = ["Level_1","Level_2", "Admin", "SOC Manager", "CISO"];
    for (let role of toRoles) {
      const notif = await Notification.create({
        fromRole: userRole,
        alertId,
        toRoles: [role],
        message: `${req.me?.name} member of ${userRole}  Perform Actions on this ${updatedAlert.alertName} Alert`,
      });

      io.to(role).emit("newNotification", notif);
    }

    return res.status(200).json({ alert: updatedAlert });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// export const generateReport = asyncHandler(async (req, res) => {
//   try {
//     const {
//       fromDate,
//       toDate,
//       alertSource,
//       severity,
//       alertName,
//       isIncidence,
//       initiator,
//       status,
//       verdict,
//     } = req.body;

//     const query = {};

//     // ✅ Apply filters dynamically
//     if (status) query.status = status;
//     if (severity) query.severity = severity;
//     if (alertSource) query.alertSource = alertSource;
//     if (alertName) query.alertName = alertName;
//     if (isIncidence) query.isIncidence = isIncidence;
//     if (verdict) query.verdict = verdict;

//     if (initiator) {
//       query.author = new mongoose.Types.ObjectId(initiator);
//     }

//     // ✅ Date filtering
//     if (fromDate && toDate) {
//       const start = new Date(fromDate);
//       const end = new Date(toDate);
//       end.setHours(23, 59, 59, 999); // include whole day

//       query.createdAt = { $gte: start, $lte: end };
//     } else if (fromDate) {
//       const start = new Date(fromDate);
//       query.createdAt = { $gte: start };
//     } else if (toDate) {
//       const end = new Date(toDate);
//       end.setHours(23, 59, 59, 999);
//       query.createdAt = { $lte: end };
//     }

//     if (Object.keys(query).length === 0) {
//       return res.status(400).json({ message: "No filters provided" });
//     }

//     // // ✅ Count total
//     // const total = await Alert.countDocuments(query);

//     // ✅ Paginate
//     const alerts = await Alert.find(query)
//       .populate("author")
//       .sort({ createdAt: -1 });
//     // .skip((page - 1) * pageSize)
//     // .limit(pageSize);

//     res.json({
//       // total,
//       // page,
//       // pageSize,
//       // totalPages: Math.ceil(total / pageSize),

//       data: alerts,
//     });
//   } catch (error) {
//     console.error("Error fetching paginated alerts:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// transfer alert to the another User

// export const transferUserToAlert = asyncHandler(async (req, res) => {
//   const { alertId, transferUserId } = req.body;
//   const userRole = req.me?.role;

//   console.log(req.body);

//   if (userRole === "Admin" || userRole === "SOC Manager" || userRole === "CISO") {
//     try {
//       const alert = await Alert.findById(alertId).populate(
//         "assignedTo",
//         "name role branch _id"
//       );

//       if (!alert) {
//         return res.status(404).json({ error: "Alert Not Found" });
//       }

//       const transferUserObjId = new mongoose.Types.ObjectId(transferUserId);

//       // Check if transferUserId already exists in assignedTo
//       const alreadyAssigned = alert.assignedTo.some(
//         (id) => id.toString() === transferUserObjId.toString()
//       );

//       if (alreadyAssigned) {
//         return res.status(200).json({ message: "User already assigned" });
//       }
//       // Remove acceptedBy from assignedTo
//       const acceptedById = alert.acceptedBy?.toString();

//       if (acceptedById) {
//         alert.assignedTo = alert.assignedTo.filter(
//           (id) => id.toString() !== acceptedById
//         );
//       }

//       // Push new user
//       alert.assignedTo.push(transferUserObjId);
//       await alert.save();

//       const toRoles = ["Level_1", "Level_2"];
//       for (let role of toRoles) {
//         const notif = await Notification.create({
//           fromRole: userRole,
//           alertId: alert._id,
//           toRoles: [role],
//           message: `${req.me?.name} transfered  ${alert.alertId} Alert for new Assignment`,
//         });

//         io.to(role).emit("newNotification", notif);
//       }

//       return res.status(200).json({
//         message: "Alert transferred successfully",
//       });
//     } catch (error) {
//       return res.status(500).json({ error: error.message });
//     }
//   } else {
//     return res.status(403).json({ message: "Only Level_1 Can Do This Job" });
//   }
// });


// export const generateReport = asyncHandler(async (req, res) => {
//   // 1. Pagination Setup (From Query Params)
//   const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//   const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
//   const skip = (page - 1) * limit;

//   // 2. Extract Filters (From Request Body)
//   const {
//     fromDate,
//     toDate,
//     alertSource,
//     severity,
//     alertName,
//     isIncidence,
//     initiator,
//     status,
//     verdict,
//   } = req.body;

//   // 3. Build Match Object
//   const match = {};

//   // --- Exact Match Filters ---
//   if (status && status !== "choose") match.status = status;
//   if (severity && severity !== "choose") match.severity = severity;
//   if (alertSource && alertSource !== "choose") match.alertSource = alertSource;
//   if (isIncidence && isIncidence !== "choose") match.isIncidence = isIncidence;
//   if (verdict && verdict !== "choose") match.verdict = verdict;

//   // --- Partial Text Match (Regex) ---
//   // Improved: Allows partial matching for Alert Name (Case Insensitive)
//   if (alertName) {
//     match.alertName = { $regex: alertName, $options: "i" };
//   }

//   // --- ObjectId Filter (Initiator/Author) ---
//   if (initiator && initiator !== "choose") {
//     if (mongoose.Types.ObjectId.isValid(initiator)) {
//       match.author = new mongoose.Types.ObjectId(initiator);
//     }
//   }

//   // --- Date Range Filter ---
//   if (fromDate || toDate) {
//     match.createdAt = {};
//     if (fromDate) {
//       match.createdAt.$gte = new Date(fromDate);
//     }
//     if (toDate) {
//       const end = new Date(toDate);
//       end.setHours(23, 59, 59, 999); // Include the full end day
//       match.createdAt.$lte = end;
//     }
//   }

//   // 4. Execution (Aggregation Pipeline)
//   const [result] = await Alert.aggregate([
//     // STAGE A: Filter (Fastest operation first)
//     { $match: match },

//     // STAGE B: Facet (Parallel execution for Data + Count)
//     {
//       $facet: {
//         // 1. Fetch Data
//         items: [
//           { $sort: { createdAt: -1 } }, // Newest first
//           { $skip: skip },
//           { $limit: limit },
//           // Join Author Details
//           {
//             $lookup: {
//               from: "users",
//               localField: "author",
//               foreignField: "_id",
//               as: "author",
//             },
//           },
//           { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
//           // Clean up sensitive fields
//           {
//             $project: {
//               "author.password": 0,
//               "author.accessToken": 0,
//             },
//           },
//         ],
//         // 2. Count Total (For Pagination)
//         meta: [{ $count: "totalAlerts" }],
//       },
//     },

//     // STAGE C: Unwrap Result
//     {
//       $project: {
//         items: 1,
//         totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
//       },
//     },
//   ]);

//   const totalAlerts = result?.totalAlerts ?? 0;
//   const totalPages = Math.ceil(totalAlerts / limit);

//   // 5. Response
//   return res.status(200).json({
//     success: true,
//     data: {
//       alerts: result?.items || [],
//       pagination: {
//         totalAlerts,
//         totalPages,
//         currentPage: page,
//         hasNext: page < totalPages,
//         hasPrev: page > 1,
//       },
//     },
//   });
// });
export const generateReport = asyncHandler(async (req, res) => {
  // 1. Pagination Setup
  // Check if limit is explicitly '0' (flag for "Get Everything")
  const reqLimit = parseInt(req.query.limit, 10);
  const isExportMode = reqLimit === 0;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  
  // If Export Mode: Set limit to a huge number. Otherwise: Use standard limit logic
  const limit = isExportMode ? 100000000 : Math.min(reqLimit || 10, 100);
  
  // If Export Mode: Skip nothing. Otherwise: Skip based on page
  const skip = isExportMode ? 0 : (page - 1) * limit;

  // 2. Extract Filters (Same as before)
  const {
    fromDate,
    toDate,
    alertSource,
    severity,
    alertName,
    isIncidence,
    initiator,
    status,
    verdict,
  } = req.body;

  // 3. Build Match Object (Same as before)
  const match = {};

  if (status && status !== "choose") match.status = status;
  if (severity && severity !== "choose") match.severity = severity;
  if (alertSource && alertSource !== "choose") match.alertSource = alertSource;
  if (isIncidence && isIncidence !== "choose") match.isIncidence = isIncidence;
  if (verdict && verdict !== "choose") match.verdict = verdict;

  if (alertName) {
    match.alertName = { $regex: alertName, $options: "i" };
  }

  if (initiator && initiator !== "choose") {
    if (mongoose.Types.ObjectId.isValid(initiator)) {
      match.author = new mongoose.Types.ObjectId(initiator);
    }
  }

  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }

  // 4. Execution
  const [result] = await Alert.aggregate([
    { $match: match },
    {
      $facet: {
        items: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit }, // This will now allow all items if isExportMode is true
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              "author.password": 0,
              "author.accessToken": 0,
            },
          },
        ],
        meta: [{ $count: "totalAlerts" }],
      },
    },
    {
      $project: {
        items: 1,
        totalAlerts: { $ifNull: [{ $arrayElemAt: ["$meta.totalAlerts", 0] }, 0] },
      },
    },
  ]);

  const totalAlerts = result?.totalAlerts ?? 0;
  // If in export mode, total pages is always 1
  const totalPages = isExportMode ? 1 : Math.ceil(totalAlerts / limit);

  return res.status(200).json({
    success: true,
    data: {
      alerts: result?.items || [],
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: page,
        hasNext: !isExportMode && page < totalPages,
        hasPrev: !isExportMode && page > 1,
      },
    },
  });
});

export const transferUserToAlert = asyncHandler(async (req, res) => {
  const { alertId, transferUserId, transferUserRole } = req.body;
  const userRole = req.me?.role;

  if (
    userRole === "Admin" ||
    userRole === "SOC Manager" ||
    userRole === "CISO"
  ) {
    try {
      const alert = await Alert.findById(alertId).populate(
        "assignedTo",
        "name role branch _id"
      );

      if (!alert) {
        return res.status(404).json({ error: "Alert Not Found" });
      }

      const transferUserObjId = new mongoose.Types.ObjectId(transferUserId);

      // Apply role-based removal logic
      if (transferUserRole === "Level_1") {
        // Clear acceptedBy and remove from assignedTo
        alert.acceptedBy = null;
        alert.status = "unassigned";
        alert.assignedTo = alert.assignedTo.filter((item) => {
          const itemId = item._id ? item._id.toString() : item.toString();
          return itemId !== transferUserObjId.toString();
        });
      } else if (transferUserRole === "Level_2") {
        // Remove from assignedTo only
        alert.assignedTo = alert.assignedTo.filter((item) => {
          const itemId = item._id ? item._id.toString() : item.toString();
          return itemId !== transferUserObjId.toString();
        });
      } else {
        // For all other roles → remove from assignedTo
        alert.assignedTo = alert.assignedTo.filter((item) => {
          const itemId = item._id ? item._id.toString() : item.toString();
          return itemId !== transferUserObjId.toString();
        });
      }

      await alert.save();

      // Notifications
      const toRoles = ["Level_1", "Level_2"];
      for (let role of toRoles) {
        const notif = await Notification.create({
          fromRole: userRole,
          alertId: alert._id,
          toRoles: [role],
          message: `${req.me?.name} transferred ${alert.alertId} Alert for new assignment`,
        });

        io.to(role).emit("newNotification", notif);
      }

      return res.status(200).json({
        message: "Alert transferred successfully",
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res
      .status(403)
      .json({ message: "Only Admin/SOC Manager/CISO can transfer alerts" });
  }
});
