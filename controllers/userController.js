import asyncHandler from "express-async-handler";
import Users from "../models/userModel.js";

import bcrypt from "bcrypt";
import { fileDeleteFromCloud, fileUploadToCloud } from "../utils/cloudinary.js";
import {
  getPublicID,
  isValidEmail,
  isValidPhoneNumber,
} from "../helpers/helpers.js";

/**
 * @description : get all user
 * @method : GET
 * @access : public
 * @route : '/api/v1/user'
 */

// export const getAllUser = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page, 10) || 1;
//   const limit = parseInt(req.query.limit, 10) || 10;
//   const skip = (page - 1) * limit;
//   const search = req.query.search || "";

//   // Base query depending on role
//   let query = {};
//   if (
//     !(
//       req.me?.role === "Admin" ||
//       req.me?.role === "SOC Manager" ||
//       req.me?.role === "CISO"
//     )
//   ) {
//     query.branch = req.me.branch;
//   }

//   // Add search filter
//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { role: { $regex: search, $options: "i" } },
//       { index: { $regex: search, $options: "i" } },
//     ];
//   }

//   // Query DB with pagination + sort
//   const [users, totalUsers] = await Promise.all([
//     Users.find(query)
//       .select("-password")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit),
//     Users.countDocuments(query),
//   ]);

//    if (totalUsers === 0) {
//     return res.status(200).json({
//       user: {
//         totalUsers: 0,
//         currentPage: page,
//         totalPages: 0,
//         paginatedUser: [],
//       },
//       message: "No User Found",
//     });
//   }

//   const pagination = {
//     totalUsers,
//     currentPage: page,
//     totalPages: Math.ceil(totalUsers / limit),
//     paginatedUser: users,
//   };

//   if (skip + limit < totalUsers) pagination.next = { page: page + 1 };
//   if (skip > 0) pagination.prev = { page: page - 1 };

//   return res.status(200).json({ user: pagination, message: "User Found Successful" });
// });

// export const getAllUser = asyncHandler(async (req, res) => {
//   const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//   const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
//   const search = (req.query.search || "").trim();
//   const skip = (page - 1) * limit;

//   const adminRoles = ["Admin", "SOC Manager", "CISO"];
//   const match = {};

//   // Restrict non-admins by branch
//   if (!adminRoles.includes(req.me?.role)) {
//     match.branch = req.me?.branch;
//   }

// if (search.length >= 3 && /^[a-zA-Z0-9\s]+$/.test(search)) {
//   match.$text = { $search: search };
// } else {
//   match.$or = [
//     { name: { $regex: search, $options: "i" } },
//     { role: { $regex: search, $options: "i" } },
//     { index: { $regex: search, $options: "i" } },
//     { branch: { $regex: search, $options: "i" } },
//     { email: { $regex: search, $options: "i" } },
//     { status: { $regex: search, $options: "i" } },
//   ];
// }


//   const [result] = await Users.aggregate([
//     { $match: match },
//     ...(search && search.length >= 3
//       ? [{ $addFields: { score: { $meta: "textScore" } } }]
//       : []),
//     {
//       $sort:
//         search && search.length >= 3
//           ? { score: -1, createdAt: -1, _id: -1 }
//           : { createdAt: -1, _id: -1 },
//     },
//     {
//       $facet: {
//         items: [
//           { $skip: skip },
//           { $limit: limit },
//           { $project: { password: 0, ...(search.length >= 3 ? { score: 1 } : {}) } },
//         ],
//         meta: [{ $count: "totalUsers" }],
//       },
//     },
//     {
//       $project: {
//         items: 1,
//         totalUsers: { $ifNull: [{ $arrayElemAt: ["$meta.totalUsers", 0] }, 0] },
//       },
//     },
//   ]);

//   const totalUsers = result?.totalUsers ?? 0;
//   const totalPages = totalUsers ? Math.ceil(totalUsers / limit) : 0;

