import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import Title from "../../../components/Title/Title";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../features/auth/authSlice";
import { alertSelector } from "../../../features/incoming/alertSlice";
import {
  editAlert,
  getAllAlert,
  updateInvestigationAlert,
} from "../../../features/incoming/alertApiSlice.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);

import pdf from "../../../assets/frontend/img/icons8-pdf-40.png";
import createToast from "../../../utils/createToast.js";
import Swal from "sweetalert2";
import "./FollowUpAlert.css";
import ChatBox from "../../../components/ChatBox/ChatBox.jsx";
import {
  messageSelector,
  markUserAsRead,
} from "../../../features/incoming/messageSlice.js";
import socket from "../../../helpers/socket.js";

import TransferModal from "../../../components/TransferModal/TransferModal.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  AudioWaveform,
  ChartSpline,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LockOpen,
  MessageCircleMore,
  Search,
  Download,
  Printer,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import AlertReport from "../../../components/AlertReport/AlertReport.jsx";

import { BlobProvider } from "@react-pdf/renderer";
import { useLocation } from "react-router-dom";
import AlertStepper from "../../../components/Stepper/Stepper.jsx";
import { useDebounce } from "../../../hooks/debounce.jsx";
import API from "../../../utils/api.js";

const FollowUpAlert = () => {
  // for print helper

  const location = useLocation();
  const pathname = location.pathname;
  const pathParts = pathname.split("/");
  const lastPathPart = pathParts[pathParts.length - 1];

  // chatting section start
  const [messages, setMessages] = useState([
    // { type: "bot", text: "Hi! How can I help you?" },
    // { type: "user", text: "Hello! I want to learn Socket.IO" },
  ]);
  const messagesEndRef = useRef(null);

  const { messagesByAlertId, unreadCountMap } = useSelector(messageSelector);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // chatting section end
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerdict, setIsVerdict] = useState("Choose");

  const [tpEvidenceFiles, setTpEvidenceFiles] = useState([]);
  const [currentDate, setCurrentDate] = useState("");

  const dispatch = useDispatch();
  const { alertError, alertMessage, alert, alertLoader } =
    useSelector(alertSelector);
  const { user, loader, error, message } = useSelector(authSelector);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [showPdf, setShowPdf] = useState(false);


  // Pagination State
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const selectedPage = useRef(1);
  const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms












  const [alertId, setAlertId] = useState({
    alertId: "",
    acceptedBy: "",
    assignedTo: [],
  });

  const [openAlertDetails, setOpenAlertDetails] = useState(false);

  const enrichedData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      unread: unreadCountMap[row._id]?.includes(user.role) || false,
    }));
  }, [data, unreadCountMap, user]);

  // chat

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const [alertView, setAlertView] = useState([]);

  // transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // investigation modal open

  const closeModal = () => {
    // Close the modal
    setIsModalOpen(false);
  };

  const handleDateChange = (e) => {
    setCurrentDate(e.target.value);
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

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
    setIsVerdict(value);
    setInput((prevInput) => ({
      ...prevInput,
      fpNote: "",
    }));
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput((prev) => ({
      ...prev,
    }));
  };

  const wordCount = input.fpNote
    ? input.fpNote.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const isFpValid = wordCount >= 100;

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
      input.communication?.trim()
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

  useEffect(() => {
    dispatch(getAllAlert());
  }, [dispatch]);







  // useEffect(() => {
  //   if (!user?._id || !Array.isArray(alert)) return;

  //   const filtered = alert.filter((item) => {
  //     const isEscalatedByAuthor =
  //       item.author?._id === user._id && item.status === "escalated";

  //     const isHandBackToL1 =
  //       item.handBackToL1Assignee === "yes" && item.status !== "closed";

  //     const isAssignedToUser =
  //       Array.isArray(item.assignedTo) &&
  //       item.assignedTo.some((id) => id?.toString() === user._id?.toString());

  //     const hasAllInvestigationValues =
  //       item.investigationToolsUsed && item.investigationFindings;

  //     const hasInvestigationLevel2Values =
  //       // item.l2RemediationActionDoc &&
  //       item.l2RemediationValidation &&
  //       // item.l2RemediationExecutionLog &&
  //       item.l2RemediationPlan &&
  //       // item.irp &&
  //       item.rootCause;

  //     if (user.role === "Level_1") {
  //       const L2verdict_true_positive =
  //         item.L2verdict === "true_positive" &&
  //         item.verdict === "true_positive" &&
  //         item.handBackToL1Assignee === "yes" &&
  //         item.status !== "closed" &&
  //         item.incidentDeclarationRequired === "yes" &&
  //         item.isIncidence === "no";
  //       return (
  //         isEscalatedByAuthor ||
  //         (isAssignedToUser &&
  //           item.status === "escalated" &&
  //           hasAllInvestigationValues) ||
  //         isHandBackToL1 ||
  //         L2verdict_true_positive
  //       );
  //     }

  //     if (user.role === "Level_2") {
  //       const isMatch =
  //         (isEscalatedByAuthor || isHandBackToL1 || isAssignedToUser) &&
  //         item.status === "escalated" &&
  //         hasAllInvestigationValues &&
  //         hasInvestigationLevel2Values;

  //       const isHalfMatch =
  //         (isEscalatedByAuthor || isHandBackToL1 || isAssignedToUser) &&
  //         item.status === "escalated" &&
  //         hasAllInvestigationValues &&
  //         !hasInvestigationLevel2Values;

  //       const incidentNotRequired = item.incidentDeclarationRequired === "no";
  //       const incidentNotRequiredYes =
  //         item.incidentDeclarationRequired === "yes";

  //       const L2verdict_false_positive =
  //         (item.L2verdict === "false_positive" ||
  //           item.L2verdict === "true_positive") &&
  //         item.verdict === "true_positive" &&
  //         item.handBackToL1Assignee === "yes" &&
  //         item.status !== "closed";

  //       return (
  //         (isMatch && incidentNotRequired) ||
  //         (incidentNotRequired && isHalfMatch) ||
  //         (isMatch && incidentNotRequiredYes) ||
  //         L2verdict_false_positive
  //       );
  //     }

  //     if (
  //       user.role === "Admin" ||
  //       user.role === "SOC Manager" ||
  //       user.role === "CISO"
  //     ) {
  //       // Level_1-like alerts (anyone accepted or handback open)
  //       const level1Match =
  //         item.status === "escalated" || // anyone accepted and open
  //         (item.handBackToL1Assignee === "yes" && item.status !== "closed"); // handback open

  //       // Level_2-like alerts (anyone assigned, not handed back)
  //       const level2Match =
  //         Array.isArray(item.assignedTo) &&
  //         item.assignedTo.length > 0 &&
  //         (item.handBackToL1Assignee !== "yes" ||
  //           item.handBackToL1Assignee === undefined) &&
  //         item.status === "escalated";

  //       return level1Match || level2Match;
  //     }

  //     return false; // fallback for unknown roles
  //   });

  //   setData(filtered);
  // }, [alert, user._id, user.role]);

  const formatForDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // returns YYYY-MM-DDTHH:MM
  };

  const alertFields = [
    { label: "Info Validation Notes", key: "infoValidationNotes" },
    { label: "IOC Validation Notes", key: "iOCValidationNotes" },
    { label: "Investigation Findings", key: "investigationFindings" },
    { label: "Investigation Tools Used", key: "investigationToolsUsed" },
    {
      label: "Incident Declaration Required",
      key: "incidentDeclarationRequired",
    },
  ];

  const filledFields = alertFields.filter(({ key }) => alertView[key]);

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

  //   // new tailwind design
  // for table


  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });
  const [enabled, setEnabled] = useState({});

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
    "Ans Return",
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

  // ✅ Sort & filter data
  const sortedData = useMemo(() => {
    let sortableData = [...data].reverse();

    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    if (searchTerm) {
      sortableData = sortableData.filter((item) =>
        Object.values(item).some((val) =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return sortableData;
  }, [data, sortConfig, searchTerm]);

  // pagination code
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 10;

  // const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const currentItems = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // handle Follow Up

  const handleFollowUp = (row) => {
    const formattedEventTime = formatDateTimeReadable(row.eventTime);
    const formattedUpdatedTime = formatDateTimeReadable(row.acceptedTime);
    const investigationEndTime = formatDateTimeReadable(
      row.investigationEndTime
    );
    setInput({
      ...row,
      eventTime: formattedEventTime,
      acceptedTime: formattedUpdatedTime,
      investigationEndTime: investigationEndTime,
    });
    setIsModalOpen(true);
    setTpEvidenceFiles(row.uploadedEvidence);

    const matchAlert = (alert || []).find((item) => item._id === row._id);

    setMessages(matchAlert?.communicationLog);
    setAlertView(row);
  };

  const handleClose = async (row) => {
    Swal.fire({
      title: "Are you sure ?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Close it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const formData = {
          ...row,
          status: "closed",
        };

        if (
          user._id === row.author._id ||
          row.assignedTo?.some((u) => u._id === user._id)
        ) {
          try {
            const result = await dispatch(editAlert(formData));

            if (editAlert.fulfilled.match(result)) {
              // Fetch latest data from backend
              const res = await dispatch(getAllAlert());

              Swal.fire({
                title: "Alert Closed!",
                icon: "success",
              });
            }
          } catch (error) {
            console.error("Failed to update alert:", error);
          }
        } else {
          Swal.fire({
            title: "Not Deleted!",
            text: "Unauthorised to Close.",
            icon: "danger",
          });
        }
      }
    });
  };

  const handleChat = (row) => {
    setIsChatOpen(true);
    setAlertId(row._id);
    // socketRef.current.emit("markAsRead", { alertId: row._id , userRole: user.role });
    socket.emit("markAsRead", { alertId: row._id, userRole: user.role });
    dispatch(markUserAsRead({ alertId, userRole: user.role }));
  };

  const handleTransfer = (row) => {
    setTransferModalOpen(true);
    setAlertId({
      alertId: row._id.toString(),
      acceptedBy: row.acceptedBy.toString(),
      assignedTo: row.assignedTo,
    });
  };





    // FETCH FUNCTION
    const fetchFollowUp = async () => {
      try {
        setLoading(true);
        // CALL THE NEW API WITH view="follow up"
        const response = await API.get(
          `/api/v1/alert/paginated?page=${selectedPage.current}&limit=${limit}&view=follow_up&search=${encodeURIComponent(
          debouncedSearchTerm
        )}`
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
      fetchFollowUp();
    }, [limit, debouncedSearchTerm, dispatch, selectedPage, alert,user._id, user.role]); // Add other dependencies if needed
  
  
    
  
    const handlePageClick = (e) => {
      selectedPage.current = e.selected + 1;
      fetchFollowUp();
    };
  
      const changeLimit = (newLimit) => {
      const parsedLimit = parseInt(newLimit);
      setLimit(parsedLimit);
      selectedPage.current = 1;
      fetchFollowUp();
    };

  return (
    <>
      <Title title={"SEM | Follow Up Alert"} />

      <div className="bg-gray-900 text-gray-200 min-h-screen  font-sans py-12">
        <main className="p-8">
          <Breadcrumb />

          <div className="flex items-center gap-2 !pb-3 pt-3 !rounded-t">
            <h5 className="flex items-center !text-red-500 text-lg font-semibold space-x-2 p-0 m-0">
              {" "}
              Follow Up
            </h5>
            <AudioWaveform className="h-6 w-6 ml-2.5 text-cyan-400" />
          </div>

          <section id="selfAssignedTable">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
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
                     <p> <span className="text-xs text-cyan-600">Showing page {selectedPage.current} of {totalPages}</span> &nbsp; <span className="font-bold text-sm text-amber-600">Alerts</span> &nbsp;: <span className="text-sm text-cyan-400">{totalRecords}</span> </p>
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
                            "Ans Return": null,
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
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  STATUS_COLORS[item.status]
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>

                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(item.fieldsToFill) &&
                                  item.fieldsToFill.map((field, i) => {
                                    const isPerformed =
                                      field.isPerformed === "performed" ||
                                      (field.comments &&
                                        field.comments.trim() !== "");

                                    const color = isPerformed
                                      ? "text-green-500"
                                      : "text-red-500";
                                    const tooltip = isPerformed
                                      ? "Performed"
                                      : "Not Performed";

                                    return (
                                      <div key={i} className="relative group">
                                        {/* SVG Icon */}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          className={`${color} cursor-pointer`}
                                          fill="currentColor"
                                        >
                                          <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5z" />
                                          <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0" />
                                        </svg>

                                        {/* Tooltip */}
                                        <div className="absolute hidden group-hover:block bg-gray-800 text-gray-200 text-xs rounded-md px-2 py-1 whitespace-nowrap z-20 left-1/2 -translate-x-1/2 bottom-full mb-1 shadow-md">
                                          {tooltip}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              {(() => {
                                const alertId = item._id;
                                const unread = unreadCountMap[
                                  alertId
                                ]?.includes(user.role);
                                const count =
                                  unreadCountMap[alertId]?.filter(
                                    (item) => item === user.role
                                  ).length || 0;

                                return (
                                  <div className="flex flex-wrap gap-2 items-center relative">
                                    {/* Follow Up */}
                                    <button
                                      onClick={() => handleFollowUp(item)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-cyan-400 text-xs font-medium rounded-full shadow-md transition-all duration-200 cursor-pointer"
                                    >
                                      <ChartSpline className="w-4 h-4 text-cyan-400" />
                                      <span>Follow Up</span>
                                    </button>

                                    {/* Chat with badge */}

                                    <div className="relative inline-block">
                                      <button
                                        onClick={() => handleChat(item)}
                                        className="bg-teal-500 hover:bg-teal-400 text-white text-xs px-3 py-1.5  flex items-center gap-1 cursor-pointer"
                                      >
                                        <MessageCircleMore className="w-4 h-4" />
                                        Chat
                                      </button>
                                      {unread && (
                                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full px-2 py-[2px]">
                                          {count}
                                        </span>
                                      )}
                                    </div>

                                    {/* Close Alert */}
                                    {item.handBackToL1Assignee === "yes" &&
                                      user.role === "Level_1" && (
                                        <button
                                          onClick={() => handleClose(item)}
                                          className="bg-red-700 hover:bg-red-800 text-white text-xs px-2 py-1 flex items-center gap-1 cursor-pointer"
                                        >
                                          <LockOpen className="w-4 h-4 text-gray-300" />
                                          {/* <i className="fa-solid fa-lock"></i>{" "} */}
                                          Close Alert
                                        </button>
                                      )}

                                    {/* Transfer (Admin only) */}
                                    {(user.role === "Admin" ||
                                  user.role === "SOC Manager" ||
                                  user.role === "CISO") && (
                                      <button
                                        onClick={() => handleTransfer(item)}
                                        className="bg-yellow-500 hover:bg-yellow-400 text-white text-xs px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                                      >
                                        <i className="fa fa-exchange"></i>{" "}
                                        Transfer
                                      </button>
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

                  {/* Pagination Controls
                  <div className="flex justify-between items-center mt-4 text-gray-300">
                    <p className="text-sm">
                      Showing {startIndex + 1}–
                      {Math.min(startIndex + itemsPerPage, sortedData.length)}{" "}
                      of {sortedData.length}
                    </p>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 rounded bg-gray-700 disabled:opacity-50 "
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm ml-4">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 rounded bg-gray-700 disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div> */}








                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* tailwind css modal start */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50  flex items-center justify-center bg-black/30  bg-opacity-50
          transition-opacity duration-500 ease-out"
        >
          {/* MODAL CONTAINER */}
          <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative mt-5">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-amber-600 pb-2">
              <h6 className="text-lg font-semibold text-white">
                Follow Up Alert Investigation
              </h6>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-3xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleCommunicationSubmit}
              encType="multipart/form-data"
              className="mt-6 space-y-4"
            >
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
                          <strong className="text-gray-200">TP Impact:</strong>{" "}
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

                        {/* Escalation and Reason */}
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

                      {/* ===== L2 Processing Area ===== */}
                      {filledFields.length > 0 && (
                        <div className="mt-5">
                          <h6 className="!text-amber-500 font-medium mb-3  underline underline-offset-8">
                            L2 Processing Area
                          </h6>

                          <div className="space-y-2">
                            {filledFields.map(({ label, key }) => (
                              <div
                                key={key}
                                className="border-b border-gray-700 pb-1 text-sm text-gray-300"
                              >
                                <strong className="text-gray-200">
                                  {label}:
                                </strong>{" "}
                                <span>{alertView[key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ===== Other Division Informed ===== */}
                      {input.fieldsToFill && input.fieldsToFill.length > 0 && (
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
                                        {field.value || "No action provided"}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              ))}
                          </div>

                          {/* ===== Previous Action Performed History ===== */}
                          {(() => {
                            const filteredFields = input.fieldsToFill.filter(
                              (field) => {
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
                              }
                            );

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
                                              {field.comments || "No Comments"}
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

                      {/* ===== Details Information of Incidence and Remediation ===== */}
                      {filledFields2.length > 0 && (
                        <div className="mt-8">
                          <h6 className="!text-amber-500 font-semibold mb-3 underline underline-offset-8 ">
                            Details Information of Incidence and Remediation
                          </h6>

                          <div className="space-y-2">
                            {alertFields2.map(({ label, key }) => (
                              <div
                                key={key}
                                className="border-b border-gray-700 pb-1 text-sm text-gray-300"
                              >
                                <strong className="text-gray-200">
                                  {label}:
                                </strong>{" "}
                                <span>
                                  {key === "l2ResolutionTimestamp" &&
                                  alertView[key]
                                    ? formatDateTimeReadable(alertView[key])
                                    : alertView[key]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {user.role === "Level_2" && (
                        <>
                          {input.isIncidence === "yes" &&
                            !filledFields2.some(
                              (field) => field.key === "irp"
                            ) && (
                              <div className="mt-4 bg-gray-800/50 rounded-2xl p-6 shadow-md border border-gray-700">
                                <h3 className="text-red-400 text-lg font-semibold mb-3">
                                  Details Information of Incidence and
                                  Remediation
                                </h3>
                                <hr className="border-amber-600 mb-4" />

                                {/* IRP Initiated */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-1">
                                    IRP Initiated?{" "}
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>
                                  <select
                                    name="irp"
                                    value={input.irp}
                                    disabled
                                    onChange={handleSelectChange}
                                    className="w-full bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-gray-300 focus:ring-2 focus:ring-amber-500"
                                  >
                                    <option value="Choose">Choose...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="n/a">N/A</option>
                                  </select>
                                </div>

                                {/* L2 Root Cause Analysis */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-1">
                                    L2 Root Cause Analysis{" "}
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>
                                  <textarea
                                    rows={6}
                                    name="rootCause"
                                    value={input.rootCause}
                                    placeholder="Follow 5W approach..."
                                    onChange={(e) => {
                                      handleInputChange(e);
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>

                                {/* L2 Remediation Plan */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-1">
                                    L2 Remediation Plan{" "}
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>
                                  <textarea
                                    rows={6}
                                    name="l2RemediationPlan"
                                    value={input.l2RemediationPlan}
                                    placeholder="Planned actions (e.g., Block C2, Deploy EDR, Restore from backup...)"
                                    onChange={(e) => {
                                      handleInputChange(e);
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>

                                {/* L2 Remediation Validation */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-1">
                                    L2 Remediation Validation{" "}
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>
                                  <textarea
                                    rows={6}
                                    name="l2RemediationValidation"
                                    value={input.l2RemediationValidation}
                                    placeholder="How L2 validated execution (e.g., Checked firewall logs for block)"
                                    onChange={(e) => {
                                      handleInputChange(e);
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>

                                {/* L2 Resolution Timestamp */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-1">
                                    L2 Resolution Timestamp{" "}
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>
                                  {user.role === "Level_1" ? (
                                    <input
                                      type="datetime-local"
                                      name="l2ResolutionTimestamp"
                                      value={formatForDateTimeLocal(
                                        input.l2ResolutionTimestamp ||
                                          currentDate
                                      )}
                                      disabled
                                      onChange={handleDateChange}
                                      className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
                                    />
                                  ) : (
                                    <input
                                      type="datetime-local"
                                      name="investigationEndTime"
                                      value={formatForDateTimeLocal(
                                        input.l2ResolutionTimestamp ||
                                          currentDate
                                      )}
                                      onChange={handleDateChange}
                                      className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
                                    />
                                  )}
                                </div>

                                {/* Hand Back to L1 Assignee */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-1">
                                    Hand Back To L1 Assignee?{" "}
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>
                                  <select
                                    name="handBackToL1Assignee"
                                    value={input.handBackToL1Assignee}
                                    disabled
                                    onChange={handleSelectChange}
                                    className="w-full bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-gray-300 focus:ring-2 focus:ring-amber-500"
                                  >
                                    <option value="Choose">Choose...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                  </select>
                                </div>

                                {/* Hand Back Note to L1 */}
                                <div className="mb-2">
                                  <label className="block text-gray-200 font-medium mb-1">
                                    Hand Back Note to L1 Assignee{" "}
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>
                                  <textarea
                                    rows={6}
                                    name="handBackNoteToL1"
                                    value={input.handBackNoteToL1}
                                    placeholder="Explain Hand Back Note Details..."
                                    onChange={(e) => {
                                      handleInputChange(e);
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                              </div>
                            )}
                        </>
                      )}

                      {(user.role === "Level_1" ||
                      input.incidentDeclarationRequired === "yes" ||
                      input.incidentDeclarationRequired === "no") ? (
                        ""
                      ) : 
                      
                      // (
                      //   <button
                      //     type="submit"
                      //     className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                      //     disabled={alertLoader}
                      //   >
                      //     <i className="fa-regular fa-paper-plane"></i>
                      //     {alertLoader ? "Editing..." : "Edit"}
                      //   </button>
                      // )
                      ("")
                      
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      )}
      {/* tailwind css modal end */}

      {/* transfer modal */}
      <TransferModal
        transferModalOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        alertId={alertId}
        lastPathPart={lastPathPart}
      />

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

export default FollowUpAlert;
