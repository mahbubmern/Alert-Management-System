import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import Title from "../../../components/Title/Title";

import "../SelfAssigned/SelfAssigned.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../features/auth/authSlice";
import { alertSelector } from "../../../features/incoming/alertSlice";
import { getAllAlert } from "../../../features/incoming/alertApiSlice.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);

import pdf from "../../../assets/frontend/img/icons8-pdf-40.png";

import createToast from "../../../utils/createToast.js";

import ChatBox from "../../../components/ChatBox/ChatBox.jsx";

import {
  addMessage,
  markUserAsRead,
  messageSelector,
} from "../../../features/incoming/messageSlice.js";
import socket from "../../../helpers/socket.js";
import API from "../../../utils/api.js";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Package,
  Search,
  Printer,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import { motion, AnimatePresence } from "framer-motion";
// import { usePrintHelper } from "../../../utils/ConvertTime.js";
import TransferModal from "../../../components/TransferModal/TransferModal.jsx";
import { useLocation } from "react-router-dom";
import { useDebounce } from "../../../hooks/debounce.jsx";

const AssignedAlert = () => {
  // chatting section start
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const { messagesByAlertId, unreadCountMap } = useSelector(messageSelector);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // chatting section end
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [pageNumber, setPageNumber] = useState(1);
  const [showPdf, setShowPdf] = useState(false);
  const [alertId, setAlertId] = useState("");

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAlertId, setTransferAlertId] = useState({
    alertId: "",
    acceptedBy: "",
    assignedTo: [],
    fieldsToFill: [],
  });

  const location = useLocation();
  const pathname = location.pathname;
  const pathParts = pathname.split("/");
  const lastPathPart = pathParts[pathParts.length - 1];

  // chat

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  // investigation modal open

  const closeModal = () => {
    // Close the modal
    setIsModalOpen(false);
  };

  const formatDateTimeReadable = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const pad = (n) => (n < 10 ? "0" + n : n);

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Months are 0-indexed
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  // form Data init

  const [input, setInput] = useState({
    alertName: "",
    alertSource: "",
    eventTime: "",
    affectedIpWebsite: "",
    affectedUserDevice: "",
    verdict: "false_positive",
    isPerformed: "notPerformed",
    comments: "",
    acceptedTime: "",
    file: null,
    tpImpact: "",
    escalation: "no",
    fpNote: "",
    caseDetails: "",
    tpImpact: "",
    tpRemedationNote: "",
    escalationReason: "",
    communication: "",

    investigationFindings: "",
    investigationToolsUsed: "",
    incidentDeclarationRequired: "",
    investigationEndTime: "",
    handBackToL1Assignee: "",
    handBackNoteToL1: "",
    irp: "",
    rootCause: "",
    l2RemediationPlan: "",

    l2RemediationValidation: "",

    l2ResolutionTimestamp: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  // word count function

  const wordCount = input.fpNote
    ? input.fpNote.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleFileShow = (file) => {
    if (file.type === "application/pdf") {
      setPdfUrl(URL.createObjectURL(file));
      setShowPdf(true);
      setPageNumber(1); // optional
    } else {
      createToast("Only PDF preview supported");
    }
  };

  const handleClosePdf = () => {
    setShowPdf(false);
    setPdfUrl(null);
  };



  //  setData logic before last setData Modified

  // useEffect(() => {
  //   if (Array.isArray(alert)) {
  //     const filtered = alert.filter((item) => {
  //       // normalize assignedTo as IDs
  //       const assignedIds =
  //         item.assignedTo?.map((a) =>
  //           typeof a === "object" ? a._id?.toString() : a?.toString()
  //         ) || [];

  //       const alreadyAssigned = assignedIds.includes(user._id.toString());

  //       // ✅ check if there's a pending action for this user role
  //       const hasPendingAction = item.fieldsToFill.some(
  //         (option) =>
  //           option.role === user.role &&
  //           option.isPerformed === "notPerformed" &&
  //           (!option.comments || option.comments.trim() === "")
  //       );

  //       return (
  //         item.escalationToOtherUsersRole?.some((role) =>
  //           role.toRoles.includes(user.role)
  //         ) &&
  //         alreadyAssigned &&
  //         hasPendingAction
  //       );

  //       if (user.role === "Admin") {
  //         retrun true
  //       }
  //     });

  //     setData(filtered);
  //   }
  // }, [alert, user.role, user._id]);

  // useEffect(() => {
  //   if (!Array.isArray(alert)) return;

  //   const filtered = alert.filter((item) => {
  //     // normalize assignedTo into ID array
  //     const assignedIds =
  //       item.assignedTo?.map((a) =>
  //         typeof a === "object" ? a._id?.toString() : a?.toString()
  //       ) || [];

  //     const alreadyAssigned = assignedIds.includes(user._id.toString());

  //     // check pending action for this user's role
  //     const hasPendingAction = item.fieldsToFill?.some(
  //       (option) =>
  //         option.role === user.role &&
  //         option.isPerformed === "notPerformed" &&
  //         (!option.comments || option.comments.trim() === "")
  //     );

  //     // pending Action for all Users

  //     const hasPendingActionOfAllUSer = item.fieldsToFill?.some(
  //       (option) =>
  //         option.isPerformed === "notPerformed" &&
  //         (!option.comments || option.comments.trim() === "")
  //     );

  //     const show = item.assignedTo?.some(
  //       (userBranch) =>
  //         userBranch.branch !==
  //         "99341-Information Security, IT Risk Management & Fraud Control Division"
  //     );

  //     // normal user (Level_1, Level_2, InfraAdmin, BSITAdmin…)
  //     const roleAllowed =
  //       item.escalationToOtherUsersRole?.some((role) =>
  //         role.toRoles.includes(user.role)
  //       ) || false;

  //     // 🟩 ADMIN OVERRIDE — Admin sees all alerts without filter
  //     if (
  //       user.role === "Admin" ||
  //       user.role === "SOC Manager" ||
  //       user.role === "CISO"
  //     ) {
  //       return show && hasPendingActionOfAllUSer; // Admin sees everything
  //     }

  //     // 🟦 Normal role filtering logic
  //     return roleAllowed && alreadyAssigned && hasPendingAction;
  //   });

  //   setData(filtered);
  // }, [alert, user.role, user._id]);

  // search fill to fields user role wise

  const getvalue = alert?.map((item) =>
    item.fieldsToFill.find((item) => item.role === user.role)
  );

  // alert accepted Datatable Initialization

  const enrichedData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      unread: unreadCountMap[row._id]?.includes(user.role) || false,
    }));
  }, [data, unreadCountMap, user]);

  useEffect(() => {
    if (alertMessage) {
      createToast(alertMessage, "success");
      dispatch(setEmptyAlertMessage());
    }
    if (alertError) {
      createToast(alertError);

      dispatch(setEmptyAlertMessage());
    }
  }, [alertMessage, alertError, dispatch]);

  const handleActionsPerformed = async (e) => {
    e.preventDefault();

    // ✅ Validation: require at least one field
    const hasPerformed = input.isPerformed;
    const hasComments = input.comments && input.comments?.trim() !== "";

    if (input.isPerformed === "notPerformed" && !hasComments) {
      createToast(
        "Please select 'Performed' or enter comments before submitting.",
        "error"
      );
      return; // stop execution
    }

    const formData = {
      alertId: input._id,
    };

    if (hasPerformed) {
      formData.isPerformed = input.isPerformed;
    }
    if (hasComments) {
      formData.comments = input.comments.trim();
    }

    try {
      await API.patch(`/api/v1/alert/performActions`, formData);

      closeModal();
      fetchAssignedAlerts()
      // dispatch(getAllAlert());
      createToast("Performed Action Notified", "success");
    } catch (error) {
      console.error("Alert update failed", error);
      createToast("Failed to update alert", "error");
    }
  };

  //   // new tailwind design
  // for table
  const [openAlertDetails, setOpenAlertDetails] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });
  const [enabled, setEnabled] = useState({});
  const [alertView, setAlertView] = useState([]);

  const alertFields = [
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



  // Convert time format
  const formatDatetimeLocal = (dateString) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const handleInvestigation = (row) => {
    const formattedEventTime = formatDateTimeReadable(row.eventTime);
    const formattedAcceptedTime = formatDateTimeReadable(row.acceptedTime);
    if (Array.isArray(row.fieldsToFill)) {
      const fieldForRole = row.fieldsToFill.find((f) => f.role === user.role);
      if (fieldForRole) {
        setInput({
          ...row,
          eventTime: formattedEventTime,
          acceptedTime: formattedAcceptedTime,
          isPerformed: fieldForRole.isPerformed || "notPerformed",
          comments: fieldForRole.comments || "",
        });
      }
    }

    setTpEvidenceFiles(row.uploadedEvidence);
    setIsModalOpen(true);
    setAlertView(row);
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
    setTransferAlertId({
      alertId: row._id.toString(),
      acceptedBy: row.acceptedBy.toString(),
      assignedTo: row.assignedTo,
      fieldsToFill: row.fieldsToFill,
    });
  };

  const isAdminRole = ["Admin", "CISO", "SOC Manager"].includes(user.role);

  const isDisabled =
    isAdminRole &&
    input.isPerformed !== "performed" &&
    (!input.comments || input.comments.trim() === "");





        // FETCH FUNCTION
      const fetchAssignedAlerts = async () => {
        try {
          setLoading(true);
          // CALL THE NEW API WITH view="incident"
          const response = await API.get(
            `/api/v1/alert/paginated/pendingActionAlerts?page=${
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
        fetchAssignedAlerts();
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
        fetchAssignedAlerts();
      };
    
      const changeLimit = (newLimit) => {
        const parsedLimit = parseInt(newLimit);
        setLimit(parsedLimit);
        selectedPage.current = 1;
        fetchAssignedAlerts();
      };

  return (
    <>
      <Title title={"SEM | Assigned Alert"} />

      <div className="bg-gray-900 text-gray-200 min-h-screen  font-sans py-12">
        <main className="p-8">
          <Breadcrumb />
          <div className="content container-fluid">
            <div className="row">
              <div className="col-md-12">
                <div className="flex items-center gap-2 !p-3 !rounded-t">
                  <h5 className="flex items-center !text-red-500 text-lg font-semibold space-x-2 p-0 m-0">
                    {" "}
                    Assigned Alert
                  </h5>

                  <Package className="h-6 w-6 ml-2.5 text-cyan-400" />
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

                                  <td className="py-1 px-2">
                                    {item.incidentDeclarationRequired ===
                                    "yes" ? (
                                      item.isIncidence === "yes" ? (
                                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                                          Incident Declared
                                        </span>
                                      ) : (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                          Not Incident
                                        </span>
                                      )
                                    ) : item.status === "unassigned" ? (
                                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                                        Not Assigned
                                      </span>
                                    ) : (
                                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                        Accepted
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-2 px-3 text-sm">
                                    <div className="relative flex flex-wrap items-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleInvestigation(item)
                                        }
                                        className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                                      >
                                        <i className="fa fa-line-chart"></i>
                                        <span>Investigation</span>
                                      </button>

                                      {user.role === "Level_2" && (
                                        <div className="relative">
                                          <button
                                            onClick={() => handleChat(item._id)}
                                            className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                                          >
                                            <i className="fa-solid fa-comments"></i>
                                            <span>Chat</span>
                                          </button>

                                          {unreadCountMap[item._id]?.includes(
                                            user.role
                                          ) && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                                              {
                                                unreadCountMap[
                                                  item._id
                                                ]?.filter(
                                                  (item) => item === user.role
                                                ).length
                                              }
                                            </span>
                                          )}
                                        </div>
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
              </div>
            </div>
          </div>
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
                Alert details
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
              onSubmit={handleActionsPerformed}
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
                      <h6 className=" flex flex-end gap-2 align-middle !text-amber-500 font-medium mb-3  underline underline-offset-8">
                        Alert Information
                        {/* <Printer
                          className="w-4 h-4 text-cyan-400 cursor-pointer"
                          onClick={handlePrint}
                        /> */}
                      </h6>

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
                          <div></div>
                        </div>

                        {/* ===== Other Division Informed ===== */}

                        {input.fieldsToFill &&
                          input.fieldsToFill.length > 0 && (
                            <div className="mt-6">
                              <h6 className="!text-amber-500 font-medium mb-3 underline underline-offset-8">
                                Other Division Informed
                              </h6>
                              <hr className="border-gray-700 mb-4" />

                              <div className="space-y-4">
                                {Array.isArray(input.fieldsToFill) &&
                                  input.fieldsToFill
                                    // ✅ Only show items where role matches current userRole
                                    .filter((field) => field.role === user.role)
                                    .map((field, index) => (
                                      <div
                                        key={field._id || index}
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
                                const filteredFields = input.fieldsToFill
                                  // ✅ Only show history for current userRole
                                  .filter((field) => field.role === user.role)
                                  .filter((field) => {
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
                                      <h6 className="!text-amber-500 font-medium mb-3 underline underline-offset-8">
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

                        {input.verdict === "true_Positive" && (
                          <>
                            {" "}
                            <hr className="my-4 border-gray-700" />
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
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                                <div className="text-sm">
                                  <strong className="text-gray-200">
                                    Escalation:
                                  </strong>{" "}
                                  <span className="text-gray-300">
                                    {input.escalation}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {input.escalation === "yes" && (
                          <>
                            <div className="mt-4 bg-gray-800/50 rounded-2xl p-6 shadow-md border border-gray-700">
                              <h6 className="!text-amber-500 font-medium  mb-3 underline underline-offset-8 ">
                                Escalation Details
                              </h6>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                {/* Investigation Findings */}
                                <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                  <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                    Reason for Escalation :
                                  </strong>
                                  <span className="text-gray-300 mt-3 block">
                                    {input.escalationReason}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {Array.isArray(input.fieldsToFill) &&
                          input.fieldsToFill.length > 0 &&
                          input.fieldsToFill.map((field, index) => {
                            const hasComments = field.comments?.trim() !== "";
                            const shouldShow =
                              (field.role === user.role &&
                                field.isPerformed === "notPerformed" &&
                                hasComments) ||
                              (field.role === user.role &&
                                field.isPerformed === "performed" &&
                                !hasComments) ||
                              (field.role === user.role &&
                                field.isPerformed === "performed" &&
                                hasComments);

                            return (
                              shouldShow && (
                                <div
                                  key={field._id || index}
                                  className="mt-4 bg-gray-800/50 rounded-2xl p-6 shadow-md border border-gray-700"
                                >
                                  <h6 className="text-red-400 font-semibold mb-3 underline underline-offset-8">
                                    Previous Actioned Performed History
                                  </h6>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                      <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                        Actioned Performed :
                                      </strong>
                                      <span className="text-gray-300 mt-2 block">
                                        {field.isPerformed}
                                      </span>
                                    </div>

                                    <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                      <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                        Comments :
                                      </strong>
                                      <span className="text-gray-300 mt-2 block">
                                        {field.comments || "No Comments"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            );
                          })}

                        {/* Actions Performed Switch */}
                        <div className="mt-5">
                          <label className="block text-gray-300 font-medium mb-2">
                            Actions Performed ?{" "}
                            <span className="text-red-500 text-lg">*</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={input.isPerformed === "performed"}
                                onChange={(e) =>
                                  setInput((prev) => ({
                                    ...prev,
                                    isPerformed: e.target.checked
                                      ? "performed"
                                      : "notPerformed",
                                  }))
                                }
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            {input.isPerformed === "performed"
                              ? "Performed"
                              : "Not Performed"}
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-5">
                          <label className="block text-gray-300 font-medium mb-2">
                            Comments :
                          </label>
                          <textarea
                            rows={3}
                            name="comments"
                            value={input.comments}
                            onChange={handleInputChange}
                            className="w-full text-sm text-gray-200 bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            placeholder="Write your comments..."
                          ></textarea>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="mt-6 flex gap-3">
                        <button
                          type="submit"
                          disabled={
                            isDisabled
                          }
                          className={`w-full flex justify-center items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer ${
                            input.isPerformed === "performed" ||
                            input.comments?.trim() !== ""
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-gray-600 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          <i className="fa fa-thumbs-up" aria-hidden="true"></i>
                          {alertLoader ? "Submitting..." : "Submit"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      )}

      {/* transfer modal */}
      <TransferModal
        transferModalOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        alertId={transferAlertId}
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

export default AssignedAlert;