//   return res.status(200).json({
//     user: {
//       totalUsers,
//       currentPage: page,
//       totalPages,
//       paginatedUser: result?.items ?? [],
//       next: page < totalPages ? { page: page + 1 } : undefined,
//       prev: page > 1 ? { page: page - 1 } : undefined,
//     },
//     message: totalUsers ? "User Found Successful" : "No User Found",
//     success: true,
//   });
// });


// export const getAllUser = asyncHandler(async (req, res) => {
//   const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//   const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
//   const search = (req.query.search || "").trim();
//   const skip = (page - 1) * limit;

//   const adminRoles = ["Admin", "SOC Manager", "CISO"];
  
//   // 1. Base Match Object
//   const match = {};

//   // 2. Security: Filter by branch for non-admins immediately (Uses Index { branch: 1 })
//   if (!adminRoles.includes(req.me?.role)) {
//     match.branch = req.me?.branch;
//   }

//   // 3. Search Logic
//   if (search) {
//     // Escaping special regex characters to prevent crashing
//     const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//     // OPTION A: For "Contains" search (Slower on millions of rows, but finds "Abid" from "bi")
//     // match.$or = [
//     //   { name: { $regex: searchSafe, $options: "i" } },
//     //   { email: { $regex: searchSafe, $options: "i" } },
//     //   { index: { $regex: searchSafe, $options: "i" } },
//     //   { branch: { $regex: searchSafe, $options: "i" } },
//     // ];

//     // OPTION B: For "Performance/Scale" (Fastest, hits index, finds "Abid" from "Abi")
//     // This is recommended for millions of rows if you don't use Atlas Search.
//     match.$or = [
//       { name: { $regex: `^${searchSafe}`, $options: "i" } }, // ^ means "starts with"
//       { email: { $regex: `^${searchSafe}`, $options: "i" } },
//       { index: { $regex: `^${searchSafe}`, $options: "i" } },
//       // Fallback to general regex for fields where index isn't critical
//       { role: { $regex: searchSafe, $options: "i" } }, 
//     ];
//   }

//   // 4. Aggregation Pipeline
//   const pipeline = [
//     { $match: match },
//     {
//       $facet: {
//         items: [
//           // Sort by creation desc
//           { $sort: { createdAt: -1, _id: -1 } }, 
//           { $skip: skip },
//           { $limit: limit },
//           // Don't send password
//           { $project: { password: 0 } }, 
//         ],
//         meta: [{ $count: "totalUsers" }],
//       },
//     },
//     {
//       $project: {
//         items: 1,
//         totalUsers: { $ifNull: [{ $arrayElemAt: ["$meta.totalUsers", 0] }, 0] },
//       },
//     },
//   ];

//   const [result] = await Users.aggregate(pipeline);

//   const totalUsers = result?.totalUsers ?? 0;
//   const totalPages = totalUsers ? Math.ceil(totalUsers / limit) : 0;

//   return res.status(200).json({
//     user: {
//       totalUsers,
//       currentPage: page,
//       totalPages,
//       paginatedUser: result?.items ?? [],
//       // next/prev logic...
//     },
//     message: totalUsers ? "User Found Successful" : "No User Found",
//     success: true,
//   });
// });

export const getUserRoles = asyncHandler(async (req, res) => {
  // 1. Define the branch you want to exclude (from your frontend logic)
  const excludedBranch = "99341-Information Security, IT Risk Management & Fraud Control Division";

  // 2. Build the filter
  const match = {
    branch: { $ne: excludedBranch } // $ne means "Not Equal"
  };

  // Optional: If you want to restrict non-admins to seeing only roles in their own branch
  // const adminRoles = ["Admin", "SOC Manager", "CISO"];
  // if (!adminRoles.includes(req.me?.role)) {
  //    match.branch = req.me?.branch;
  // }

  // 3. Get distinct roles instantly
  const roles = await Users.distinct("role", match);

  res.status(200).json({
    success: true,
    roles: roles.sort() // Return sorted list
  });
});

