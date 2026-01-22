import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../features/auth/authSlice";
import "./Dashboard.css";
import { motion, AnimatePresence } from "framer-motion";

import { useEffect, useState } from "react";

import pdf from "../../assets/frontend/img/icons8-pdf-40.png";

import BarChart from "../../components/Chart/BarChart";
import API from "../../utils/api";
import Title from "../../components/Title/Title";
import { alertSelector } from "../../features/incoming/alertSlice";
import { getAllAlert } from "../../features/incoming/alertApiSlice";
import { monitoringToolsSelector } from "../../features/incoming/monitoringToolsSlice";
import toolsArray from "./SOC_Monitoring_tools/ToolsArray";
import { getMonitoringToolsAvailability } from "../../features/incoming/monitoringToolsApiSlice";
import {
  Binoculars,
  BrickWallShield,
  CircleCheckBig,
  CircleX,
  FileSearch,
  PanelBottomClose,
  Rotate3d,
  Sigma,
  TriangleAlert,
  Users,
} from "lucide-react";
import { formatDateTimeReadable } from "../../utils/ConvertTime";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const Dashboard = () => {
  const { user } = useSelector(authSelector);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [session, setSession] = useState();
  const [allSessionUsers, setAllSessionUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const result = await API.get(`/api/v1/auth/sessionGet`);

        if (result.data.lastLogout) {
          setSession(result.data.lastLogout);
          setAllSessionUsers(result.data.sessionUsers);
        }

        if (
          !localStorage.getItem("sessionStarted") &&
          user.role === "Level_1"
        ) {
          setShowSessionModal(true);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
  }, [user?._id, showSessionModal]);

  const handleStartSession = async () => {
    try {
      const formData = { sessionUser: user?._id };
      const result = await API.post(`/api/v1/auth/sessionStart`, formData);
      if (result.data.session) {
        setShowSessionModal(false); // ✅ allow dashboard usage
        navigate("soc_monitoring_tools");
        localStorage.setItem("sessionStarted", "true");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  const dispatch = useDispatch();

  const {
    alertError,
    alertMessage,
    alert,
    totalAlerts,
    alertCounts,
    userWiseAlerts,
    alertLoader,
  } = useSelector(alertSelector);

  const { tools } = useSelector(monitoringToolsSelector);

  const selectedToolsName = tools?.map((item) =>
    item.sessionTools.map((tool) => ({
      tool: tool.tools,
      status: tool.loginStatus,
      operationalStatus: tool.operationalStatus,
      ReportingPersonel: tools.sessionUserName,
    })),
  );

  const [userList, setUserList] = useState([]);
  // const [newAlertCreatedList, setNewAlertCreatedList] = useState([]);
  // const [closeAlertList, setCloseAlertList] = useState([]);
  // const [alertIncidenceList, setAlertIncidenceList] = useState([]);
  // const [alertEscalatedList, setAlertEscalatedList] = useState([]);
  const [tpEvidenceFiles, setTpEvidenceFiles] = useState([]);

  // percentage calculation for progressbar
  const totalAlert = totalAlerts;

  const totalAlertPercent =
    totalAlert > 0 ? Math.min((totalAlert / totalAlert) * 100, 100) : 0;
  const closeAlertPercent =
    totalAlert > 0
      ? Math.min((alertCounts?.closed / totalAlert) * 100, 100)
      : 0;

  const incidencePercent =
    totalAlert > 0
      ? Math.min((alertCounts?.incidence / totalAlert) * 100, 100)
      : 0;

  const escalatedPercent =
    totalAlert > 0
      ? Math.min((alertCounts?.escalated / totalAlert) * 100, 100)
      : 0;

  const newAlertPercent =
    totalAlert > 0 ? Math.min((alertCounts?.open / totalAlert) * 100, 100) : 0;

  useEffect(() => {
    0;
    dispatch(getAllAlert());
    // setNewAlertCreatedList(
    //   alert.filter((item) => item.status === "open").length
    // );
    // setCloseAlertList(alert.filter((item) => item.status === "closed").length);
    // setAlertIncidenceList(
    //   alert.filter((item) => item.isIncidence === "yes").length
    // );
    // setAlertEscalatedList(
    //   alert.filter((item) => item.status === "escalated").length
    // );
  }, [dispatch, user]);

  // All user List and Number
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get(`/api/v1/user/paginatedUser`);
        setUserList(response.data.user.totalUsers);
      } catch (error) {
        throw new Error(error.response.data.message);
      }
    };

    fetchUser(); // Call fetchUser inside useEffect
  }, []);

  // const notClosedAlert =
  //   alert?.filter((item) => item?.status !== "closed") || [];

  // const userAlertMap = new Map();

  // notClosedAlert.forEach((item) => {
  //   // Handle author
  //   if (item?.author?._id) {
  //     if (!userAlertMap.has(item.author._id)) {
  //       userAlertMap.set(item.author._id, { ...item.author, alerts: [] });
  //     }
  //     userAlertMap.get(item.author._id).alerts.push(item);
  //   }

  //   // Handle assignedTo users
  //   if (Array.isArray(item?.assignedTo)) {
  //     item.assignedTo.forEach((user) => {
  //       if (user?._id) {
  //         if (!userAlertMap.has(user._id)) {
  //           userAlertMap.set(user._id, { ...user, alerts: [] });
  //         }
  //         userAlertMap.get(user._id).alerts.push(item);
  //       }
  //     });
  //   }
  // });

  // const userWiseAlerts = Array.from(userAlertMap.values());

  // const specificRoleWiseAlert = userWiseAlerts.filter(
  //   (loginUser) => loginUser.role === user.role
  // );

  // const userWiseAlertsDetails =
  //   user.role === "Admin" || user.role === "CISO" || user.role === "SOC Manager"
  //     ? userWiseAlerts.map((user) => ({
  //         userId: user._id,
  //         name: user.name,
  //         index: user.index,
  //         role: user.role,
  //         alert: user.alerts,
  //         alertCount: user.alerts.length,
  //       }))
  //     : specificRoleWiseAlert.map((user) => ({
  //         userId: user._id,
  //         name: user.name,
  //         index: user.index,
  //         role: user.role,
  //         alert: user.alerts,
  //         alertCount: user.alerts.length,
  //       }));

  const userWiseAlertsDetails =
    user.role === "Admin" || user.role === "CISO" || user.role === "SOC Manager"
      ? userWiseAlerts // Show everyone
      : userWiseAlerts?.filter((item) => item.role === user.role);

  // user Wise Pending Task

  const [viewPendingTaskModal, setViewPendingTaskModal] = useState(false);
  const [viewPendingTask, setViewPendingTask] = useState([]);

  const [viewAlertModal, setViewAlertModal] = useState(false);
  const [openAlertDetails, setOpenAlertDetails] = useState(false);

  const handleViewPendingTask = (item) => {
    setViewPendingTaskModal(true);
    setViewPendingTask(item);
  };

  const pendingModalClose = () => {
    setViewPendingTaskModal(false);
  };

  // halper contraints

  const SEVERITY_COLORS = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };
  const STATUS_COLORS = {
    closed: "bg-red-500/20 text-red-400",
    escalated: "bg-amber-500/20 text-amber-400",
    open: "bg-green-500/20 text-green-400",
    unassigned: "bg-sky-500/20 text-sky-400",
  };

  // chart data
  const chartData = {
    labels: [
      "Users",
      "New Alert Created",
      "Alert Escalated",
      "Incidence",
      "Closed",
      "Total Alert",
    ],
    datasets: [
      {
        label: "Number of Count",
        data: [
          userList,
          alertCounts?.open,
          alertCounts?.escalated,
          alertCounts?.incidence,
          alertCounts?.closed,
          totalAlert,
        ],
        borderWidth: 1,
      },
    ],
  };

  const closeModal = () => {
    setViewAlertModal(false);
  };

  const [alertView, setAlertView] = useState([]);

  // handle Alert view

  const handgleAlertView = (item) => {
    setViewAlertModal(true);
    setAlertView(item);
    setTpEvidenceFiles(item.uploadedEvidence);
  };

  const handleFileShow = (file) => {
    const fileName = file && file;
    const baseURL = import.meta.env.VITE_APP_URL;
    const filePath = `${baseURL}/files/${fileName}`;
    window.open(filePath, "_blank");
  };

  const alertFields = [
    { label: "Case Details", key: "caseDetails" },
    { label: "TP Impact", key: "tpImpact" },
    { label: "TP Remediation Actions", key: "tpRemedationNote" },
    { label: "Escalation", key: "escalation" },
    { label: "Escalation Reason", key: "escalationReason" },
  ];

  const filledFields = alertFields.filter(({ key }) => alertView[key]);

  const l2Fields = [
    { label: "Info Validation Notes", key: "infoValidationNotes" },
    { label: "IOC Validation Notes", key: "iocValidationNotes" },
    { label: "Investigation Findings", key: "investigationFindings" },
    { label: "Investigation Tools Used", key: "investigationToolsUsed" },
    {
      label: "Incident Declaration Required ",
      key: "incidentDeclarationRequired",
    },
  ];

  const filled2Fields = l2Fields.filter(({ key }) => alertView[key]);

  const l3Fields = [
    { label: "Root Cause Analysis", key: "rootCause" },
    { label: "Hand Back To L1 Assignee", key: "handBackToL1Assignee" },
    { label: "Hand Back Note", key: "handBackNoteToL1" },
  ];

  const filled3Fields = l3Fields.filter(({ key }) => alertView[key]);

  // handle edit button
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

  const fetchMonitoringTools = async () => {
    try {
      dispatch(getMonitoringToolsAvailability());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchMonitoringTools();
  }, []);

  // accordion functionality

  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  return (
    <>
      <Title title={"SEM | Dashboard"} />

      <div className="bg-gray-900 min-h-screen text-gray-200 font-sans py-13">
        <main className="p-6 py-4 md:p-8 space-y-8">
          {/* Header */}
          <header className="mb-6 border-b border-gray-700 pb-1">
            <h1 className="text-xl md:text-3xl font-bold text-white">
              Welcome, {user.name}!
            </h1>
            <p className="text-gray-400 text-sm mt-1">Dashboard Overview</p>
          </header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}

            <div className="space-y-6">
              <>
                {/* Hand back Note for current users starts  */}
                {user.branch ===
                  "99341-Information Security, IT Risk Management & Fraud Control Division" && (
                  <div className="bg-gray-800 rounded-2xl shadow-lg p-3">
                    <h2 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                      Hand Back Note from :{" "}
                      <span className="text-amber-600">
                        {session?.sessionUser.name}{" "}
                      </span>{" "}
                      for current User
                    </h2>

                    <div className="overflow-x-auto">
                      <div className="border border-gray-300 rounded-md shadow-sm">
                        <h2 id="accordion-collapse-heading-1">
                          <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-expanded={isOpen}
                            aria-controls="accordion-collapse-body-1"
                            className="flex items-center justify-between w-full p-2 px-5 font-medium cursor-pointer text-gray-300 rounded-t-md border-b hover:text-gray-700 hover:bg-gray-300 gap-3"
                          >
                            <span>Hand Back Notes ..............</span>
                            <svg
                              className={`w-5 h-5 shrink-0 transform transition-transform duration-300 ${
                                isOpen ? "rotate-180" : "rotate-0"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="m5 15 7-7 7 7"
                              />
                            </svg>
                          </button>
                        </h2>

                        <div
                          id="accordion-collapse-body-1"
                          aria-labelledby="accordion-collapse-heading-1"
                          ref={contentRef}
                          className={`transition-all duration-500 ease-in-out overflow-hidden ${
                            isOpen ? "max-h-screen" : "max-h-0"
                          }`}
                        >
                          <div className="p-4 md:p-5 text-gray-600">
                            <p className="mb-2 text-cyan-600">
                              {session?.sessionNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hand back Note for current users end  */}
              </>
              {/* Last Login Users */}
              <div className="bg-gray-800 rounded-2xl shadow-lg p-3">
                <h2 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                  Last Login Users
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-300">
                    <thead className="bg-gray-700 text-gray-100">
                      <tr>
                        <th className="py-2 px-3 text-left">#</th>
                        <th className="py-2 px-3 text-left">Session Users</th>
                        <th className="py-2 px-3 text-left">Start Time</th>
                        <th className="py-2 px-3 text-left">End Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(allSessionUsers) &&
                        allSessionUsers.map((user, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                          >
                            <td className="py-2 px-3">{index + 1}</td>
                            <td className="py-2 px-3">
                              {user.sessionUser.name}
                            </td>
                            <td className="py-2 px-3">
                              {formatDateTimeReadable(user.sessionStartTime)}
                            </td>
                            <td className="py-2 px-3">
                              {formatDateTimeReadable(user.sessionEndTime)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Wise Alert */}
              <div className="bg-gray-800 rounded-2xl shadow-lg p-3">
                <h2 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                  User Wise Alert
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-300">
                    <thead className="bg-gray-700 text-gray-100">
                      <tr>
                        <th className="py-2 px-3 text-left">#</th>
                        <th className="py-2 px-3 text-left">Initiator</th>
                        <th className="py-2 px-3 text-left">Index</th>
                        <th className="py-2 px-3 text-left">Role</th>
                        <th className="py-2 px-3 text-left">Count</th>
                        <th className="py-2 px-3 text-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userWiseAlertsDetails &&
                        userWiseAlertsDetails.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                          >
                            <td className="py-2 px-3">{index + 1}</td>
                            <td className="py-2 px-3">{item.name}</td>
                            <td className="py-2 px-3">{item.index}</td>
                            <td className="py-2 px-3">{item.role}</td>
                            <td className="py-2 px-3">{item.alertCount}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() =>
                                  handleViewPendingTask(item.alert)
                                }
                                className="text-sm"
                              >
                                <FileSearch className="w-5 h-5 text-blue-400 hover:text-blue-500 transition duration-200 cursor-pointer" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Monitoring Dashboard */}
              <div className="bg-gray-800 rounded-2xl shadow-lg p-4">
                <h2 className="text-lg font-semibold text-white mb-3  pb-2">
                  Monitoring Dashboard Login Status
                </h2>

                <div className="overflow-x-auto  bg-gray-800">
                  <table className="w-full text-sm text-gray-300">
                    <thead className="bg-gray-700 text-gray-100 ">
                      <tr>
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">Monitoring Tools</th>
                        <th className="py-2 px-1 text-center">Current</th>
                        <th className="py-2 px-1 text-center">2nd Session</th>
                        <th className="py-2 px-1 text-center">3rd Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(toolsArray) &&
                        toolsArray.map((tool, index) => {
                          const s1 = selectedToolsName[0]?.find(
                            (s) => s.tool === tool.toolsName,
                          );
                          const s2 = selectedToolsName[1]?.find(
                            (s) => s.tool === tool.toolsName,
                          );
                          const s3 = selectedToolsName[2]?.find(
                            (s) => s.tool === tool.toolsName,
                          );

                          const renderStatus = (session) =>
                            session ? (
                              session.status === "successful" ? (
                                <span className="flex justify-center items-center">
                                  <CircleCheckBig className="w-4 h-4 text-green-600" />
                                </span>
                              ) : (
                                <span className="flex justify-center items-center">
                                  <CircleX className="w-4 h-4 text-red-500" />
                                </span>
                              )
                            ) : (
                              <span className="flex justify-center items-center text-gray-400 text-xs">
                                Not Updated
                              </span>
                            );

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-700 hover:bg-gray-700/50 "
                            >
                              <td className="py-2 px-3">{index + 1}</td>
                              <td className="py-2 px-3">{tool.toolsName}</td>
                              <td className="py-2 px-3 text-center ">
                                {renderStatus(s1)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {renderStatus(s2)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {renderStatus(s3)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  {Array.isArray(tools) &&
                    tools.map((item, index) => (
                      <p key={index}>
                        {(() => {
                          const n = index + 1;
                          if (n === 1) return "Current";
                          if (n === 2) return "2nd";
                          if (n === 3) return "3rd";
                          return `${n}th`;
                        })()}{" "}
                        Session Reporting Time:{" "}
                        <span className="text-gray-200">
                          {formatDateTimeReadable(item.createdAt)}
                        </span>{" "}
                        | Reporting Personnel:{" "}
                        <span className="text-gray-200">
                          {item.sessionUserName}
                        </span>
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* === Left Column === */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col">
              <div className="mb-2">
                <h6 className="text-lg font-semibold text-cyan-400">
                  Operational Overview
                </h6>
              </div>

              {/* Chart Section */}
              <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-700">
                <div className="h-full">
                  <BarChart data={chartData} />
                </div>
              </div>

              {/* Modal for Pending Task */}
              {viewPendingTaskModal && (
                <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
                  <div className="bg-gray-800 rounded-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[80vh] overflow-y-auto shadow-xl border border-gray-700">
                    <div className="flex justify-between items-center p-2 px-4 border-b border-gray-700">
                      <h5 className="text-lg font-semibold !text-cyan-400">
                        Alert List
                      </h5>
                      <button
                        className="text-gray-400 hover:text-white cursor-pointer"
                        onClick={pendingModalClose}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-4">
                      <table className="w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700 text-gray-100 text-sm uppercase">
                          <tr>
                            <th className="py-2 px-2">#</th>
                            <th className="py-2 px-2">Alert ID</th>
                            <th className="py-2 px-2">Alert Name</th>
                            <th className="py-2 px-2">Severity</th>
                            <th className="py-2 px-2">Status</th>
                            <th className="py-2 px-2 text-center">View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewPendingTask?.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                            >
                              <td className="py-2 px-2">{index + 1}</td>
                              <td className="py-2 px-2">{item.alertId}</td>
                              <td className="py-2 px-2">{item.alertName}</td>
                              <td className="py-2 px-2 capitalize">
                                <span
                                  className="w-3 h-3 rounded-full mr-3 font-bold"
                                  style={{
                                    color: SEVERITY_COLORS[item.severity],
                                  }}
                                >
                                  {item.severity}
                                </span>
                              </td>
                              <td className="p-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    STATUS_COLORS[item.status]
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  onClick={() => handgleAlertView(item)}
                                  className="text-white px-2 py-1 rounded text-xs cursor-pointer"
                                >
                                  <Binoculars className="w-5 h-5 text-cyan-500" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* === Right Column === */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col">
              <h6 className="text-lg font-semibold text-cyan-400 mb-4">
                Monitoring Dashboard Operational Status
              </h6>

              <div className="overflow-x-auto   bg-gray-800">
                <table className="w-full text-sm text-gray-300">
                  <thead className="bg-gray-700 text-gray-100 ">
                    <tr>
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Monitoring Tools</th>
                      <th className="py-2 px-1 text-center">Current</th>
                      <th className="py-2 px-1 text-center">2nd Session</th>
                      <th className="py-2 px-1 text-center">3rd Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(toolsArray) &&
                      toolsArray.map((tool, index) => {
                        const session1Tool = selectedToolsName[0]?.find(
                          (s) => s.tool === tool.toolsName,
                        );
                        const session2Tool = selectedToolsName[1]?.find(
                          (s) => s.tool === tool.toolsName,
                        );
                        const session3Tool = selectedToolsName[2]?.find(
                          (s) => s.tool === tool.toolsName,
                        );

                        const renderStatus = (sessionTool) => {
                          if (!sessionTool)
                            return (
                              <span className="text-gray-500 text-xs">
                                Not Updated
                              </span>
                            );
                          if (sessionTool.operationalStatus === "operational")
                            return (
                              <i className="fa-regular fa-circle-check text-green-500"></i>
                            );
                          return (
                            <span className="flex items-center justify-center gap-1 text-red-400 text-xs">
                              <i className="fa-solid fa-xmark"></i>
                              {sessionTool.operationalStatus
                                .charAt(0)
                                .toUpperCase() +
                                sessionTool.operationalStatus
                                  .slice(1)
                                  .toLowerCase()}
                            </span>
                          );
                        };

                        return (
                          <tr
                            key={index}
                            className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                          >
                            <td className="py-2 px-2">{index + 1}</td>
                            <td className="py-2 px-2">{tool.toolsName}</td>
                            <td className="py-2 px-1 text-center">
                              {renderStatus(session1Tool)}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {renderStatus(session2Tool)}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {renderStatus(session3Tool)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-400 space-y-1">
                {Array.isArray(tools) &&
                  tools.map((item, index) => (
                    <p key={index}>
                      <span className="font-semibold text-gray-300">
                        {(() => {
                          const n = index + 1;
                          if (n === 1) return "Current";
                          if (n === 2) return "2nd";
                          if (n === 3) return "3rd";
                          return `${n}th`;
                        })()}
                      </span>{" "}
                      Session Reporting Time:{" "}
                      {formatDateTimeReadable(item.createdAt)} | Reporting
                      Personnel: {item.sessionUserName}
                    </p>
                  ))}
              </div>
            </div>
          </div>

          {/* last row code start */}
          <div className="bg-gray-900 text-gray-100 pb-10">
            {/* Dashboard Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {/* Users */}
              <div className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-15 h-15 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500">
                      <Users />
                      {/* <i className="fe fe-users text-lg"></i> */}
                    </div>
                    <h3 className="text-2xl font-bold">{userList}</h3>
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="text-sm text-gray-400">Users</h6>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full w-1/2"></div>
                  </div>
                </div>
              </div>

              {/* New Alert Created */}
              <div className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-full bg-red-600/20 text-red-400 border border-red-500">
                      <TriangleAlert />
                    </span>
                    <h3 className="text-2xl font-bold">{alertCounts?.open}</h3>
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="text-sm text-gray-400">New Alert Created</h6>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${newAlertPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Escalated Alert */}
              <div className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-full bg-yellow-600/20 text-red-400 border border-red-500">
                      <Rotate3d />
                    </span>
                    <h3 className="text-2xl font-bold">
                      {alertCounts?.escalated}
                    </h3>
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="text-sm text-gray-400">Escalated Alert</h6>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${escalatedPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Incident */}
              <div className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-full bg-pink-600/20 text-pink-400 border border-pink-500">
                      <BrickWallShield />
                    </span>
                    <h3 className="text-2xl font-bold">
                      {alertCounts?.incidence}
                    </h3>
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="text-sm text-gray-400">Incident</h6>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${incidencePercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Closed Alert */}
              <div className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-500">
                      <PanelBottomClose />
                    </span>
                    <h3 className="text-2xl font-bold">
                      {alertCounts?.closed}
                    </h3>
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="text-sm text-gray-400">Closed Alert</h6>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${closeAlertPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Total Alert */}
              <div className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500">
                      <Sigma />
                    </span>
                    <h3 className="text-2xl font-bold">{totalAlert}</h3>
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="text-sm text-gray-400">Total Alert</h6>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${totalAlertPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* last row code end */}

          {/* view alert details Modal */}

          {viewAlertModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50
          transition-opacity duration-500 ease-out"
            >
              <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-1">
                  <h2 className="text-lg font-semibold text-gray-200">
                    View Alert Details
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-600 hover:text-white text-sm font-bold pb-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Alert Details Toggle */}
                <div className="mt-4">
                  <button
                    onClick={() => setOpenAlertDetails(!openAlertDetails)}
                    className="border border-green-500 text-green-600 hover:bg-gray-600 font-medium text-sm px-4 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Alert Details
                  </button>

                  <AnimatePresence>
                    {openAlertDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        {/* Grid Section */}
                        <div className="grid md:grid-cols-3 gap-3 text-sm text-white">
                          <div>
                            <strong>Alert Name:</strong> {alertView.alertName}
                          </div>
                          <div>
                            <strong>Alert ID:</strong> {alertView.alertId}
                          </div>
                          <div>
                            <strong>Accepted Time:</strong>{" "}
                            {formatDateTimeReadable(
                              alertView.acceptedTime || "",
                            )}
                          </div>
                          <div>
                            <strong>Severity:</strong> {alertView.severity}
                          </div>
                          <div>
                            <strong>Event Time:</strong>{" "}
                            {formatDateTimeReadable(alertView.eventTime)}
                          </div>
                          <div>
                            <strong>Alert Source:</strong>{" "}
                            {alertView.alertSource}
                          </div>
                          <div>
                            <strong>Affected User Device:</strong>{" "}
                            {alertView.affectedUserDevice}
                          </div>
                          <div>
                            <strong>Affected IP/Website:</strong>{" "}
                            {alertView.affectedIpWebsite}
                          </div>
                          <div>
                            <strong>Verdict:</strong> {alertView.verdict}
                          </div>
                        </div>

                        {user.branch ===
                        "99341-Information Security, IT Risk Management & Fraud Control Division" ? (
                          <>
                            {/* True Positive Case Details */}
                            {filledFields?.length > 0 && (
                              <div className="mt-4">
                                <hr className="my-3" />
                                <h6 className="text-red-600 font-semibold mb-2">
                                  True Positive Case Details
                                </h6>
                                {filledFields.map(({ label, key }) => (
                                  <div key={key} className="text-sm mb-1">
                                    <strong>{label}:</strong> {alertView[key]}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Uploaded Evidence */}
                            {tpEvidenceFiles?.length > 0 && (
                              <div className="mt-4">
                                <strong className="text-sm">
                                  Uploaded Evidence:
                                </strong>
                                <div className="flex flex-wrap gap-4 mt-2">
                                  {tpEvidenceFiles.map((file, index) => (
                                    <div
                                      key={index}
                                      onClick={() => handleFileShow(file)}
                                      className="border border-gray-200 rounded-lg p-2 flex flex-col items-center cursor-pointer hover:shadow-md transition"
                                    >
                                      <img
                                        src={pdf}
                                        alt="pdf"
                                        className="w-8 h-8 mb-1"
                                      />
                                      <p className="text-xs text-gray-200">
                                        {file?.split("_").pop()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* L2 Processing Area */}
                            {filled2Fields?.length > 0 && (
                              <div className="mt-5">
                                <hr className="my-3" />
                                <h6 className="text-red-600 font-semibold mb-2">
                                  L2 Processing Area
                                </h6>
                                {filled2Fields.map(({ label, key }) => (
                                  <div key={key} className="text-sm mb-1">
                                    <strong>{label}:</strong> {alertView[key]}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Incident and Remediation Details */}
                            {filled3Fields?.length > 0 && (
                              <div className="mt-5">
                                <hr className="my-3" />
                                <h6 className="text-red-600 font-semibold mb-2">
                                  Details Information of Incidence and
                                  Remediation
                                </h6>
                                {filled3Fields.map(({ label, key }) => (
                                  <div key={key} className="text-sm mb-1">
                                    <strong>{label}:</strong> {alertView[key]}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Forward to L1 Assignee */}
                            {alertView.incidentDeclarationRequired === "no" && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-5"
                              >
                                <hr className="my-3" />
                                <h6 className="text-red-600 font-semibold mb-2">
                                  Details Forward to L1 Assignee
                                </h6>
                                <div className="text-sm space-y-2">
                                  <div>
                                    <strong>Hand Back To L1 Assignee:</strong>{" "}
                                    {alertView.handBackToL1Assignee}
                                  </div>
                                  <div>
                                    <strong>Investigation End Time:</strong>{" "}
                                    {formatDateTimeReadable(
                                      alertView.investigationEndTime,
                                    )}
                                  </div>
                                  <div>
                                    <strong>
                                      Hand Back Note to L1 Assignee:
                                    </strong>{" "}
                                    {alertView.handBackNoteToL1}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <>
                            {/* ===== Other Division Informed ===== */}
                            {alertView.fieldsToFill &&
                              alertView.fieldsToFill.length > 0 && (
                                <div className="mt-6">
                                  <h6 className="!text-amber-500 font-medium mb-3  underline underline-offset-8">
                                    Other Division Informed
                                  </h6>
                                  <hr className="border-gray-700 mb-4" />

                                  <div className="space-y-4">
                                    {Array.isArray(alertView.fieldsToFill) &&
                                      alertView.fieldsToFill.map(
                                        (field, index) => (
                                          <div
                                            key={index}
                                            className="bg-gray-800 p-3 rounded-lg border border-gray-700"
                                          >
                                            <label className="text-gray-200 font-medium">
                                              {`${
                                                field.role || "Unknown Role"
                                              }: Need to Perform requested Actions below`}
                                            </label>
                                            <ul className="list-disc ml-6 mt-2">
                                              <li className="text-red-400 text-sm">
                                                <span>
                                                  {field.value ||
                                                    "No action provided"}
                                                </span>
                                              </li>
                                            </ul>
                                          </div>
                                        ),
                                      )}
                                  </div>

                                  {/* ===== Previous Action Performed History ===== */}
                                  {(() => {
                                    const filteredFields =
                                      alertView.fieldsToFill.filter((field) => {
                                        const hasComments =
                                          field.comments?.trim() !== "";
                                        return (
                                          (field.isPerformed ===
                                            "notPerformed" &&
                                            hasComments) ||
                                          (field.isPerformed === "performed" &&
                                            !hasComments) ||
                                          (field.isPerformed === "performed" &&
                                            hasComments)
                                        );
                                      });

                                    return (
                                      filteredFields.length > 0 && (
                                        <div className="mt-6">
                                          <h6 className="!text-amber-500 font-medium mb-3  underline underline-offset-8">
                                            Previous Action Performed History
                                          </h6>
                                          <hr className="border-gray-700 mb-3" />

                                          <div className="space-y-4">
                                            {filteredFields.map(
                                              (field, index) => (
                                                <div
                                                  key={field._id || index}
                                                  className="bg-gray-900 border border-gray-700 p-4 rounded-lg"
                                                >
                                                  <p className="border-b border-gray-600 text-amber-400 w-fit pb-1 font-medium">
                                                    {field.role} :
                                                  </p>

                                                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
                                                    <div>
                                                      <strong className="text-gray-200">
                                                        Action Performed:
                                                      </strong>{" "}
                                                      <span className="text-gray-300">
                                                        {field.isPerformed}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
                                                    <div>
                                                      <strong className="text-gray-200">
                                                        Comments:
                                                      </strong>{" "}
                                                      <span className="text-gray-300">
                                                        {field.comments ||
                                                          "No Comments"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )
                                    );
                                  })()}
                                </div>
                              )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* session Modal */}
          {showSessionModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/30 "
              // Prevent click behind
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Box */}
              <div
                className="bg-gray-900 text-gray-100 rounded-xl shadow-2xl w-[90%] sm:w-[500px] max-w-lg transform transition-all duration-300 scale-100 border border-gray-700"
                tabIndex={-1}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-700 px-4 py-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fa fa-fire text-orange-500 text-xl"></i>
                    Welcome <span className="text-cyan-400">{user?.name}</span>
                  </h3>
                </div>

                {/* Body */}
                <div className="px-4 py-4">
                  <label
                    htmlFor="handoverNotes"
                    className="block text-green-400 text-sm font-medium border-b border-green-500 pb-1 mb-2"
                  >
                    {session
                      ? `Hand Over Notes From: ${session.sessionUser.name}`
                      : "No Previous Session"}
                  </label>
                  <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line px-2">
                    {session ? session.sessionNotes : "No HandOver Notes"}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-700 px-5 py-3">
                  <button
                    onClick={handleStartSession}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm py-2 px-4 rounded-md transition-all duration-200 shadow-md"
                  >
                    <i className="fa fa-play" aria-hidden="true"></i>
                    Start Your Session with Handover Notes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
