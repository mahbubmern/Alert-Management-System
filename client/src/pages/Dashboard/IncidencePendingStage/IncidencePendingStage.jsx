import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import Title from "../../../components/Title/Title";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../features/auth/authSlice";
import { alertSelector } from "../../../features/incoming/alertSlice";
import {
  editAlert,
  getAllAlert,
  updateIncidenceDeclaration,
  updateInvestigationAlert,
} from "../../../features/incoming/alertApiSlice.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);

import pdf from "../../../assets/frontend/img/icons8-pdf-40.png";
import ReactPaginate from "react-paginate";
import createToast from "../../../utils/createToast.js";
import Swal from "sweetalert2";
import ChatBox from "../../../components/ChatBox/ChatBox.jsx";
import socket from "../../../helpers/socket.js";
import {
  markUserAsRead,
  messageSelector,
} from "../../../features/incoming/messageSlice.js";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader,
  Printer,
  ScanSearch,
  Search,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { usePrintHelper } from "../../../utils/ConvertTime.js";
import AlertReport from "../../../components/AlertReport/AlertReport.jsx";

import { BlobProvider } from "@react-pdf/renderer";
import AlertStepper from "../../../components/Stepper/Stepper.jsx";
import { useDebounce } from "../../../hooks/debounce.jsx";
import API from "../../../utils/api.js";