export const getSingleUser = asyncHandler(async (req, res) => {
  const { role, branch, roles } = req.query;
  const match = {};

  // 1. Filter by Branch (if provided)
  if (branch) {
    match.branch = branch;
  }

  // 2. Filter by Specific Role
  if (role) {
    match.role = role;
  }

  // 3. Filter by Multiple Roles (for your "assigned" case)
  // Logic: Find a user whose role is IN the provided list
  if (roles) {
    match.role = { $in: roles.split(",") }; 
  }

  // 4. Find exactly ONE user (Very fast)
  const user = await Users.findOne(match).select("-password -accessToken");

  res.status(200).json({
    success: true,
    user: user || null, // Returns null if no one matches
  });
});


export const getAllUser = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const search = (req.query.search || "").trim();
  const skip = (page - 1) * limit;

  const adminRoles = ["Admin", "SOC Manager", "CISO"];
  
  // 1. Base Match
  const match = {};

  // 2. Branch Security Filter
  if (!adminRoles.includes(req.me?.role)) {
    match.branch = req.me?.branch;
  }

  // 3. Search Logic (Fixed for Partial Matches)
  if (search) {
    // Escape special characters to prevent errors
    const searchSafe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    match.$or = [
      // REMOVED '^' to allow matching ANYWHERE in the string
      { name: { $regex: searchSafe, $options: "i" } },  
      { index: { $regex: searchSafe, $options: "i" } },
      { email: { $regex: searchSafe, $options: "i" } },
      { role: { $regex: searchSafe, $options: "i" } },
      // Only include branch search if user is Admin, otherwise they can only see their branch
      ...(adminRoles.includes(req.me?.role) 
          ? [{ branch: { $regex: searchSafe, $options: "i" } }] 
          : [])
    ];
  }

  const [result] = await Users.aggregate([
    { $match: match },
    {
      $facet: {
        items: [
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { password: 0 } },
        ],
        meta: [{ $count: "totalUsers" }],
      },
    },
    {
      $project: {
        items: 1,
        totalUsers: { $ifNull: [{ $arrayElemAt: ["$meta.totalUsers", 0] }, 0] },
      },
    },
  ]);

  const totalUsers = result?.totalUsers ?? 0;
  const totalPages = totalUsers ? Math.ceil(totalUsers / limit) : 0;

  return res.status(200).json({
    user: {
      totalUsers,
      currentPage: page,
      totalPages,
      paginatedUser: result?.items ?? [],
      next: page < totalPages ? { page: page + 1 } : undefined,
      prev: page > 1 ? { page: page - 1 } : undefined,
    },
    message: totalUsers ? "User Found Successful" : "No User Found",
    success: true,
  });
});


export const getAllUsersNoPagination = asyncHandler(async (req, res) => {
// 1. Define the branch to exclude (matching your frontend logic)
  const SECURITY_BRANCH = "99341-Information Security, IT Risk Management & Fraud Control Division";

  // 2. Use .distinct() to get ONLY unique roles where branch is NOT Security
  const uniqueRoles = await Users.distinct("role", {
    branch: { $ne: SECURITY_BRANCH }
  });

  // 3. (Optional) Filter out any null or empty strings if data is dirty
  const validRoles = uniqueRoles.filter((role) => role);

  return res.status(200).json({
    success: true,
    count: validRoles.length,
    roles: validRoles, // Returns ["BSIT", "INFRA DB Admin", "Admin", ...]
  });
});


