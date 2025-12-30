import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb.jsx";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import createToast from "../../../utils/createToast.js";
import { getAllAlert } from "../../../features/incoming/alertApiSlice.js";

import {
  alertSelector,
  setEmptyAlertMessage,
} from "../../../features/incoming/alertSlice.js";
import { authSelector } from "../../../features/auth/authSlice.js";
import API from "../../../utils/api.js";
import Title from "../../../components/Title/Title.jsx";

import {
  generateDateTime,
  generateUniqueAlertId,
} from "../../../utils/GenerateAlertId.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);
import ReactPaginate from "react-paginate";
import pdf from "../../../assets/frontend/img/icons8-pdf-40.png";
import ChatBox from "../../../components/ChatBox/ChatBox.jsx";
import { formatDateTimeReadable } from "../../../utils/ConvertTime.js";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Handshake,
  Hourglass,
  Search,
  Printer,
  Download,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import AlertReport from "../../../components/AlertReport/AlertReport.jsx";

import { BlobProvider } from "@react-pdf/renderer";
import { useDebounce } from "../../../hooks/debounce.jsx";

const PendingAlert = () => {
  // for Print

  // present project code start
  const [alertId, setAlertId] = useState("");
  const [alertTime, setAlertTime] = useState("");

  useEffect(() => {
    setAlertId(generateUniqueAlertId());
    setAlertTime(generateDateTime());
  }, []);

  const dispatch = useDispatch();
  const { alertError, alertMessage, alert, alertLoader } =
    useSelector(alertSelector);
  const { user, loader, error, message } = useSelector(authSelector);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState(null);

  const [data, setData] = useState([]);
  const [deadLines, setDeadLines] = useState("");


    // Pagination State
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const selectedPage = useRef(1);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms

  const [tpEvidenceFiles, setTpEvidenceFiles] = useState([]);

  // chatting section start
  const [messages, setMessages] = useState([
    // { type: "bot", text: "Hi! How can I help you?" },
    // { type: "user", text: "Hello! I want to learn Socket.IO" },
  ]);
  const messagesEndRef = useRef(null);

  // chat

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileShow = (file) => {
    const fileName = file && file;
    const halffilepath = `http://localhost:5050/files`;
    const filePath = `${halffilepath}/${file}`;
    window.open(filePath, "_blank");
  };

  const closeModal = () => {
    // Close the modal
    setIsModalOpen(false);
  };

  // handle edit button

  useEffect(() => {
    if (editSelectedFile) {
      if (editSelectedFile.deadLine === null) {
        setDeadLines(currentDate);
      } else {
        setDeadLines(editSelectedFile.deadLine);
      }
    }
  }, [editSelectedFile]);

  // form Data init

  const [input, setInput] = useState({
    alertName: "",
    alertSource: "",
    eventTime: "",
    affectedIpWebsite: "",
    affectedUserDevice: "",
  });



  // useEffect(() => {
  //   if (!Array.isArray(alert)) return;

  //   const filtered = alert.filter((item) => {
  //     // normalize assignedTo as IDs
  //     const assignedRole =
  //       item.assignedTo?.map((a) => (typeof a === "object" ? a.role : "")) ||
  //       [];

  //     const alreadyAssignedRole = assignedRole.includes(user.role);

  //     if (
  //       user.role === "Admin" ||
  //       user.role === "SOC Manager" ||
  //       user.role === "CISO"
  //     ) {
  //       // All fieldsToFill roles
  //       const fieldsToFillRoles = item.fieldsToFill?.map((f) => f.role) || [];

  //       // Check: Are ALL fieldsToFill roles present in assignedRoles?
  //       const allMatched = fieldsToFillRoles.every((role) =>
  //         assignedRole.includes(role)
  //       );
  //       return !allMatched;
  //     }

  //     return (
  //       item.escalationToOtherUsersRole?.some((role) =>
  //         role.toRoles.includes(user.role)
  //       ) && !alreadyAssignedRole
  //     );
  //   });

  //   setData(filtered);
  // }, [alert, user.role, user._id]);

  useEffect(() => {
    if (alertMessage) {
      createToast(alertMessage, "success");
      dispatch(setEmptyAlertMessage());
      setInput({
        eventTime: "",
        alertName: "",
        alertSource: "",
        severity: "",
        affectedIpWebsite: "",
        affectedUserDevice: "",
      });
    }
    if (alertError) {
      createToast(alertError);

      dispatch(setEmptyAlertMessage());
    }
  }, [alertMessage, alertError, dispatch]);

  //   // new tailwind design
  // for table
  const [openAlertDetails, setOpenAlertDetails] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });

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



  const formatDatetimeLocal = (dateString) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  };

  const handleView = (row) => {
    const formattedEventTime = formatDateTimeReadable(row.eventTime);
    const formattedUpdatedTime = formatDateTimeReadable(row.acceptedTime);

    setInput({
      ...row,
      eventTime: formattedEventTime,
      acceptedTime: formattedUpdatedTime,
    });

    setIsModalOpen(true);
    setTpEvidenceFiles(row.uploadedEvidence);

    const matchAlert = alert.find((item) => item._id === row._id);
    setMessages(matchAlert?.communicationLog);
  };

  const handleAccept = async (row) => {
    if (user._id !== row.author._id) {
      const formData = {
        userId: user._id,
        alertId: row._id,
      };

      try {
        await API.patch(`/api/v1/alert/escalateAlertAssignedTo`, formData);

        // Fetch latest data from backend
        fetchPendingAlerts()

        createToast("Alert Accepted", "success");
      } catch (error) {
        console.error("Failed to update alert:");
      }
    } else {
      createToast("Unauthorised to Accept");
    }
  };


    // FETCH FUNCTION
  const fetchPendingAlerts = async () => {
    try {
      setLoading(true);
      // CALL THE NEW API WITH view="incident"
      const response = await API.get(
        `/api/v1/alert/paginated/pendingAlerts?page=${
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
    fetchPendingAlerts();
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
    fetchPendingAlerts();
  };

  const changeLimit = (newLimit) => {
    const parsedLimit = parseInt(newLimit);
    setLimit(parsedLimit);
    selectedPage.current = 1;
    fetchPendingAlerts();
  };

  return (
    <>
      <Title title={"SEM | Pending Alert"} />

      <div className="bg-gray-900 text-gray-200 min-h-screen  font-sans py-12">
        <main className="p-8">
          <Breadcrumb />
          <div className="content container-fluid">
            <div className="row">
              <div className="col-md-12">
                <div className="flex items-center gap-2 !p-3 !rounded-t">
                  <h5 className="flex items-center !text-red-500 text-lg font-semibold space-x-2 p-0 m-0">
                    {" "}
                    Pending Alerts
                  </h5>
                  <Hourglass className="h-6 w-6 ml-2.5 text-cyan-400" />
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
                                    {item.status === "escalated" ? (
                                      <span className="bg-red-600 text-white text-xs px-2 py-1">
                                        Escalated
                                      </span>
                                    ) : (
                                      <span className="bg-green-600 text-white text-xs px-2 py-1 ">
                                        Accepted
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-2 px-2">
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <button
                                        disabled={
                                          user.role === "Admin" ||
                                          user.role === "SOC Manager" ||
                                          user.role === "CISO"
                                        }
                                        onClick={() => handleAccept(item)} // add your click handler
                                        className="bg-green-900 hover:bg-green-800 text-white text-xs px-2 py-1  flex items-center gap-1 cursor-pointer"
                                      >
                                        <Handshake className="w-4 h-4 " />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleView(item)} // add your click handler
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-2 py-1  flex items-center gap-1 cursor-pointer"
                                      >
                                        <i className="fa fa-line-chart"></i>{" "}
                                        View Alert
                                      </button>
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

      {/* tailwind css view alert start 0*/}
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
                  {`${field.role || "Unknown Role"}: Need to Perform requested Actions below`}
                </label>
                <ul className="list-disc ml-6 mt-2">
                  <li className="text-red-400 text-sm">
                    <span>{field.value || "No action provided"}</span>
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
            const hasComments = field.comments?.trim() !== "";
            return (
              (field.isPerformed === "notPerformed" && hasComments) ||
              (field.isPerformed === "performed" && !hasComments) ||
              (field.isPerformed === "performed" && hasComments)
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
                        <strong className="text-gray-200">Action Performed:</strong>{" "}
                        <span className="text-gray-300">{field.isPerformed}</span>
                      </div>
                      <div>
                        <strong className="text-gray-200">Comments:</strong>{" "}
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
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      )}

      {/* chat */}
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

export default PendingAlert;