const IncidencePendingStage = () => {
  // chatting section start
  const [messages, setMessages] = useState([
    // { type: "bot", text: "Hi! How can I help you?" },
    // { type: "user", text: "Hello! I want to learn Socket.IO" },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { messagesByAlertId, unreadCountMap } = useSelector(messageSelector);

  // chatting section end
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerdict, setIsVerdict] = useState("Choose");

  const [tpEvidenceFiles, setTpEvidenceFiles] = useState([]);
  const [currentDate, setCurrentDate] = useState("");

  // Pagination State
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const selectedPage = useRef(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms

  const dispatch = useDispatch();
  const { alertError, alertMessage, alert, alertLoader } =
    useSelector(alertSelector);
  const { user, loader, error, message } = useSelector(authSelector);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [showPdf, setShowPdf] = useState(false);
  // chat

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [alertId, setAlertId] = useState("");

  const closeModal = () => {
    // Close the modal
    setIsModalOpen(false);
  };

  const formatDateTimeReadable = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-US", options).replace(",", "");
  };
  // form Data init

  const [input, setInput] = useState({
    alertName: "",
    alertSource: "",
    eventTime: "",
    affectedIpWebsite: "",
    affectedUserDevice: "",
    verdict: "Choose",
    acceptedTime: "",
    file: null,
    tpImpact: "",
    escalation: "",
    fpNote: "",
    who: "",
    when: "",
    what: "",
    where: "",
    why: "",
    how: "",
    tpImpact: "",
    tpRemedationNote: "",
    authorRole: "",
    infoValidationNotes: "",
    iocValidationNotes: "",
    investigationFindings: "",
    investigationToolsUsed: "",
    incidentDeclarationRequired: "",
    investigationEndTime: "",
    handBackToL1Assignee: "",
    handBackNoteToL1: "",
  });

  const wordCount = input.fpNote
    ? input.fpNote.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleCommunicationSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("_id", input._id);
    formData.append("authorId", input.author._id);
    formData.append("authorName", user.name);
    formData.append("authorIndex", user.index);
    formData.append("verdict", input.verdict);
    formData.append("escalation", input.escalation);
    formData.append("communication", input.communication);
    formData.append("authorRole", user.role);

    // Simple validation
    if (
      input.verdict === "true_positive" &&
      input.escalation === "yes" &&
      input.communication.trim()
    ) {
      try {
        const result = await dispatch(updateInvestigationAlert(formData));

        if (updateInvestigationAlert.fulfilled.match(result)) {
          // ✅ Message saved to DB, now fetch latest alert data
          const alertResult = await dispatch(getAllAlert());

          if (getAllAlert.fulfilled.match(alertResult)) {
            const alertList = alertResult.payload.alert; // ✅ get the array safely

            const updatedAlert = alertList.find(
              (item) => item._id === input._id
            );

            if (updatedAlert?.communicationLog) {
              setMessages(updatedAlert.communicationLog);
              setInput((prev) => ({
                ...prev,
                communication: "",
              }));
              createToast("Message Sent", "success");
            }
          } else {
            createToast("Message saved but failed to sync UI", "warning");
          }
        } else {
          createToast("Failed to send message", "error");
          console.error("Server Error:", result.error.message);
        }
      } catch (err) {
        createToast("Unexpected error", "error");
        console.error("Error:", err);
      }
    }
  };

  const handleFileShow = (file) => {
    const fileName = file && file;
    const halffilepath = `http://localhost:5050/files`;
    const filePath = `${halffilepath}/${file}`;
    window.open(filePath, "_blank");
  };

  // useEffect(() => {
  //   if (!user?._id || !Array.isArray(alert)) return;

  //   const filtered = alert.filter(
  //     (item) =>
  //       item.incidentDeclarationRequired === "yes" &&
  //       item.isIncidence == "pending"
  //   );

  //   setData(filtered);
  // }, [alert, user._id]);

  // alert accepted Datatable Initialization

  const [alertView, setAlertView] = useState([]);

  const alertFields = [
    { label: "Info Validation Notes", key: "infoValidationNotes" },
    { label: "IOC Validation Notes", key: "iOCValidationNotes" },
    { label: "Investigation Findings", key: "investigationFindings" },
    { label: "Investigation Tools Used", key: "investigationToolsUsed" },
    {
      label: "Incident Declaration Required",
      key: "incidentDeclarationRequired",
    },
    {
      label: "Incident Declaration Reason",
      key: "incidentDeclarationReason",
    },
  ];

  const filledFields = alertFields.filter(({ key }) => alertView[key]);

  //   // new tailwind design
  // for table
  const [openAlertDetails, setOpenAlertDetails] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });
  const [enabled, setEnabled] = useState({});

  const alertFields2 = [
    { label: "Incident Declaration", key: "isIncidence" },
    { label: "IRP Initiated", key: "irp" },
    { label: "L2 Root Cause Analysis", key: "rootCause" },
    { label: "L2 Remediation Plan", key: "l2RemediationPlan" },
    // { label: "L2 Remediation Execution Log", key: "l2RemediationExecutionLog" },
    { label: "L2 Remediation Validation", key: "l2RemediationValidation" },
    // { label: "L2 Remediation Actions Doc", key: "l2RemediationActionDoc" },
    { label: "L2 Resolution Timestamp", key: "l2ResolutionTimestamp" },
    { label: "Hand Back To L1 Assignee", key: "handBackToL1Assignee" },
    { label: "Hand Bank Note to L1 Assignee", key: "handBackNoteToL1" },
  ];

  const filledFields2 = alertFields2.filter(({ key }) => alertView[key]);

  // --- Helper Constants ---
  const SEVERITY_COLORS = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };
  const STATUS_COLORS = {
    incidence: "bg-red-500/20 text-red-400",
    escalated: "bg-amber-500/20 text-amber-400",
    open: "bg-green-500/20 text-green-400",
    unassigned: "bg-sky-500/20 text-sky-400",
  };

  // table Headers

  const tableHeaders = [
    "Initiator",
    "Alert ID",
    "Alert Time",
    "Event Time",
    "Alert Name",
    "Alert Source",
    "Severity",
    // ...(user?.role === "Admin" ? ["Change Role"] : []),
    "Status",
    "Actions",
    // ...(user?.role === "Admin" ? ["Actions"] : []),
  ];

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <ChevronDown className="h-4 w-4 text-gray-500" />;
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4 text-white" />
    ) : (
      <ChevronDown className="h-4 w-4 text-white" />
    );
  };

  // handle User details information view

  const formatDatetimeLocal = (dateString) => {
    if (!dateString) return ""; // Safely return empty string for invalid input
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Return empty if date is invalid

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // Format: 'YYYY-MM-DDTHH:MM'
  };

  const handleFollowUp = (row) => {
    const formattedEventTime = formatDatetimeLocal(row.eventTime);
    const formattedUpdatedTime = formatDatetimeLocal(row.acceptedTime);
    const investigationEndTime = formatDatetimeLocal(row.investigationEndTime);
    setInput({
      ...row,
      eventTime: formattedEventTime,
      acceptedTime: formattedUpdatedTime,
      investigationEndTime: investigationEndTime,
    });
    setIsModalOpen(true);
    setTpEvidenceFiles(row.uploadedEvidence);

    const matchAlert = alert.find((item) => item._id === row._id);

    setMessages(matchAlert?.communicationLog);
    setAlertView(row);
  };

  // handle Chat

  const handleChat = (row) => {
    setIsChatOpen(true);
    setAlertId(row._id);
    // socketRef.current.emit("markAsRead", { alertId: row._id , userRole: user.role });
    socket.emit("markAsRead", { alertId: row._id, userRole: user.role });
    dispatch(markUserAsRead({ alertId, userRole: user.role }));
  };

  // close Alert handler

  // handle Incidence

  const handleIncidence = async (row) => {
    Swal.fire({
      title: "Are you sure to declare ?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      showDenyButton: true,
      denyButtonColor: "#6c757d",
      denyButtonText: "Not Declare",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Declare it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const formData = {
          id: row._id,
          data: {
            ...row,
            isIncidence: "yes",
          },
        };

        try {
          const result = await dispatch(updateIncidenceDeclaration(formData));

          if (updateIncidenceDeclaration.fulfilled.match(result)) {
            // Fetch latest data from backend

            fetchPendingIncidents();
            Swal.fire({
              title: "Incidence Declared!",
              icon: "success",
            });
          }
        } catch (error) {
          console.error("Failed to update alert:", error);
        }
      } else if (result.isDenied) {
        const formData = {
          id: row._id,
          data: {
            ...row,
            isIncidence: "no",
          },
        };

        try {
          const result = await dispatch(updateIncidenceDeclaration(formData));

          if (updateIncidenceDeclaration.fulfilled.match(result)) {
            // Fetch latest data from backend
            fetchPendingIncidents();

            Swal.fire({
              title: "Incident Not Declared!",
              icon: "info",
            });
          }
        } catch (error) {
          console.error("Failed to update alert:", error);
        }
      }
    });
  };

  // FETCH FUNCTION
  const fetchPendingIncidents = async () => {
    try {
      setLoading(true);
      // CALL THE NEW API WITH view="incident"
      const response = await API.get(
        `/api/v1/alert/paginated/incidencePendingAlerts?page=${
          selectedPage.current
        }&limit=${limit}&search=${encodeURIComponent(debouncedSearchTerm)}`
      );

      const { alerts, pagination } = response.data.data;

      setData(alerts);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      // Optional: Add toast error here
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on mount or page change
  useEffect(() => {
    fetchPendingIncidents();
  }, [
    limit,
    debouncedSearchTerm,
    dispatch,
    selectedPage,
    alert,
    user._id,
    user.role,
  ]);

  const handlePageClick = (e) => {
    selectedPage.current = e.selected + 1;
    fetchPendingIncidents();
  };

  const changeLimit = (newLimit) => {
    const parsedLimit = parseInt(newLimit);
    setLimit(parsedLimit);
    selectedPage.current = 1;
    fetchPendingIncidents();
  };

  return (
    <>
      <Title title={"SEM | Incidence Pending Stage"} />

      <div className="bg-gray-900 text-gray-200 min-h-screen  font-sans py-12">
        <main className="p-8">
          <Breadcrumb />

          <div className="flex items-center gap-2 !pt-3 pb-3 !rounded-t">
            <h5 className="flex items-center !text-red-500 text-lg font-semibold space-x-2 p-0 m-0">
              {" "}
              Incidence Pending Stage
            </h5>

            <Loader className="h-6 w-6 ml-2.5 text-cyan-400" />
          </div>

          <section id="selfAssignedTable">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                {/* <h2 className="text-lg font-bold text-white"></h2> */}
                <div className="flex items-center gap-4">
                  <select
                    value={limit} // keeps UI in sync with state
                    onChange={(e) => changeLimit(e.target.value)}
                    name="pageSize"
                    id="pageSize"
                    className="block w-32 rounded-md border border-cyan-800 bg-gray-800 px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                  <p>
                    {" "}
                    <span className="text-xs text-cyan-600">
                      Showing page {selectedPage.current} of {totalPages}
                    </span>{" "}
                    &nbsp;{" "}
                    <span className="font-bold text-sm text-amber-600">
                      Alerts
                    </span>{" "}
                    &nbsp;:{" "}
                    <span className="text-sm text-cyan-400">
                      {totalRecords}
                    </span>{" "}
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3  top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by name, index, role or ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto ">
                <div className="w-ful">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-700">
                      <tr>
                        {tableHeaders.map((header) => {
                          const key = {
                            View: null,
                            Initiator: "author",
                            "Alert ID": "alertId",
                            "Alert Time": "createdAt",
                            "Event Time": "eventTime",
                            "Alert Source": "alertSource",
                            "Alert Name": "alertName",
                            Severity: "severity",
                            Status: "status",

                            Actions: null,
                          }[header];
                          return (
                            <th
                              key={header}
                              className="p-2 text-sm font-semibold text-gray-400"
                              onClick={() => key && requestSort(key)}
                            >
                              <div
                                className={`flex items-center space-x-1 ${
                                  key && "cursor-pointer"
                                }`}
                              >
                                <span>{header}</span>
                                {key && getSortIcon(key)}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {data.length > 0 ? (
                        data.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors "
                          >
                            <td className="p-2 font-medium text-sm text-white">
                              {item.author?.name}
                            </td>

                            <td className="p-2 text-gray-300 text-sm">
                              {item.alertId}
                            </td>
                            <td className="p-2 text-gray-300 text-sm">
                              {formatDateTimeReadable(item.createdAt)}
                            </td>
                            <td className="p-2 text-gray-300 text-sm">
                              {formatDateTimeReadable(item.eventTime)}
                            </td>
                            <td className="p-2 text-gray-300 text-sm">
                              {item.alertName}
                            </td>
                            <td className="p-2 text-gray-300 text-sm">
                              {item.alertSource}
                            </td>

                            <td className="p-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                                style={{
                                  backgroundColor:
                                    SEVERITY_COLORS[item.severity],
                                }}
                              >
                                {item.severity}
                              </span>
                            </td>

                            <td className="p-2">
                              {item.handBackToL1Assignee === "yes" ? (
                                user?.role === "Level_2" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-black">
                                    Alert Close Pending
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                                    Investigation Done
                                  </span>
                                )
                              ) : item.incidentDeclarationRequired === "yes" ? (
                                user?.role === "Admin" ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-black">
                                    Permission Required to Declare Incidence
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                                    Investigating...
                                  </span>
                                )
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                                  Investigating...
                                </span>
                              )}
                            </td>

                            <td className="p-2 relative">
                              {(() => {
                                // Compute unread count safely
                                const alertId = item._id;
                                const unreadRoles =
                                  unreadCountMap[alertId] || [];
                                const unread = unreadRoles.includes(user.role);
                                const count = unreadRoles.filter(
                                  (r) => r === user.role
                                ).length;

                                return (
                                  <div className="flex flex-wrap gap-2 items-center relative">
                                    {/* Follow Up Button */}
                                    <button
                                      className="px-3 py-1 text-xs font-medium rounded bg-cyan-900 text-white hover:bg-cyan-600 flex items-center gap-1 cursor-pointer"
                                      onClick={() => handleFollowUp(item)}
                                    >
                                      <ScanSearch className="h-4 w-4" />
                                      Follow Up
                                    </button>

                                    {/* Conditional Close Alert Button */}
                                    {item.handBackToL1Assignee === "yes" &&
                                      user.role === "Level_1" && (
                                        <button className="px-3 py-1 text-xs font-medium rounded bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-1 cursor-pointer">
                                          <i className="fa-solid fa-lock"></i>
                                          Close Alert
                                        </button>
                                      )}

                                    {/* Conditional Incidence Declare Button */}
                                    {item.handBackToL1Assignee !== "yes" &&
                                      (user.role === "Admin" ||
                                        user.role === "CISO") && (
                                        <button
                                          type="button"
                                          onClick={() => handleIncidence(item)}
                                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors duration-150 cursor-pointer"
                                        >
                                          <i
                                            className="fa fa-line-chart"
                                            aria-hidden="true"
                                          ></i>
                                          <span>Incidence Declare</span>
                                        </button>
                                      )}

                                    {/* Chat Button with unread badge */}
                                    {item.handBackToL1Assignee !== "yes" && (
                                      <div className="relative inline-block">
                                        <button
                                          type="button"
                                          onClick={() => handleChat(item)}
                                          className="px-3 py-1 text-xs font-medium rounded bg-sky-400 text-white hover:bg-sky-500 flex items-center gap-1 cursor-pointer"
                                        >
                                          <i className="fa-solid fa-comments"></i>
                                          Chat
                                        </button>

                                        {unread && (
                                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full">
                                            {count}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="10"
                            className="text-center p-2 text-gray-400 italic"
                          >
                            No Alert Created
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* react paginate */}
                  <ReactPaginate
                    previousLabel="Prev"
                    nextLabel="Next"
                    breakLabel="..."
                    pageCount={totalPages}
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                    onPageChange={handlePageClick}
                    // container flex row, responsive spacing
                    containerClassName="flex flex-wrap justify-center md:justify-end gap-2 mt-4"
                    // li wrapper minimal
                    pageClassName="list-none"
                    previousClassName="list-none"
                    nextClassName="list-none"
                    breakClassName="list-none"
                    // clickable <a> styles
                    pageLinkClassName="px-2 py-1 text-xs md:text-sm border rounded hover:bg-gray-100 cursor-pointer block"
                    previousLinkClassName="px-3 py-1 text-sm border rounded hover:bg-gray-100 cursor-pointer block"
                    nextLinkClassName="px-3 py-1 text-sm border rounded hover:bg-gray-100 cursor-pointer block"
                    breakLinkClassName="px-2 py-1 text-xs border rounded cursor-default block"
                    activeClassName="bg-blue-500 text-white"
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* tailwind css start */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50  flex items-center justify-center bg-black/30 bg-opacity-50
          transition-opacity duration-500 ease-out"
        >
          {/* MODAL CONTAINER */}
          <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative mt-5">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-amber-600 pb-2">
              <h6 className="text-lg font-semibold text-white">
                Incident Pending Stage - Alert ID: {input.alertId}
              </h6>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-3xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* FORM */}
            <form encType="multipart/form-data" className="mt-6 space-y-4">
              {/* Hidden fields */}
              <input type="hidden" name="alertId" value={input._id} />
              <input type="hidden" name="author" value={input.author} />

              {/* Alert Details Button */}
              <button
                type="button"
                onClick={() => setOpenAlertDetails(!openAlertDetails)}
                className="text-sm px-3 py-1 border border-green-600 text-green-400 rounded-md hover:bg-green-700/20 transition cursor-pointer"
              >
                Alert Details
              </button>

              <AnimatePresence>
                {/* COLLAPSIBLE SECTION */}
                {openAlertDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-0.5"
                  >
                    <div className="bg-gray-800 border border-gray-700 rounded-xl mt-4 p-4 animate-fade-in">
                      <div className="flex justify-between mb-3">
                        <h6 className="flex flex-end gap-2 align-middle !text-amber-500 font-medium mb-3 underline underline-offset-8">
                          Alert Information
                        </h6>

                        <div className="flex items-center gap-3 ">
                          <BlobProvider
                            document={<AlertReport data={input} user={user} />}
                          >
                            {({ blob, url, loading, error }) => {
                              if (loading)
                                return (
                                  <button disabled>Preparing PDF...</button>
                                );
                              if (error) return <div>Error generating PDF</div>;

                              return (
                                <>
                                  {/* Download button */}
                                  <a
                                    href={url}
                                    download={`alert-${
                                      data?._id ?? "report"
                                    }.pdf`}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "5px 8px",
                                      background: "#0ea5a3",
                                      color: "white",
                                      borderRadius: 6,
                                      textDecoration: "none", // explicitly remove underline
                                      fontSize: "12px",
                                    }}
                                  >
                                    <Download size={14} />
                                    Download
                                  </a>
                                  {/* Print button */}
                                  <button
                                    type="button"
                                    onClick={() => window.open(url)?.print()}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      padding: "5px 12px",
                                      background: "#06b6d4",
                                      color: "white",
                                      borderRadius: 6,
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      textDecoration: "none", // no underline
                                    }}
                                    title="Print PDF"
                                  >
                                    <Printer size={14} />
                                    Print
                                  </button>
                                  {/* Quick preview link  */}{" "}
                                  {/* <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ marginLeft: 8, fontSize: 13 }}
                                  >
                                    {" "}
                                    Open in new tab{" "}
                                  </a> */}
                                </>
                              );
                            }}
                          </BlobProvider>
                        </div>
                      </div>

                      <div className="print-container">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <strong>Alert Name:</strong> {input.alertName}
                          </div>
                          <div>
                            <strong>Accepted Time:</strong> {input.acceptedTime}
                          </div>
                          <div>
                            <strong>Severity:</strong> {input.severity}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <strong>Event Time:</strong> {input.eventTime}
                          </div>
                          <div>
                            <strong>Alert Source:</strong> {input.alertSource}
                          </div>
                          <div>
                            <strong>Verdict:</strong> {input.verdict}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <strong>Affected User Device:</strong>{" "}
                            {input.affectedUserDevice}
                          </div>
                          <div>
                            <strong>Affected IP/Website:</strong>{" "}
                            {input.affectedIpWebsite}
                          </div>
                          <div>
                            {/* <strong>Verdict:</strong> {input.verdict} */}
                          </div>
                        </div>

                        <hr className="my-3 border-gray-700" />

                        {input.assignedTo.length > 1 && (
                          <>
                            {/* stepper */}
                            <div className="grid md:grid-cols-1 text-sm text-white">
                              <AlertStepper assignedTo={input.assignedTo} />
                            </div>
                            {/* stepper */}

                            <hr className="my-3 border-gray-700" />
                          </>
                        )}
                        <h6 className="!text-amber-500 font-medium mb-3  underline underline-offset-8">
                          True Positive Case Details
                        </h6>

                        <div className="mt-2 text-sm">
                          <strong>Case Details:</strong> {input.caseDetails}
                        </div>

                        {/* Uploaded Files */}
                        <div className="mt-2">
                          {/* Title */}
                          <div className="mb-2 text-sm">
                            <strong className="text-gray-200">
                              Uploaded Evidence :
                            </strong>
                          </div>

                          {/* Files List */}
                          <div className="flex flex-wrap gap-5 mt-3">
                            {tpEvidenceFiles.map((file, index) => (
                              <div
                                key={index}
                                className="relative text-center border border-gray-600 bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition w-28 flex flex-col items-center justify-center"
                              >
                                {/* Clickable PDF Icon + File Name */}
                                <div
                                  onClick={() => handleFileShow(file)}
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  <img
                                    src={pdf}
                                    alt="pdf"
                                    className="w-8 h-8 mx-auto"
                                  />
                                  <p className="text-xs text-gray-300 mt-2 break-words text-center w-[100px] leading-snug">
                                    {file?.split("_").pop()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* TP Impact */}
                          <div className="mt-3 mb-1 text-sm">
                            <strong className="text-gray-200">
                              TP Impact:
                            </strong>{" "}
                            <span className="text-gray-300">
                              {input.tpImpact}
                            </span>
                          </div>

                          {/* TP Remediation Actions */}
                          <div className="mb-1 text-sm">
                            <strong className="text-gray-200">
                              TP Remediation Actions:
                            </strong>{" "}
                            <span className="text-gray-300">
                              {input.tpRemedationNote}
                            </span>
                          </div>

                          {/* Escalation and Reason */}
                          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
                            <div className="text-sm">
                              <strong className="text-gray-200">
                                Escalation:
                              </strong>{" "}
                              <span className="text-gray-300">
                                {input.escalation}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
                            <div className="text-sm">
                              <strong className="text-gray-200">
                                Escalation Reason:
                              </strong>{" "}
                              <span className="text-gray-300">
                                {input.escalationReason}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ===== Other Division Informed ===== */}
                        {input.fieldsToFill &&
                          input.fieldsToFill.length > 0 && (
                            <div className="mt-6">
                              <h6 className="!text-amber-500 font-medium mb-3  underline underline-offset-8">
                                Other Division Informed
                              </h6>
                              <hr className="border-gray-700 mb-4" />

                              <div className="space-y-4">
                                {Array.isArray(input.fieldsToFill) &&
                                  input.fieldsToFill.map((field, index) => (
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
                                  ))}
                              </div>

                              {/* ===== Previous Action Performed History ===== */}
                              {(() => {
                                const filteredFields =
                                  input.fieldsToFill.filter((field) => {
                                    const hasComments =
                                      field.comments?.trim() !== "";
                                    return (
                                      (field.isPerformed === "notPerformed" &&
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
                                        {filteredFields.map((field, index) => (
                                          <div
                                            key={field._id || index}
                                            className="bg-gray-900 border border-gray-700 p-4 rounded-lg"
                                          >
                                            <p className="border-b border-gray-600 text-amber-400 w-fit pb-1 font-medium">
                                              {field.role} :
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                              <div>
                                                <strong className="text-gray-200">
                                                  Action Performed:
                                                </strong>{" "}
                                                <span className="text-gray-300">
                                                  {field.isPerformed}
                                                </span>
                                              </div>
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
                                        ))}
                                      </div>
                                    </div>
                                  )
                                );
                              })()}
                            </div>
                          )}

                        {/* L2 Processing Field Start */}
                        {user.branch ===
                          "99341-Information Security, IT Risk Management & Fraud Control Division" && (
                          <>
                            <div className="mt-4">
                              <h6 className="!text-amber-500 font-medium  mb-3 underline underline-offset-8 ">
                                L2 Processing Area
                              </h6>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              {/* Investigation Findings */}
                              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                  Investigation Findings:
                                </strong>
                                <span className="text-gray-300 mt-3 block">
                                  {input.investigationFindings}
                                </span>
                              </div>

                              {/* Investigation Methodology and Tools */}
                              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                  Investigation Methodology and Tools:
                                </strong>
                                <span className="text-gray-300 mt-3 block">
                                  {input.investigationToolsUsed}
                                </span>
                              </div>

                              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                  Incident Declaration Required:
                                </strong>
                                <span className="text-gray-300 mt-3 block">
                                  {input.incidentDeclarationRequired}
                                </span>
                              </div>

                              {/* Investigation Methodology and Tools */}
                              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                  Incident Declaration Reason:
                                </strong>
                                <span className="text-gray-300 mt-3 block">
                                  {input.incidentDeclarationReason}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      )}

      {/* chatbox */}
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

export default IncidencePendingStage;