export const getAllLevel1Users = asyncHandler(async (req, res) => {
  const adminRoles = ["Admin", "SOC Manager", "CISO"];

  // 1. Base Match Object
  const match = {};

  // 2. Branch Security (If user is not Admin, restrict to their branch)
  if (!adminRoles.includes(req.me?.role)) {
    match.branch = req.me?.branch;
  }

  // 3. ✅ FILTER LOGIC: Get only "Level_1"
  // Using Regex to handle "Level_1" or "Level 1" safely (Case Insensitive)
  match.role = { $regex: /^Level.?1$/i };

  // 4. ✅ SORT & FETCH LOGIC:
  // .find(match)   -> Gets all matching users (No Limit)
  // .sort(...)     -> Replaces .reverse() (Newest First)
  // .select(...)   -> Excludes password for security
  // .lean()        -> optimization for large datasets (returns plain JSON)
  const users = await Users.find(match)
    .select("-password -accessToken") 
    .sort({ createdAt: -1 }) 
    .lean();

  return res.status(200).json({
    success: true,
    message: "Level_1 Users Fetched Successfully",
    count: users.length,
    user: users, // Returns the array of users directly
  });
});



// export const getAllUser = asyncHandler(async (req, res) => {
//    const allUsers = await Users.find().select("-password").sort({ createdAt: -1 });

//   const page = parseInt(req.query.page, 10) || 1;
//   const limit = parseInt(req.query.limit, 10) || 10;
//   const startIndex = (page - 1) * limit;
//   const endIndex = page * limit;

//   // Determine which users to show based on role
//   let visibleUsers;
//   if (
//     req.me?.role === "Admin" ||
//     req.me?.role === "SOC Manager" ||
//     req.me?.role === "CISO"
//   ) {
//     visibleUsers = allUsers;
//   } else {
//     visibleUsers = allUsers.filter((u) => u.branch === req.me.branch);
//   }

//   // Handle empty case
//   if (visibleUsers.length === 0) {
//     return res.status(404).json({ message: "No User Found" });
//   }

//   // Slice for pagination
//   const paginatedUser = visibleUsers.slice(startIndex, endIndex);

//   // Build pagination metadata
//   const pagination = {
//     totalUsers: visibleUsers.length,
//     currentPage: page,
//     totalPages: Math.ceil(visibleUsers.length / limit),
//     paginatedUser,
//   };

//   if (endIndex < visibleUsers.length) {
//     pagination.next = { page: page + 1 };
//   }
//   if (startIndex > 0) {
//     pagination.prev = { page: page - 1 };
//   }

//   return res
//     .status(200)
//     .json({ user: pagination, message: "User Found Successful" });


//   // const user = await Users.find().select("-password");

//   // const page = parseInt(req.query.page) || 1;
//   // const limit = parseInt(req.query.limit) || 10;
//   // const startIndex = (page - 1) * limit;
//   // const endIndex = page * limit;

//   // if (
//   //   req.me?.role === "Admin" ||
//   //   req.me?.role === "SOC Manager" ||
//   //   req.me?.role === "CISO"
//   // ) {
//   //   const paginatedUser = user.slice(startIndex, endIndex);

//   //   //pagination result
//   //   const pagination = {};
//   //   if (endIndex < user.length) {
//   //     pagination.next = {
//   //       page: page + 1,
//   //     };
//   //   }
//   //   if (startIndex > 0) {
//   //     pagination.prev = {
//   //       page: page - 1,
//   //     };
//   //   }

//   //   pagination.totalUsers = user.length;
//   //   pagination.currentPage = page;
//   //   pagination.totalPages = Math.ceil(user.length / limit);
//   //   pagination.paginatedUser = paginatedUser;

//   //   //check user
//   //   if (user.length === 0) {
//   //     return res.status(404).json({ message: "No User Found" });
//   //   }
//   //   res
//   //     .status(200)
//   //     .json({ user: pagination, message: "User Found Successful" });
//   // } else {
//   //   const filteredUsers = user.filter((u) => u.branch === req.me.branch);
//   //   const paginatedUser = filteredUsers.slice(startIndex, endIndex);

//   //   //pagination result
//   //   const pagination = {};
//   //   if (endIndex < user.length) {
//   //     pagination.next = {
//   //       page: page + 1,
//   //     };
//   //   }
//   //   if (startIndex > 0) {
//   //     pagination.prev = {
//   //       page: page - 1,
//   //     };
//   //   }

