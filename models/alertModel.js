// import mongoose from "mongoose";

// //create schema
// const alertSchema = mongoose.Schema(
//   {
//     alertId: {
//       type: String,
//       required: true,
//     },

//     affectedIpWebsite: {
//       type: String,
//       required: true,
//     },

//     affectedUserDevice: {
//       type: String,
//       required: true,
//     },
//     eventTime: {
//       type: Date,
//       required: true,
//     },
//     severity: {
//       type: String,
//       required: true,
//     },
//     alertName: {
//       type: String,
//       required: true,
//     },
//     alertSource: {
//       type: String,
//       required: true,
//     },
//     author: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     acceptedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     status: {
//       type: String,
//       enum: ["open", "closed", "escalated", "unassigned"],
//       default: "unassigned",
//     },
//     verdict: {
//       type: String,
//       enum: ["true_positive", "false_positive"],
//       default: "false_positive",
//     },

//     L2verdict: {
//       type: String,
//       enum: ["true_positive", "false_positive"],
//       default: "false_positive",
//     },

//     assignedTo: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         default: null,
//       },
//     ],
//     escalationToOtherUsersRole: [
//       {
//         fromRole: String,
//         toRoles: [String],
//         date: { type: Date, default: Date.now },
//       },
//     ],
//     fieldsToFill: [
//       {
//         role: { type: String, required: true },
//         value: { type: String, default: "" },
//         isPerformed: { type: String, default: "notPerformed" },
//         comments: { type: String, default: ""},
//       },
//     ],
//     unreadBy: [String],
//     fpNote: { type: String },
//     deviceOrIP: { type: String },
//     caseDetails: { type: String },
//     uploadedEvidence: [String], // Array of file URLs
//     tpImpact: { type: String },
//     escalation: { type: String, enum: ["yes", "no"], default: "no" },
//     tpCaseDetails: { type: String },
//     escalationReason: { type: String },
//     incidentDeclarationReason: { type: String },
//     tpRemedationNote: { type: String },
//     escalatedTime: { type: Date, default: null },
//     acceptedTime: { type: Date, default: null },
//     escalatedAlertReceiveTime: { type: Date, default: null },
//     investigationEndTime: { type: Date, default: null },
//     cisoNotifiedTime: { type: Date, default: null },
//     alertResolutionTime: { type: Date, default: null },
//     handBackTime: { type: Date, default: null },
//     investigationToolsUsed: { type: String },
//     investigationFindings: { type: String },
//     incidentDeclarationRequired: { type: String },
//     isIncidence: {
//       type: String,
//       enum: ["yes", "no", "pending"],
//       default: "pending",
//     },
//     handBackToL1Assignee: { type: String },
//     handBackNoteToL1: { type: String },
//     l2RemediationActionDoc: { type: String },
//     l2RemediationValidation: { type: String },
//     l2RemediationExecutionLog: { type: String },
//     l2RemediationPlan: { type: String },
//     L2StatusUpdate: { type: String },
//     rootCause: { type: String },
//     irp: { type: String },
//     l2ResolutionTimestamp: { type: Date, default: null },
//     communicationLog: [
//       {
//         name: { type: String, required: true },
//         index: { type: String, required: true },
//         message: { type: String, required: true },
//         role: { type: String, required: true },
//         msgTime: { type: Date },
//       },
//     ],
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// //export user schema

// export default mongoose.model("Alert", alertSchema);


import mongoose from "mongoose";

const alertSchema = mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      index: true, // Optimized for Search
    },

    affectedIpWebsite: {
      type: String,
      required: true,
    },

    affectedUserDevice: {
      type: String,
      required: true,
    },
    eventTime: {
      type: Date,
      required: true,
    },
    severity: {
      type: String,
      required: true,
    },
    alertName: {
      type: String,
      required: true,
      index: true, // Optimized for Search
    },
    alertSource: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimized for filtering by Author
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true, // Optimized for "My Tasks"
    },
    status: {
      type: String,
      enum: ["open", "closed", "escalated", "unassigned"],
      default: "unassigned",
      index: true, // CRITICAL: Used in almost every filter
    },
    verdict: {
      type: String,
      enum: ["true_positive", "false_positive"],
      default: "false_positive",
    },

    L2verdict: {
      type: String,
      enum: ["true_positive", "false_positive"],
      default: "false_positive",
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true, // CRITICAL: Optimized for L2/Admin assignment checks
      },
    ],
    escalationToOtherUsersRole: [
      {
        fromRole: String,
        toRoles: [String],
        date: { type: Date, default: Date.now },
      },
    ],
    fieldsToFill: [
      {
        role: { type: String, required: true },
        value: { type: String, default: "" },
        isPerformed: { type: String, default: "notPerformed" },
        comments: { type: String, default: "" },
      },
    ],
    unreadBy: [String],
    fpNote: { type: String },
    deviceOrIP: { type: String },
    caseDetails: { type: String },
    uploadedEvidence: [String], // Array of file URLs
    tpImpact: { type: String },
    escalation: { type: String, enum: ["yes", "no"], default: "no" },
    tpCaseDetails: { type: String },
    escalationReason: { type: String },
    incidentDeclarationReason: { type: String },
    tpRemedationNote: { type: String },
    escalatedTime: { type: Date, default: null },
    acceptedTime: { type: Date, default: null },
    escalatedAlertReceiveTime: { type: Date, default: null },
    investigationEndTime: { type: Date, default: null },
    cisoNotifiedTime: { type: Date, default: null },
    alertResolutionTime: { type: Date, default: null },
    handBackTime: { type: Date, default: null },
    investigationToolsUsed: { type: String },
    investigationFindings: { type: String },
    incidentDeclarationRequired: { type: String },
    isIncidence: {
      type: String,
      enum: ["yes", "no", "pending"],
      default: "pending",
    },
    handBackToL1Assignee: { 
      type: String,
      index: true // Optimized for Handback logic
    },
    handBackNoteToL1: { type: String },
    l2RemediationActionDoc: { type: String },
    l2RemediationValidation: { type: String },
    l2RemediationExecutionLog: { type: String },
    l2RemediationPlan: { type: String },
    L2StatusUpdate: { type: String },
    rootCause: { type: String },
    irp: { type: String },
    l2ResolutionTimestamp: { type: Date, default: null },
    communicationLog: [
      {
        name: { type: String, required: true },
        index: { type: String, required: true },
        message: { type: String, required: true },
        role: { type: String, required: true },
        msgTime: { type: Date },
      },
    ],
    createdAt: { type: Date, default: Date.now, index: true }, // Optimized for Sorting
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- COMPOUND INDEXES FOR MAX PERFORMANCE ---
// These specific combinations make your "Self Assigned" and "Follow Up" tabs instant.

// 1. For "Self Assigned" (L1): Finds alerts accepted by user X that are open
alertSchema.index({ acceptedBy: 1, status: 1 });

// 2. For "Self Assigned" (L2): Finds alerts assigned to user X that are NOT handed back
alertSchema.index({ assignedTo: 1, handBackToL1Assignee: 1 });

// 3. For "Follow Up": Finds alerts created by user X that are escalated
alertSchema.index({ author: 1, status: 1 });

// 4. For sorting newest first (Default View)
alertSchema.index({ createdAt: -1 });
alertSchema.index({ 
  status: 1, 
  isIncidence: 1, 
  incidentDeclarationRequired: 1, 
  createdAt: -1 
});

alertSchema.index({ 
  assignedTo: 1, 
});

alertSchema.index({ 
  "fieldsToFill.role": 1, 
  "fieldsToFill.isPerformed": 1 
});

export default mongoose.model("Alert", alertSchema);
