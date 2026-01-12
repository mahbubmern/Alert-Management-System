import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { authSelector } from "../features/auth/authSlice";
import {
  Archive,
  BellPlus,
  BugPlay,
  ChevronDown,
  ClipboardClock,
  Cog,
  HandCoins,
  LayoutDashboard,
  MonitorCog,
  Siren,
  Spotlight,
  SwitchCamera,
  TrendingDown,
  Users,
} from "lucide-react";

export default function Sidebar({ isSidebarCollapsed, setIsSidebarCollapsed }) {
  const [openSubmenu, setOpenSubmenu] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const { error, message, user } = useSelector(authSelector);

  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleItemClick = (item) => setActiveItem(item);
  const toggleSubmenu = () => setOpenSubmenu((prev) => !prev);

  const links = [];

  if (
    user.role === "Admin" ||
    user.role === "SOC Manager" ||
    user.role === "CISO" ||
    user.role === "Level_1" ||
    user.role === "Auditor"
  ) {
    links.push({
      key: "create_alert",
      path: "/dashboard/create_alert",
      label: "Create Alert",
    });
  }
  if (
    user.role === "Admin" ||
    user.role === "SOC Manager" ||
    user.role === "CISO" ||
    user.role === "Level_2" || 
    user.role === "Auditor"
  ) {
    links.push({
      key: "escalated_alert",
      path: "/dashboard/escalated_alert",
      label: "Escalated Alert",
    });
  }

  if (
    user.role === "INFRA DB Admin" ||
    user.role === "INFRA App Admin" ||
    user.role === "INFRA System Admin" ||
    user.role === "INFRA Network Admin" ||
    user.role === "ITSM Admin" ||
    user.role === "BSIT Admin" ||
    user.role === "CARD Admin" ||
    user.role === "Admin" ||
    user.role === "SOC Manager" ||
    user.role === "CISO" ||
    user.role === "Auditor"
  ) {
    links.push(
      {
        key: "pending_alert",
        path: "/dashboard/pending",
        label: "Pending Alert",
      },
      {
        key: "assigned",
        path: "/dashboard/assigned",
        label: "Assigned Alert",
      }
    );
  }

  return (
    <>
      {/* Toggle Button */}

      {/* Sidebar */}
      <div
        className={`fixed py-13 top-0 left-0 h-screen bg-gray-800 text-white transition-all duration-300 ease-in-out overflow-hidden
          ${isSidebarCollapsed ? "w-16" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div className="mt-5 flex-1 overflow-y-auto">
            <ul className="space-y-1 px-2">
              <li>
                <Link
                  to="/dashboard"
                  onClick={() => handleItemClick("dashboard")}
                  className={`flex items-center gap-3 px-3 py-2 rounded  hover:bg-gray-900 transition-colors ${
                    user.role === "Level_1"
                      ? location.pathname === "/dashboard"
                        ? "bg-gray-700"
                        : ""
                      : activeItem === "dashboard"
                      ? "bg-gray-700"
                      : ""
                  }`}
                >
                  <LayoutDashboard />
                  {!isSidebarCollapsed && <span>Dashboard</span>}
                </Link>
              </li>

              <li>
                <Link
                  to="/dashboard/users"
                  onClick={() => handleItemClick("user")}
                  className={`flex items-center gap-3 px-3 py-2 rounded  hover:bg-gray-900 transition-colors ${
                    activeItem === "user" ? "bg-gray-700" : ""
                  }`}
                >
                  <Users />

                  {!isSidebarCollapsed && <span>Users</span>}
                </Link>
              </li>

              {user.role === "Admin" ||
              user.role === "Level_2" ||
              user.role === "SOC Manager" ||
              user.role === "CISO" ||user.role === "Auditor" ? (
                <li>
                  <Link
                    to="/dashboard/vulnerability_Management_portal"
                    onClick={() =>
                      handleItemClick("vulnerability_Management_portal")
                    }
                    className={`flex items-center gap-3 px-3 py-2 rounded  hover:bg-gray-900 transition-colors ${
                      activeItem === "vulnerability_Management_portal"
                        ? "bg-gray-700"
                        : ""
                    }`}
                  >
                    <i className="fe fe-users" />{" "}
                    {!isSidebarCollapsed && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.9rem",
                          lineHeight: "1.2",
                        }}
                      >
                        Vulnerability Management <br /> Portal
                      </span>
                    )}
                  </Link>
                </li>
              ) : (
                ""
              )}

              {user.branch ===
                "99341-Information Security, IT Risk Management & Fraud Control Division" && (
                <li>
                  <Link
                    to="/dashboard/soc_monitoring_tools"
                    onClick={() => handleItemClick("soc_monitoring_tools")}
                    className={`flex items-center gap-3 px-3 py-2 rounded  hover:bg-gray-900 transition-colors ${
                      location.pathname === "/dashboard/soc_monitoring_tools"
                        ? "bg-gray-700"
                        : ""
                    }`}
                  >
                    <MonitorCog />

                    {!isSidebarCollapsed && <span>SOC Monitoring Tools</span>}
                  </Link>
                </li>
              )}

              {/* submenu */}
              <li className="relative">
                <button
                  onClick={toggleSubmenu}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-gray-700 transition-colors duration-300 cursor-pointer ${
                    openSubmenu ? "bg-gray-800" : ""
                  }`}
                >
                  <Siren className="text-amber-500" />

                  {/* Show text only when sidebar is not collapsed */}
                  {!isSidebarCollapsed && (
                    <span className="text-amber-500 font-semibold">Alert</span>
                  )}

                  {/* Chevron icon with smooth rotation */}
                  {!isSidebarCollapsed && (
                    <ChevronDown
                      className={`ml-auto transition-transform duration-300 ease-in-out  w-5 h-5 text-amber-500 ${
                        openSubmenu ? "rotate-360" : "rotate-270"
                      }`}
                    />
                  )}
                </button>

                {/* Smooth submenu transition */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    openSubmenu && !isSidebarCollapsed
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {!isSidebarCollapsed && (
                    <ul className="mt-1 space-y-1 pl-8 border-l border-gray-700">
                      {/* {user.branch !==
                        "99341-Information Security, IT Risk Management & Fraud Control Division" && ( */}
                      <>
                        {links.map((link) => (
                          <li key={link.key}>
                            <Link
                              to={link.path}
                              onClick={() => handleItemClick(link.key)}
                              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                                activeItem === link.key ? "bg-gray-700" : ""
                              }`}
                            >
                              {link.key === "pending_alert" ? (
                                <TrendingDown />
                              ) : (
                                <HandCoins />
                              )}

                              <span>{link.label}</span>
                            </Link>
                          </li>
                        ))}
                      </>
                      {/* )} */}

                      {/* Security Division Only */}
                      {user.branch ===
                        "99341-Information Security, IT Risk Management & Fraud Control Division" && (
                        <>
                          {/* Create Alert
                          <li>
                            <Link
                              to="/dashboard/create_alert"
                              onClick={() => handleItemClick("create_alert")}
                              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                                activeItem === "create_alert"
                                  ? "bg-gray-700"
                                  : ""
                              }`}
                            >
                              <BellPlus />
                              <span>Create Alert</span>
                            </Link>
                          </li> */}

                          <li>
                            <Link
                              to="/dashboard/self_assigned"
                              onClick={() => handleItemClick("self_assigned")}
                              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                                activeItem === "self_assigned"
                                  ? "bg-gray-700"
                                  : ""
                              }`}
                            >
                              <SwitchCamera />
                              <span>Self Assigned</span>
                            </Link>
                          </li>

                          <li>
                            <Link
                              to="/dashboard/follow_up_alert"
                              onClick={() => handleItemClick("follow_up_alert")}
                              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                                activeItem === "follow_up_alert"
                                  ? "bg-gray-700"
                                  : ""
                              }`}
                            >
                              <Spotlight />
                              <span>Follow up Alert</span>
                            </Link>
                          </li>

                          <li>
                            <Link
                              to="/dashboard/incidence_register"
                              onClick={() =>
                                handleItemClick("incidence_register")
                              }
                              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                                activeItem === "incidence_register"
                                  ? "bg-gray-700"
                                  : ""
                              }`}
                            >
                              <BugPlay />
                              <span>Incidence Register</span>
                            </Link>
                          </li>
                        </>
                      )}

                      {/* Admin Only */}
                      {(user.role === "Admin" || user.role === "CISO" || user.role === "Auditor") && (
                        <li>
                          <Link
                            to="/dashboard/incidence_pending_stage"
                            onClick={() =>
                              handleItemClick("incidence_pending_stage")
                            }
                            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                              activeItem === "incidence_pending_stage"
                                ? "bg-gray-700"
                                : ""
                            }`}
                          >
                            <i className="fe fe-activity" />
                            <span>Incidence Pen Stage</span>
                          </Link>
                        </li>
                      )}

                      {/* Archive */}
                      <li>
                        <Link
                          to="/dashboard/archive"
                          onClick={() => handleItemClick("archive")}
                          className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                            activeItem === "archive" ? "bg-gray-700" : ""
                          }`}
                        >
                          <Archive />
                          <span>Archive</span>
                        </Link>
                      </li>

                      {/* Report (Security Division Only) */}
                      {user.branch ===
                        "99341-Information Security, IT Risk Management & Fraud Control Division" && (
                        <li>
                          <Link
                            to="/dashboard/report"
                            onClick={() => handleItemClick("report")}
                            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-900 transition-colors duration-300 ${
                              activeItem === "report" ? "bg-gray-700" : ""
                            }`}
                          >
                            <ClipboardClock />
                            <span>Report</span>
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </li>

              <li>
                <Link
                  to="/dashboard/settings"
                  onClick={() => handleItemClick("settings")}
                  className={`flex items-center gap-3 px-3 py-2  rounded  hover:bg-gray-900 transition-colors ${
                    activeItem === "settings" ? "bg-gray-700" : ""
                  }`}
                >
                  <Cog />

                  {!isSidebarCollapsed && <span>Settings</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// <div className="sidebar" id="sidebar">
//   <div className="sidebar-inner slimscroll">
//     <div id="sidebar-menu" className="sidebar-menu">
//       <ul>
//         <li>
//           <Link
//             to="/dashboard"
//             onClick={() => handleItemClick("dashboard")}
//             style={{
//               backgroundColor:
//                 activeItem === "dashboard" ? "#00d0f1" : "",
//             }}
//           >
//             <i className="fe fe-home" /> <span>Dashboard</span>
//           </Link>
//         </li>

//         <li>
//           <Link
//             to="/dashboard/users"
//             onClick={() => handleItemClick("user")}
//             style={{
//               backgroundColor: activeItem === "user" ? "#00d0f1" : "",
//             }}
//           >
//             <i className="fe fe-users" /> <span>Users</span>
//           </Link>
//         </li>

// {user.role === "Admin" ||
// user.role === "Level_2" ||
// user.role === "Soc Manager" ? (
//   <li>
//     <Link
//       to="/dashboard/vulnerability_Management_portal"
//       onClick={() =>
//         handleItemClick("vulnerability_Management_portal")
//       }
//       style={{
//         backgroundColor:
//           activeItem === "vulnerability_Management_portal"
//             ? "#00d0f1"
//             : "",
//       }}
//     >
//       <i className="fe fe-users" />{" "}
//       <span
//         style={{
//           display: "block",
//           fontSize: "0.9rem",
//           lineHeight: "1.2",
//         }}
//       >
//         Vulnerability Management <br /> Portal
//       </span>
//     </Link>
//   </li>
// ) : (
//   ""
// )}

// {user.branch ===
//   "99341-Information Security, IT Risk Management & Fraud Control Division" && (
//   <li>
//     <Link
//       to="/dashboard/soc_monitoring_tools"
//       onClick={() => handleItemClick("soc_monitoring_tools")}
//       style={{
//         backgroundColor:
//           activeItem === "soc_monitoring_tools"
//             ? "#00d0f1"
//             : "",
//       }}
//     >
//       <i className="fe fe-activity" />{" "}
//       <span>SOC Monitoring Tools</span>
//     </Link>
//   </li>
// )}

//         <li className="submenu">
//           <Link
//             to="#"
//             className={openSubmenu ? "subdrop" : ""}
//             onClick={toggleSubmenu}
//           >
//             <i className="fe fe-folder"></i>
//             <span>Alert</span>
//             <span className="menu-arrow">
//               <i className="fe fe-chevron-right"></i>
//             </span>
//           </Link>

//           <ul>
//             {links.map((link) => (
//               <li key={link.key}>
//                 <Link
//                   to={link.path}
//                   onClick={() => handleItemClick(link.key)}
//                   style={{
//                     backgroundColor:
//                       activeItem === link.key ? "#00d0f1" : "",
//                   }}
//                 >
//                   <i className="fe fe-activity" />{" "}
//                   <span>{link.label}</span>
//                 </Link>
//               </li>
//             ))}

//             {user.branch ===
//               "99341-Information Security, IT Risk Management & Fraud Control Division" && (
//               <>
//                 <li>
//                   <Link
//                     to="/dashboard/self_assigned"
//                     onClick={() => handleItemClick("self_assigned")}
//                     style={{
//                       backgroundColor:
//                         activeItem === "self_assigned" ? "#00d0f1" : "",
//                     }}
//                   >
//                     <i className="fe fe-activity" />{" "}
//                     <span>Self Assigned</span>
//                   </Link>
//                 </li>

//                 <li>
//                   <Link
//                     to="/dashboard/follow_up_alert"
//                     onClick={() => handleItemClick("follow_up_alert")}
//                     style={{
//                       backgroundColor:
//                         activeItem === "follow_up_alert"
//                           ? "#00d0f1"
//                           : "",
//                     }}
//                   >
//                     <i className="fe fe-activity" />{" "}
//                     <span>Follow up Alert</span>
//                   </Link>
//                 </li>

//                 {/* incidence register */}
//                 <li>
//                   <Link
//                     to="/dashboard/incidence_register"
//                     onClick={() =>
//                       handleItemClick("incidence_register")
//                     }
//                     style={{
//                       backgroundColor:
//                         activeItem === "incidence_register"
//                           ? "#00d0f1"
//                           : "",
//                     }}
//                   >
//                     <i className="fe fe-activity" />{" "}
//                     <span> Incidence Register</span>
//                   </Link>
//                 </li>
//               </>
//             )}

//             {user.role == "Admin" ? (
//               <li>
//                 <Link
//                   to="/dashboard/incidence_pending_stage"
//                   onClick={() =>
//                     handleItemClick("incidence_pending_stage")
//                   }
//                   style={{
//                     backgroundColor:
//                       activeItem === "incidence_pending_stage"
//                         ? "#00d0f1"
//                         : "",
//                   }}
//                 >
//                   <i className="fe fe-activity" />{" "}
//                   <span> Incidence Pen Stage</span>
//                 </Link>
//               </li>
//             ) : (
//               ""
//             )}

//             <li>
//               <Link
//                 to="/dashboard/archive"
//                 onClick={() => handleItemClick("archive")}
//                 style={{
//                   backgroundColor:
//                     activeItem === "archive" ? "#00d0f1" : "",
//                 }}
//               >
//                 <i className="fe fe-activity" /> <span> Archive</span>
//               </Link>
//             </li>
//           </ul>
//         </li>
//         {user.branch ===
//           "99341-Information Security, IT Risk Management & Fraud Control Division" && (
//           <li>
//             <Link
//               to="/dashboard/report"
//               onClick={() => handleItemClick("report")}
//               style={{
//                 backgroundColor:
//                   activeItem === "report" ? "#00d0f1" : "",
//               }}
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="lightblue"
//                 viewBox="0 0 24 24"
//                 strokeWidth={0.5}
//                 stroke="currentColor"
//                 className="size-6"
//                 style={{ width: "28px", marginLeft: "-4px" }}
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
//                 />
//               </svg>

//               <span> Report </span>
//             </Link>
//           </li>
//         )}

//         <li>
//           <Link
//             to="/dashboard/settings"
//             onClick={() => handleItemClick("profile")}
//             style={{
//               backgroundColor:
//                 activeItem === "profile" ? "#00d0f1" : "",
//             }}
//           >
//             <i className="fe fe-user-plus" /> <span>Settings</span>
//           </Link>
//         </li>
//       </ul>
//     </div>
//   </div>
// </div>

//                            <ul>
//     <li>
//       <Link
//         to="/dashboard"
//         onClick={() => handleItemClick("dashboard")}
//         style={{
//           backgroundColor:
//             activeItem === "dashboard" ? "#00d0f1" : "",
//         }}
//       >
//         <i className="fe fe-home" /> <span>Dashboard</span>
//       </Link>
//     </li>

//     <li>
//       <Link
//         to="/dashboard/users"
//         onClick={() => handleItemClick("user")}
//         style={{
//           backgroundColor: activeItem === "user" ? "#00d0f1" : "",
//         }}
//       >
//         <i className="fe fe-users" /> <span>Users</span>
//       </Link>
//     </li>

//     {user.role === "Admin" ||
//     user.role === "Level_2" ||
//     user.role === "Soc Manager" ? (
//       <li>
//         <Link
//           to="/dashboard/vulnerability_Management_portal"
//           onClick={() =>
//             handleItemClick("vulnerability_Management_portal")
//           }
//           style={{
//             backgroundColor:
//               activeItem === "vulnerability_Management_portal"
//                 ? "#00d0f1"
//                 : "",
//           }}
//         >
//           <i className="fe fe-users" />{" "}
//           <span
//             style={{
//               display: "block",
//               fontSize: "0.9rem",
//               lineHeight: "1.2",
//             }}
//           >
//             Vulnerability Management <br /> Portal
//           </span>
//         </Link>
//       </li>
//     ) : (
//       ""
//     )}

//     {user.branch ===
//       "99341-Information Security, IT Risk Management & Fraud Control Division" && (
//       <li>
//         <Link
//           to="/dashboard/soc_monitoring_tools"
//           onClick={() => handleItemClick("soc_monitoring_tools")}
//           style={{
//             backgroundColor:
//               activeItem === "soc_monitoring_tools"
//                 ? "#00d0f1"
//                 : "",
//           }}
//         >
//           <i className="fe fe-activity" />{" "}
//           <span>SOC Monitoring Tools</span>
//         </Link>
//       </li>
//     )}

//     <li className="submenu">
//       <Link
//         to="#"
//         className={openSubmenu ? "subdrop" : ""}
//         onClick={toggleSubmenu}
//       >
//         <i className="fe fe-folder"></i>
//         <span>Alert</span>
//         <span className="menu-arrow">
//           <i className="fe fe-chevron-right"></i>
//         </span>
//       </Link>

//       <ul>
//         {links.map((link) => (
//           <li key={link.key}>
//             <Link
//               to={link.path}
//               onClick={() => handleItemClick(link.key)}
//               style={{
//                 backgroundColor:
//                   activeItem === link.key ? "#00d0f1" : "",
//               }}
//             >
//               <i className="fe fe-activity" />{" "}
//               <span>{link.label}</span>
//             </Link>
//           </li>
//         ))}

//         {user.branch ===
//           "99341-Information Security, IT Risk Management & Fraud Control Division" && (
//           <>
//             <li>
//               <Link
//                 to="/dashboard/self_assigned"
//                 onClick={() => handleItemClick("self_assigned")}
//                 style={{
//                   backgroundColor:
//                     activeItem === "self_assigned" ? "#00d0f1" : "",
//                 }}
//               >
//                 <i className="fe fe-activity" />{" "}
//                 <span>Self Assigned</span>
//               </Link>
//             </li>

//             <li>
//               <Link
//                 to="/dashboard/follow_up_alert"
//                 onClick={() => handleItemClick("follow_up_alert")}
//                 style={{
//                   backgroundColor:
//                     activeItem === "follow_up_alert"
//                       ? "#00d0f1"
//                       : "",
//                 }}
//               >
//                 <i className="fe fe-activity" />{" "}
//                 <span>Follow up Alert</span>
//               </Link>
//             </li>

//             {/* incidence register */}
//             <li>
//               <Link
//                 to="/dashboard/incidence_register"
//                 onClick={() =>
//                   handleItemClick("incidence_register")
//                 }
//                 style={{
//                   backgroundColor:
//                     activeItem === "incidence_register"
//                       ? "#00d0f1"
//                       : "",
//                 }}
//               >
//                 <i className="fe fe-activity" />{" "}
//                 <span> Incidence Register</span>
//               </Link>
//             </li>
//           </>
//         )}

//         {user.role == "Admin" ? (
//           <li>
//             <Link
//               to="/dashboard/incidence_pending_stage"
//               onClick={() =>
//                 handleItemClick("incidence_pending_stage")
//               }
//               style={{
//                 backgroundColor:
//                   activeItem === "incidence_pending_stage"
//                     ? "#00d0f1"
//                     : "",
//               }}
//             >
//               <i className="fe fe-activity" />{" "}
//               <span> Incidence Pen Stage</span>
//             </Link>
//           </li>
//         ) : (
//           ""
//         )}

//         <li>
//           <Link
//             to="/dashboard/archive"
//             onClick={() => handleItemClick("archive")}
//             style={{
//               backgroundColor:
//                 activeItem === "archive" ? "#00d0f1" : "",
//             }}
//           >
//             <i className="fe fe-activity" /> <span> Archive</span>
//           </Link>
//         </li>
//       </ul>
//     </li>
//     {user.branch ===
//       "99341-Information Security, IT Risk Management & Fraud Control Division" && (
//       <li>
//         <Link
//           to="/dashboard/report"
//           onClick={() => handleItemClick("report")}
//           style={{
//             backgroundColor:
//               activeItem === "report" ? "#00d0f1" : "",
//           }}
//         >
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             fill="lightblue"
//             viewBox="0 0 24 24"
//             strokeWidth={0.5}
//             stroke="currentColor"
//             className="size-6"
//             style={{ width: "28px", marginLeft: "-4px" }}
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
//             />
//           </svg>

//           <span> Report </span>
//         </Link>
//       </li>
//     )}

//     <li>
//       <Link
//         to="/dashboard/settings"
//         onClick={() => handleItemClick("profile")}
//         style={{
//           backgroundColor:
//             activeItem === "profile" ? "#00d0f1" : "",
//         }}
//       >
//         <i className="fe fe-user-plus" /> <span>Settings</span>
//       </Link>
//     </li>
//   </ul>