//   //   pagination.totalUsers = filteredUsers.length;
//   //   pagination.currentPage = page;
//   //   pagination.totalPages = Math.ceil(filteredUsers.length / limit);
//   //   pagination.paginatedUser = paginatedUser;

//   //   //check user
//   //   if (user.length === 0) {
//   //     return res.status(404).json({ message: "No User Found" });
//   //   }
//   //   res
//   //     .status(200)
//   //     .json({ user: pagination, message: "User Found Successful" });
//   // }
// });

/**
 * @description : get all user Pending Tasks
 * @method : GET
 * @access : public
 * @route : '/api/v1/user/pending-tasks'
 */
// export const getAllUserWithPendingTasks = asyncHandler(async (req, res) => {
//   const users = await Users.find().populate("task");

//   // Check if users exist
//   if (!users) {
//     return res.status(404).json({ message: "No User Found" });
//   }

//   // Calculate pending tasks for each user
//   const usersWithPendingTasks = users.map((user) => {
//     const pendingTasks = user.task.filter((task) => task.status === "pending");

//     return {
//       name: user.name,
//       branch: user.branch,
//       department: user.department,
//       pendingTasksCount: pendingTasks.length,
//       pendingTasks: pendingTasks,
//     };
//   });

//   res
//     .status(200)
//     .json({ usersWithPendingTasks, message: "User Found with Pending Tasks" });
// });

/**
 * @description : get single user
 * @method : GET
 * @access : public
 * @route : '/api/v1/user'
 */
// export const getSingleUserDepartment = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const user = await Users.findById(id).populate("department");

//   res.status(200).json({
//     userDepartment: user.department,
//     user,
//     message: "User Found Successful",
//   });
// });

/**
 * @description : create user
 * @method : POST
 * @access : public
 * @route : '/api/v1/user'
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  //data validation

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // password hash
  const createHashPassword = await bcrypt.hash(password, 10);

  //check valid Email
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid Email" });
  }

  //check valid Phone
  if (!isValidPhoneNumber(phone)) {
    return res.status(400).json({ message: "Invalid Phone No" });
  }

  // email check
  const isEmailExists = await Users.findOne({ email });

  if (isEmailExists) {
    return res.status(400).json({ message: "Email Already Exists" });
  }

  // phone check
  const isPhoneExists = await Users.findOne({ phone });

  if (isPhoneExists) {
    return res.status(400).json({ message: "Phone Already Exists" });
  }

  //check file exist

  let photoFile = null;
  if (req.file) {
    const data = await fileUploadToCloud(req.file.path);
    photoFile = data.secure_url;
  }

  //user create

  const newUser = await Users.create({
    name,
    email,
    phone,
    password: createHashPassword,
    photo: photoFile,
  });
  // response

  res.status(201).json({ user: newUser, message: "User created Successful" });
});

/**
 * @description : update user
 * @method : PUT/PATCH
 * @access : public
 * @route : '/api/v1/user'
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, index, role, status } = req.body;

  // Check if the user exists
  const existsUser = await Users.findOne({ _id: id });

  if (!existsUser) {
    return res.status(400).json({
      message: "User Not Exists",
    });
  }

  const userUpdate = await Users.findOneAndUpdate(
    { _id: existsUser._id },
    {
      $set: { name, index, role, status },
    },
    { new: true }
  );

  if (!userUpdate) {
    return res.status(500).json({ message: "Failed to update user" });
  }

  res.status(200).json({
    success: true,
    user: userUpdate,
    message: "User Update Successful",
  });
});

/**
 * @description : delete user
 * @method : DELETE
 * @access : public
 * @route : '/api/v1/user'
 */

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedUser = await Users.findByIdAndDelete(id);

  await fileDeleteFromCloud(getPublicID(deletedUser.photo));

  res
    .status(200)
    .json({ user: deletedUser, message: "User delete Successful" });
});
