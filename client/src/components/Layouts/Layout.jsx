import logo from "../../assets/frontend/img/sonali-bank-logo.png";

import { Link, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { userLogout } from "../../features/auth/authApiSlice";
import { useEffect, useRef, useState } from "react";
import createToast from "../../utils/createToast";
import { authSelector, setEmptyMessage } from "../../features/auth/authSlice";
import timeAgo from "../../../../utils/timeAgo.js";
import API from "../../utils/api.js";

import Sidebar from "../Sidebar.jsx";

import Avatar from "../../components/Avatar/Avatar";
import "./Layout.css";

import socket from "../../helpers/socket.js";
import { notificationSelector } from "../../features/incoming/notificationSlice.js";
import {
  clearNotifications,
  getAllNotification,
} from "../../features/incoming/notificationApiSlice.js";
import {
  messageSelector,
  markUserAsRead,
} from "../../features/incoming/messageSlice.js";
import { alertSelector } from "../../features/incoming/alertSlice.js";
import ChatBox from "../ChatBox/ChatBox.jsx";

const Layout = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const pathParts = pathname.split("/");
  const lastPathPart = pathParts[pathParts.length - 1];

  const { error, message, user } = useSelector(authSelector);
  const { notifications, unreadCount } = useSelector(notificationSelector);
  const { alertError, alertMessage, alert, alertLoader } =
    useSelector(alertSelector);

  const dispatch = useDispatch();
  const [showSessionModal, setShowSessionModal] = useState(false);

  const userWiseNotificationShow = notifications
    .filter((item) => item.toRoles.includes(user.role))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(false);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const unreadNotifications = notifications
    .filter((item) => item.toRoles.includes(user.role) && item.read === false)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // latest first

  const unreadNotification = unreadNotifications.length;

  // show unread message
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [alertId, setAlertId] = useState("");

  const { messagesByAlertId, unreadCountMap } = useSelector(messageSelector);

  const totalUnread = Object.values(unreadCountMap || {}).reduce(
    (sum, messages) =>
      sum + messages.filter((msg) => msg.includes(user.role)).length,
    0
  );

  const findAlertNamesandMessageList = Object.keys(unreadCountMap)
    .filter((key) => !key.includes(","))
    .filter(
      (key) =>
        unreadCountMap[key].includes(user.role) &&
        unreadCountMap[key]?.length > 0
    )
    .map((alertId) => {
      const found = alert.find((a) => a._id === alertId);
      if (!found) return null;
      return {
        _id: found._id,
        alertId: found.alertId, // যদি found.alertId থাকে
      };
    })
    .filter(Boolean);

  const links = [];

  if (user.role === "Admin" ||  user.role === "SOC Manager" ||  user.role === "CISO" || user.role === "Level_1") {
    links.push({
      key: "create_alert",
      path: "/dashboard/create_alert",
      label: "Create Alert",
    });
  }
  if (user.role === "Admin" ||user.role === "SOC Manager" ||  user.role === "CISO" || user.role === "Level_2") {
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
    user.role === "Admin" || user.role === "SOC Manager" ||  user.role === "CISO"
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

  const toggleSubmenu = () => {
    setOpenSubmenu(!openSubmenu);
  };

  // fetch notificaion

  const handleNotificationClick = async () => {
    setIsNotificationOpen(!isNotificationOpen);

    if (!isNotificationOpen) {
      await dispatch(clearNotifications());

      // socket.emit("clearNotifications", user.role);
    }
    setIsNotificationOpen(false);
  };

  useEffect(() => {
    dispatch(getAllNotification());
  }, [dispatch]);

  const handleEndSession = async () => {
    const formData = {
      sessionNotes: input.sessionNotes,
      sessionUser: user?._id,
    };

    const result = await API.post(`/api/v1/auth/sessionEnd`, formData);

    if (result.data.message) {
      localStorage.removeItem("sessionStarted");
      dispatch(userLogout());
    }
  };

  // ✅ Logout button click
  const handleLogout = (e) => {
    e.preventDefault();

    if (user.role === "Level_1") {
      // Only show modal for Level_1
      setShowSessionModal(true);
    } else {
      // Otherwise, logout immediately
      dispatch(userLogout());
    }
  };

  useEffect(() => {
    if (message) {
      createToast(message, "success");
      dispatch(setEmptyMessage());
    }
    if (error) {
      createToast(error);
      dispatch(setEmptyMessage());
    }
  }, [message, error, dispatch]);

  const [activeItem, setActiveItem] = useState(lastPathPart);

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  const [input, setInput] = useState({
    sessionNotes: "",
  });

  const handleInputChange = (e) => {
    setInput((prev) => ({
      ...prev,
      sessionNotes: e.target.value,
    }));
  };

  const wordCount = input.sessionNotes
    ? input.sessionNotes.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const isTextRange = wordCount >= 50 && wordCount <= 150;

  // handle unread message
  const alertIds = Object.keys(messagesByAlertId);

  // find alert Name

  // console.log(alert?.find((item) => item._id === alertId));

  // const findAlertName = alert?.find()

  const handleChat = () => {
    // socket.emit("markAsRead", { alertId: alertIds, userRole: user.role });
    // dispatch(markUserAsRead({ alertId: alertIds, userRole: user.role }));
  };

  const notificationsToShow = [
    ...(findAlertNamesandMessageList || []),
    ...(alert?.filter(
      (item) => item.unreadBy?.length > 0 && item.unreadBy.includes(user.role)
    ) || []),
  ];

  const notificationLength = totalUnread
    ? totalUnread
    : notificationsToShow.length;

  const handleShowSessionModalClose = () => {
    setInput({ sessionNotes: "" });
    setShowSessionModal(false);
  };

  // new code

  const [openDropdown, setOpenDropdown] = useState(null);
  const wrapperRef = useRef(null);
  const notificationsRef = useRef(null);

  const toggleDropdown = async (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    if (dropdownName === "notifications") {
      await dispatch(clearNotifications());
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // const [openSubmenu, setOpenSubmenu] = useState(false);
  // const [activeItem, setActiveItem] = useState("dashboard");

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleOpenChatBox = (alertId) => {
    setIsChatOpen(true);
    setAlertId(alertId);
    socket.emit("markAsRead", { alertId, userRole: user.role });
    dispatch(markUserAsRead({ alertId, userRole: user.role }));
  };

  const messageRef = useRef();

  const handleClickOutside = (e) => {
    if (
      openDropdown === "messages" &&
      messageRef.current &&
      !messageRef.current.contains(e.target)
    ) {
      setOpenDropdown(null);
    }

    if (
      openDropdown === "notifications" &&
      notificationsRef.current &&
      !notificationsRef.current.contains(e.target)
    ) {
      setOpenDropdown(null);
    }

    if (
      openDropdown === "user" &&
      wrapperRef.current &&
      !wrapperRef.current.contains(e.target)
    ) {
      setOpenDropdown(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  return (
    <>
      <div className="main-wrapper">
        {/* Header */}

        <div className="flex items-center justify-between bg-gray-900 text-white px-8 py-2 border-b border-b-gray-700  shadow-md fixed top-0 left-0 right-0 z-50">
          {/* Left Section - Logo */}
          <div className="flex items-center space-x-40">
            <Link to="/dashboard" className="hidden sm:block">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
            </Link>
            <Link to="/dashboard" className="sm:hidden">
              <img src={logo} alt="Logo Small" className="h-8 w-8" />
            </Link>
            <button
              id="toggle_btn"
              className="ml-2 text-yellow-300 hover:text-yellow-400 fixed top-0 left-50 z-50 cursor-pointer"
              onClick={toggleSidebar}
            >
              <i className="fe fe-text-align-left text-xl text-amber-500"></i>
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 justify-center max-w-md px-10">
              <form className="relative w-full">
                <input
                  type="text"
                  placeholder="Search here"
                  className="w-full rounded-md bg-[#1E2939] text-white placeholder-gray-400 border border-green-500 focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none px-3 py-2 text-sm pr-8"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <i className="fa fa-search"></i>
                </button>
              </form>
            </div>
          </div>

          {/* Right Menu */}
          <ul className="flex items-center space-x-10 relative">
            {/* Messages */}
            <li className="relative">
              <button
                className="relative hover:text-yellow-300 transition"
                onClick={() => toggleDropdown("messages")}
              >
                <i className="fa-regular fa-envelope text-xl text-yellow-300 cursor-pointer"></i>
                {notificationLength > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {notificationLength}
                  </span>
                )}
              </button>

              <div ref={messageRef}>
                {openDropdown === "messages" && (
                  <div className="absolute right-0 mt-3.75 w-72 bg-gray-800 text-gray-200 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-700 font-semibold text-cyan-400">
                      Messages
                    </div>

                    <ul className="max-h-64 overflow-y-auto divide-y divide-gray-700">
                      {notificationsToShow.length === 0 && (
                        // Add this temporary message to see if the array is empty
                        <li className="px-4 py-3 text-gray-400">
                          No messages to show.
                        </li>
                      )}

                      {notificationsToShow.map((item, index) => (
                        <li
                          key={index}
                          className="px-4 py-3 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleOpenChatBox(item._id)}
                        >
                          <div className="flex items-start space-x-3">
                            <i className="fa-regular fa-comments text-cyan-400 text-lg mt-1"></i>
                            <p className="text-sm">
                              You have a new message on Alert ID:{" "}
                              <span className="font-semibold">
                                {item.alertId}
                              </span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>

            {/* Notifications */}
            <ul className="flex items-center space-x-6 relative">
              {/* Notifications */}
              <li className="relative">
                <button
                  className="relative hover:text-yellow-300 transition"
                  onClick={() => toggleDropdown("notifications")}
                >
                  <i className="fe fe-bell text-xl text-yellow-300 cursor-pointer"></i>
                  {unreadNotification > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 cursor-pointer">
                      {unreadNotification}
                    </span>
                  )}
                </button>

                <div ref={notificationsRef}>
                  {openDropdown === "notifications" && (
                    <div className="absolute right-0 mt-3.75 w-80 bg-gray-800 text-gray-200 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
                        <span className="font-semibold text-cyan-400">
                          Notifications
                        </span>
                        <button className="text-sm text-gray-400 hover:text-gray-200">
                          Clear All
                        </button>
                      </div>
                      <ul className="max-h-64 overflow-y-auto divide-y divide-gray-700">
                        {userWiseNotificationShow
                          .slice()

                          .map((item, index) => (
                            <li
                              key={index}
                              className="px-4 py-3 bg-yellow-50 text-gray-900 hover:bg-yellow-100 transition"
                            >
                              <div className="flex items-start space-x-3">
                                <i className="fa-regular fa-bell text-cyan-500 text-lg mt-1"></i>
                                <div>
                                  <p className="font-semibold text-sm">
                                    {item.title}
                                  </p>
                                  <p className="text-xs">{item.message}</p>
                                  <p className="text-xs text-gray-500">
                                    {timeAgo(item.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                      </ul>
                      <div className="px-4 py-2 border-t border-gray-700 text-center">
                        <a
                          href="#"
                          className="text-cyan-400 hover:underline text-sm"
                        >
                          View all Notifications
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            </ul>

            {/* User Menu */}
            <li ref={wrapperRef} className="relative">
              <button
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => toggleDropdown("user")}
              >
                <Avatar
                  className="rounded-full cursor-pointer"
                  width={40}
                  height={40}
                  alt={user.name}
                  url={user.photo && user.photo}
                />
              </button>
              {openDropdown === "user" && (
                <div className="absolute right-0 mt-2.5 w-56 bg-gray-800 text-gray-200 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
                    <Avatar
                      className="rounded-full "
                      width={35}
                      height={35}
                      alt={user.name}
                      url={user.photo && user.photo}
                    />
                    <div>
                      <h6 className="text-sm font-semibold">{user.name}</h6>
                      <p className="text-xs text-gray-400">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 cursor-pointer transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </li>
          </ul>
        </div>

        {/* /Header */}
        {/* Sidebar */}
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        {/* /Sidebar */}

        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          <Outlet />
        </div>
      </div>

      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50">
          {/* Modal Box */}
          <div className="bg-gray-900 text-gray-100 rounded-2xl shadow-lg w-full max-w-lg mx-3 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa fa-moon text-orange-400"></i>
                Good Bye {user?.name}
              </h2>
              <button
                style={{ cursor: "pointer" }}
                onClick={() => handleShowSessionModalClose()}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="px-3 py-4">
              <label className="block text-sm font-medium mb-2">
                Hand Over Notes <span className="text-red-500 text-lg">*</span>
              </label>

              <div className="mb-2 text-xs px-2">
                {wordCount < 50 || wordCount > 150 ? (
                  <span className="text-red-400">
                    {wordCount} words (50–150 required)
                  </span>
                ) : (
                  <span className="text-green-400">{wordCount} words</span>
                )}
              </div>

              <textarea
                rows={5}
                name="sessionNotes"
                value={input.sessionNotes}
                onChange={handleInputChange}
                placeholder="Hand over notes for next user..."
                className={`w-full p-3 rounded-md bg-transparent border text-sm outline-none resize-none transition-colors
                  ${
                    isTextRange
                      ? "border-green-500 focus:border-green-400"
                      : "border-red-500 focus:border-red-400"
                  }`}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
              <button
                onClick={handleEndSession}
                disabled={!isTextRange}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
                  ${
                    isTextRange
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-600 cursor-not-allowed text-gray-300"
                  }`}
              >
                <i className="fa fa-play"></i> End Your Session
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatBox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        alertId={alertId}
        user={user}
        messages={chatMessages}
        setMessages={setChatMessages}
      />
    </>
  );
};

export default Layout;

// <Modal
//   show={showSessionModal}
//   backdrop="static" // ⛔ prevents clicking outside
//   keyboard={true} // ⛔ prevents Esc key
//   centered
// >
//   <Modal.Header>
//     <Modal.Title style={{ fontSize: "17px" }}>
//       <i
//         class="fa fa-moon"
//         aria-hidden="true"
//         style={{ color: "#FB8B35", marginRight: "5px" }}
//       ></i>
//       Good Bye {user?.name}
//     </Modal.Title>
//   </Modal.Header>
//   <Modal.Body>
//     <Row>
//       <Form.Group controlId="truePositiveWho">
//         <Form.Label style={{ marginLeft: "5px" }}>
//           Hand Over Notes
//         </Form.Label>{" "}
//         <span>
//           {wordCount < 50 || wordCount > 150 ? (
//             <span style={{ color: "red", fontSize: "13px" }}>
//               {wordCount} words (50-150 required)
//             </span>
//           ) : (
//             <span style={{ color: "green", fontSize: "13px" }}>
//               {wordCount} words
//             </span>
//           )}
//         </span>
//         <span
//           style={{
//             color: "red",
//             fontSize: "20px",
//             verticalAlign: "middle",
//           }}
//         >
//           *
//         </span>
//         <Form.Control
//           as="textarea"
//           rows={5}
//           name="sessionNotes"
//           value={input.sessionNotes}
//           // onChange={handleInputChange}
//           placeholder="Hand over notes for next user..."
//           onChange={(e) => {
//             handleInputChange(e);
//             e.target.style.height = "auto"; // reset height
//             e.target.style.height = `${e.target.scrollHeight}px`; // adjust height
//           }}
//           className="form-control"
//           style={{
//             borderColor: isTextRange ? "green" : "red",
//             backgroundColor: "transparent",
//             resize: "none",
//           }}
//         />
//       </Form.Group>
//     </Row>
//   </Modal.Body>
//   <Modal.Footer>
//     <button
//       // class=" bg-primary-light"
//       onClick={handleEndSession}
//       class={`btn btn-sm ${
//         isTextRange ? "bg-danger-light" : "bg-secondary-light"
//       }`}
//       disabled={!isTextRange}
//     >
//       <i class="fa fa-play" aria-hidden="true"></i> End Your Session
//     </button>
//   </Modal.Footer>
// </Modal>

// <div className="header">
//   {/* Logo */}
//   <div className="header-left">
//     <Link to="/dashboard" className="logo">
//       <img src={logo} alt="Logo" />
//     </Link>
//     <Link to="/dashboard" className="logo logo-small">
//       <img src={logo} alt="Logo" width={30} height={30} />
//     </Link>
//   </div>
//   {/* /Logo */}
//   <a href="javascript:void(0);" id="toggle_btn">
//     <i
//       className="fe fe-text-align-left"
//       style={{ color: "#F1D592" }}
//     ></i>
//   </a>
//   <div className="top-nav-search">
//     <form>
//       <input
//         type="text"
//         placeholder="Search here"
//         className="w-full rounded-md bg-[#1E2939] text-white placeholder-gray-400 border border-green-500 focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none px-3 py-2 text-sm"
//       />

//       <button className="btn" type="submit">
//         <i className="fa fa-search" style={{ color: "gray" }} />
//       </button>
//     </form>
//   </div>
//   {/* Mobile Menu Toggle */}
//   <a className="mobile_btn" id="mobile_btn">
//     <i className="fa fa-bars" />
//   </a>
//   {/* /Mobile Menu Toggle */}

//   {/* Header Right Menu */}
//   <ul className="nav user-menu">
//     {/* message box */}
//     <li className="nav-item dropdown noti-dropdown">
//       <a
//         href="#"
//         className="dropdown-toggle nav-link"
//         data-bs-toggle="dropdown"
//       >
//         <i
//           style={{ fontSize: "1.2rem", color: "#F1D592" }}
//           className="fa-regular fa-envelope"
//         ></i>

//         {/* 🔴 যদি unread থাকে তখনই badge দেখাবে */}
//         {notificationLength > 0 && (
//           <span
//             style={{
//               position: "absolute",
//               top: "15px",
//               right: "5px",
//               background: "red",
//               color: "white",
//               borderRadius: "50%",
//               padding: "2px 2px",
//               fontSize: "10px",
//             }}
//             className="badge"
//           >
//             {notificationLength}
//           </span>
//         )}
//       </a>

//       {/* Dropdown এ show করা */}
//       <div className="dropdown-menu notifications">
//         <div className="topnav-dropdown-header">
//           <span className="notification-title">Messages</span>
//         </div>
//         <div className="noti-content">
//           <ul className="notification-list">
//             {notificationsToShow.map((item, index) => (
//               <li
//                 key={index}
//                 className="notification-message"
//                 onClick={() => handleOpenChatBox(item._id)}
//               >
//                 <a href="#">
//                   <div className="notify-block d-flex">
//                     <span className="avatar avatar-sm flex-shrink-0">
//                       <i className="fa-regular fa-comments"></i>
//                     </span>
//                     <div className="media-body flex-grow-1">
//                       <p
//                         className="noti-details"
//                         style={{
//                           marginTop: "0px",
//                           fontSize: "0.8rem",
//                         }}
//                       >
//                         <span className="noti-title">
//                           {`You have new message on Alerts : AlertID: ${item.alertId}  `}
//                         </span>
//                       </p>
//                       {/* <p className="noti-time">
//                             <span className="notification-time">
//                               {timeAgo(item.createdAt)}
//                             </span>
//                           </p> */}
//                     </div>
//                   </div>
//                 </a>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </li>

//     {/* message box */}
//     {/* Notifications */}
//     <li className="nav-item dropdown noti-dropdown">
//       <a
//         href="#"
//         className="dropdown-toggle nav-link"
//         data-bs-toggle="dropdown"
//         onClick={handleNotificationClick}
//       >
//         <i
//           className="fe fe-bell"
//           style={{ fontSize: "1.2rem", color: "#F1D592" }}
//         />{" "}
//         {unreadNotification > 0 && (
//           <span
//             style={{
//               position: "absolute",
//               top: "15px",
//               right: "1px",
//               background: "red",
//               color: "white",
//               borderRadius: "50%",
//               padding: "3px 6px",
//               fontSize: "12px",
//             }}
//             className="badge"
//           >
//             {unreadCount}
//           </span>
//         )}
//       </a>
//       <div className="dropdown-menu notifications">
//         <div className="topnav-dropdown-header">
//           <span className="notification-title">Notifications</span>
//           <a href="javascript:void(0)" className="clear-noti">
//             {" "}
//             Clear All{" "}
//           </a>
//         </div>
//         <div className="noti-content">
//           <ul className="notification-list">
//             {userWiseNotificationShow.reverse().map((item, index) => (
//               <li
//                 key={index}
//                 className="notification-message"
//                 style={{
//                   backgroundColor: "lightyellow",
//                   marginTop: "7px",
//                 }}
//               >
//                 <a href="#">
//                   <div className="notify-block d-flex">
//                     <span className="avatar avatar-sm flex-shrink-0">
//                       <i class="fa-regular fa-bell"></i>
//                     </span>

//                     <div className="media-body flex-grow-1">
//                       <p
//                         className="noti-details"
//                         style={{ marginTop: "-18px" }}
//                       >
//                         <span className="noti-title">{item.title}</span>{" "}
//                         <br />
//                         <span className="noti-title">
//                           {item.message}
//                         </span>
//                       </p>
//                       <p className="noti-time">
//                         <span className="notification-time">
//                           {timeAgo(item.createdAt)}
//                         </span>
//                       </p>
//                     </div>
//                   </div>
//                 </a>
//               </li>
//             ))}
//           </ul>
//         </div>
//         <div className="topnav-dropdown-footer">
//           <a href="#">View all Notifications</a>
//         </div>
//       </div>
//     </li>
//     {/* /Notifications */}

//     {/* User Menu */}
//     <li className="nav-item dropdown has-arrow">
//       <a
//         href="#"
//         className="dropdown-toggle nav-link"
//         data-bs-toggle="dropdown"
//       >
//         <span className="user-img">
//           <Avatar
//             className="rounded-circle"
//             width={40}
//             height={40}
//             alt={user.name}
//             url={user.photo && user.photo}
//           />
//         </span>
//       </a>
//       <div className="dropdown-menu">
//         <div className="user-header">
//           <div className="avatar avatar-sm">
//             <Avatar
//               className="rounded-circle"
//               width={31}
//               alt={user.name}
//               url={user.photo && user.photo}
//             />
//           </div>
//           <div className="user-text">
//             <h6>{user.name}</h6>
//             <p className="text-muted mb-0">{user.role}</p>
//           </div>
//         </div>

//         <Link
//           className="dropdown-item"
//           onClick={handleLogout}
//           to="/login"
//         >
//           Logout
//         </Link>
//       </div>
//     </li>
//     {/* /User Menu */}
//   </ul>
//   {/* /Header Right Menu */}
// </div>
