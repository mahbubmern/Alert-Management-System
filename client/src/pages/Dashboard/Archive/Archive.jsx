import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import Title from "../../../components/Title/Title";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../features/auth/authSlice";
import { getAllAlert } from "../../../features/incoming/alertApiSlice";
import { alertSelector } from "../../../features/incoming/alertSlice";
import dayjs from "dayjs";
import pdf from "../../../assets/frontend/img/icons8-pdf-40.png";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);

import { formatDateTimeReadable } from "../../../utils/ConvertTime.js";
// import { usePrintHelper } from "../../../utils/ConvertTime.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Package,
  Printer,
  Search,
} from "lucide-react";

import ReactPaginate from "react-paginate";

// import html2canvas from "html2canvas-pro";
// import jsPDF from "jspdf";
import AlertReport from "../../../components/AlertReport/AlertReport.jsx";

import { BlobProvider } from "@react-pdf/renderer";
import AlertStepper from "../../../components/Stepper/Stepper.jsx";
import { useDebounce } from "../../../hooks/debounce.jsx";
import API from "../../../utils/api.js";

const Archive = () => {
  // Print Functionality
  // const { componentRef, handlePrint } = usePrintHelper();

  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tpEvidenceFiles, setTpEvidenceFiles] = useState([]);
  const [messages, setMessages] = useState([]);



    // Pagination State
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const selectedPage = useRef(1);
    const [loading, setLoading] = useState(false);
      const [searchTerm, setSearchTerm] = useState("");
      const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms

  const { user, loader, error, message } = useSelector(authSelector);
  const { alertError, alertMessage, alert, alertLoader } =
    useSelector(alertSelector);

  const dispatch = useDispatch();

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
    tpRemedationNote: "",
    L2verdict: "false_positive",
  });

  // word count function

  const wordCount = input.fpNote
    ? input.fpNote.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleFileShow = (file) => {
    const fileName = file && file;
    const baseURL = import.meta.env.VITE_APP_URL;
    const filePath = `${baseURL}/files/${fileName}`;
    window.open(filePath, "_blank");
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  //use Effect Use for Closed Alert
  useEffect(() => {
    dispatch(getAllAlert());
  }, [dispatch]);

  // useEffect(() => {
  //   if (!user?._id || !Array.isArray(alert)) return;

  //   if (
  //     user.branch ===
  //     "99341-Information Security, IT Risk Management & Fraud Control Division"
  //   ) {
  //     // ✅ For this branch: only closed alerts
  //     setData(alert.filter((item) => item.status === "closed"));
  //   } else {
  //     // ✅ For other branches: apply conditions
  //     const filtered = alert.filter((item) => {
  //       // normalize assignedTo as IDs
  //       const assignedIds =
  //         item.assignedTo?.map((a) =>
  //           typeof a === "object" ? a._id?.toString() : a?.toString()
  //         ) || [];

  //       const alreadyAssigned = assignedIds.includes(user._id.toString());

  //       const isActionDone = item.fieldsToFill?.some(
  //         (option) =>
  //           option.role === user.role &&
  //           (option.isPerformed === "performed" ||
  //             option.comments?.trim() !== "")
  //       );

  //       return (
  //         item.escalationToOtherUsersRole?.some((role) =>
  //           role.toRoles.includes(user.role)
  //         ) &&
  //         alreadyAssigned &&
  //         isActionDone
  //       );
  //     });

  //     setData(filtered);
  //   }
  // }, [alert, user._id, user.branch, user.role]);


  // search fill to fields user role wise

  //   // new tailwind design
  // for table
  const [openAlertDetails, setOpenAlertDetails] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });

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

  // // pagination code
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

  // for testing purpose

  //   const printData = {
  //   _id: "AL-1023",
  //   alertSource: "SOC Monitoring",
  //   subject: "Suspicious login attempt",
  //   date: "2025-11-11T10:30:00Z",
  //   description: "Multiple failed login attempts detected from foreign IP.",
  //   status: "escalated",
  //   assigned: ["44956-Md Mahbubur Rahman", "44902-Md Zahedul Islam"],
  // };

  // const handlePdfDownload = async () => {

  //   const element = printRef.current;
  //   console.log(element);

  //   if (!element) {
  //     return;
  //   }
  //   const canvas = await html2canvas(element);
  //   const data = canvas.toDataURL("image/png");

  //   const pdf = new jsPDF({
  //     orientation: "portrait",
  //     unit: "px",
  //     format: "a4",
  //   });

  //   pdf.addImage(data, "PNG", 0, 0, 100, 100);
  //   pdf.save("Alert Report.pdf");
  // };

  // const handlePdfDownload = async () => {
  //   const element = printPdfRef.current;

  //   if (!element) {
  //     console.error("Print reference not found!");
  //     return;
  //   }

  //   const canvas = await html2canvas(element, {
  //     scale: 2,
  //     allowTaint: true,
  //     backgroundColor: "#ffffff",
  //   });

  //   const imgData = canvas.toDataURL("image/png");
  //   const pdf = new jsPDF("p", "mm", "a4");

  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const pageHeight = pdf.internal.pageSize.getHeight();

  //   const imgWidth = pageWidth;
  //   const imgHeight = (canvas.height * imgWidth) / canvas.width;

  //   // Calculate the ratio of the image height to the page height
  //   const totalPages = Math.ceil(imgHeight / pageHeight);

  //   // If it fits in one page
  //   if (imgHeight <= pageHeight + 5) {
  //     pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  //     pdf.setFontSize(7);
  //     pdf.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, {
  //       align: "center",
  //     });
  //   } else {
  //     // For multi-page content
  //     let heightLeft = imgHeight;
  //     let position = 0;
  //     let pageNumber = 1;

  //     while (heightLeft > 0) {
  //       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  //       pdf.setFontSize(7);
  //       pdf.text(
  //         `Page ${pageNumber} of ${totalPages}`,
  //         pageWidth / 2,
  //         pageHeight - 10,
  //         { align: "center" }
  //       );

  //       heightLeft -= pageHeight;
  //       if (heightLeft > 0) {
  //         pdf.addPage();
  //         position -= pageHeight;
  //         pageNumber++;
  //       }
  //     }
  //   }

  //   pdf.save("alert-report.pdf");
  // };



    // FETCH FUNCTION
    const fetchArchive = async () => {
      try {
        setLoading(true);
        // CALL THE NEW API WITH view="archive"
        const response = await API.get(
          `/api/v1/alert/paginated?page=${selectedPage.current}&limit=${limit}&view=archive&search=${encodeURIComponent(
          debouncedSearchTerm
        )}`
        );
  
        const { alerts, pagination } = response.data?.data
        
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
      fetchArchive();
    }, [limit, debouncedSearchTerm, dispatch, selectedPage, alert,user._id, user.role]); // Add other dependencies if needed
  
  
    
  
    const handlePageClick = (e) => {
      selectedPage.current = e.selected + 1;
      fetchArchive();
    };
  
      const changeLimit = (newLimit) => {
      const parsedLimit = parseInt(newLimit);
      setLimit(parsedLimit);
      selectedPage.current = 1;
      fetchArchive();
    };


  return (
    <>
      <Title title={"SEM | Archive"} />

      <div className="bg-gray-900 text-gray-200 min-h-screen  font-sans py-12">
        <main className="p-8">
          <Breadcrumb />

          <div className="flex items-center gap-2 !pt-3 pb-3  !rounded-t">
            <h5 className="flex items-center !text-red-500 text-lg font-semibold space-x-2 p-0 m-0">
              {" "}
              Archive
            </h5>

            <Package className="h-6 w-6 ml-2.5 text-cyan-400" />
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

                            <td className="py-1 px-2">
                              {item.status === "closed" ? (
                                <span className="bg-red-600 text-white text-xs px-2 py-1 ">
                                  Closed
                                </span>
                              ) : (
                                <span className="bg-green-600 text-white text-xs px-2 py-1 ">
                                  Open
                                </span>
                              )}
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
                              <div className="flex flex-wrap gap-2 items-center">
                                <button
                                  onClick={() => handleFollowUp(item)} // add your click handler
                                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-2 py-1  flex items-center gap-1 cursor-pointer"
                                >
                                  <i className="fa fa-line-chart"></i> View
                                  Alert
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

      {/* tailwind css start */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50  flex items-center justify-center bg-black/40 bg-opacity-50
          transition-opacity duration-500 ease-out"
        >
          {/* MODAL CONTAINER */}
          <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative mt-5">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-amber-600 pb-2 ">
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


                        {user.branch ===
                          "99341-Information Security, IT Risk Management & Fraud Control Division" && (
                          <>
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
                          </>
                        )}

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
                                        ))}
                                      </div>
                                    </div>
                                  )
                                );
                              })()}
                            </div>
                          )}

                        {user.branch ===
                          "99341-Information Security, IT Risk Management & Fraud Control Division" && (
                          <>
                            {/* ===== Details Information of Incidence and Remediation ===== */}
                            {filledFields2.length > 0 && (
                              <div className="mt-8">
                                <h6 className="!text-amber-500 font-semibold mb-3 underline underline-offset-8 ">
                                  Details Information of Incidence and
                                  Remediation
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
                                          ? formatDateTimeReadable(
                                              alertView[key]
                                            )
                                          : alertView[key]}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* L2 Processing Field Start */}

                        {user.branch ===
                          "99341-Information Security, IT Risk Management & Fraud Control Division" &&
                        input.verdict === "false_positive" ? (
                          <>
                            <div className="mt-4">
                              <h6 className="!text-amber-500 font-medium  mb-3 underline underline-offset-8 ">
                                FP Closure Note
                              </h6>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
                              <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                <span className="text-gray-300 mt-3 block">
                                  {input.fpNote}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <></>
                        )}

                        {input.L2verdict === "false_positive" && (
                          <>
                            <div className="mt-4">
                              <h6 className="!text-amber-500 font-medium  mb-3 underline underline-offset-8 ">
                                L2 Verdict :
                              </h6>

                              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
                                <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                  <strong className="block  border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                    {input.L2verdict === "false_positive"
                                      ? "False Positive"
                                      : "True Positive"}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {input.isIncidence === "yes" &&
                          !filledFields2.some(
                            (field) => field.key === "irp"
                          ) && (
                            <>
                              <div className="mt-4 bg-gray-800/50 rounded-2xl p-6 shadow-md border border-gray-700">
                                <h6 className="!text-amber-500 font-medium  mb-3 underline underline-offset-8 ">
                                  Details Information of Incidence and
                                  Remediation
                                </h6>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  {/* Investigation Findings */}
                                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                    <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                      IRP Initiated?:
                                    </strong>
                                    <span className="text-gray-300 mt-3 block">
                                      {input.irp}
                                    </span>
                                  </div>

                                  {/* Investigation Methodology and Tools */}
                                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                                    <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                      L2 Root Cause Analysis:
                                    </strong>
                                    <span className="text-gray-300 mt-3 block">
                                      {input.rootCause}
                                    </span>
                                  </div>

                                  {/* Incident Declaration Required */}
                                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 ">
                                    <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                      L2 Remediation Plan:
                                    </strong>
                                    <span className="text-gray-300 mt-3 block">
                                      {input.l2RemediationPlan}
                                    </span>
                                  </div>
                                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 ">
                                    <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                      L2 Remediation Validation :
                                    </strong>
                                    <span className="text-gray-300 mt-3 block">
                                      {input.l2RemediationValidation}
                                    </span>
                                  </div>

                                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 ">
                                    <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                      L2 Resolution Timestamp:
                                    </strong>
                                    <span className="text-gray-300 mt-3 block">
                                      {formatDateTimeReadable(
                                        input.l2ResolutionTimestamp
                                      )}
                                    </span>
                                  </div>
                                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 ">
                                    <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                      Hand Back To L1 Assignee :
                                    </strong>
                                    <span className="text-gray-300 mt-3 block">
                                      {input.handBackToL1Assignee}
                                    </span>
                                  </div>

                                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 md:col-span-2">
                                    <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
                                      Hand Back Note to L1 Assignee:
                                    </strong>
                                    <span className="text-gray-300 mt-3 block">
                                      {input.handBackNoteToL1}
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

      {/* <BlobProvider
        document={<AlertReport data={data} user={user} />}
        // optional: fileName prop not supported here but we'll create anchor with URL
      ></BlobProvider> */}

      {/* Hidden PDF content
      <div
        ref={printPdfRef}
        className="absolute -left-[9999px] top-0 w-[794px] bg-white z-[-1]"
      >
        <AlertReport data={input} user={user} />
      </div> */}
    </>
  );
};

export default Archive;

// {user.branch ===
//   "99341-Information Security, IT Risk Management & Fraud Control Division" &&
//   input.escalation === "yes" && (
//     <>
//       <div className="mt-4">
//         <h6 className="!text-amber-500 font-medium  mb-3 underline underline-offset-8 ">
//           L2 Processing Area
//         </h6>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
//         {/* Investigation Findings */}
//         <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
//           <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
//             Investigation Findings:
//           </strong>
//           <span className="text-gray-300 mt-3 block">
//             {input.investigationFindings}
//           </span>
//         </div>

//         {/* Investigation Methodology and Tools */}
//         <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700">
//           <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
//             Investigation Methodology and Tools:
//           </strong>
//           <span className="text-gray-300 mt-3 block">
//             {input.investigationToolsUsed}
//           </span>
//         </div>

//         {/* Incident Declaration Required */}
//         <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 ">
//           <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
//             Incident Declaration Required:
//           </strong>
//           <span className="text-gray-300 mt-3 block">
//             {input.incidentDeclarationRequired}
//           </span>
//         </div>
//         <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 ">
//           <strong className="block border-b border-gray-600 text-cyan-400 w-fit pb-1 font-medium">
//             Incident :
//           </strong>
//           <span className="text-gray-300 mt-3 block">
//             {input.incidentDeclarationRequired}
//           </span>
//         </div>
//       </div>
//     </>
//   )}
