import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import Title from "../../../components/Title/Title";
import { useState, useEffect, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../features/auth/authSlice";

import API from "../../../utils/api";
import createToast from "../../../utils/createToast";
import { showLoader, hideLoader } from "../../../features/incoming/loaderSlice";
import Loader from "../../../components/Loader/Loader.jsx";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardMinus,
  Search,
  View,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import { formatDateTimeReadable } from "../../../utils/ConvertTime.js";
import AlertReportsModal from "../../../components/Vulnerability_Management_Portal/AlertReportsModal.jsx";
import { useDebounce } from "../../../hooks/debounce.jsx";
import { useRef } from "react";

const Report = () => {
  // for table

  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });

  const { user, loader, error, message } = useSelector(authSelector);
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  const [data, setData] = useState([]);
  const [users, setUsers] = useState();

  // Pagination State
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const selectedPage = useRef(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms
  const [exportData, setExportData] = useState([]);

  // for report modal

  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  const dispatch = useDispatch();

  const [input, setInput] = useState({
    alertName: "",
    alertSource: "",
    severity: "",
    isIncidence: "",
    initiator: "",
    status: "",
    verdict: "",
  });

  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  // search user

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       dispatch(showLoader());
  //       const response = await API.get("/api/v1/user");
  //       const sortedData = response.data.user.reverse();

  //       setUsers(sortedData.filter((user) => user.role === "Level_1"));
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     } finally {
  //       dispatch(hideLoader());
  //     }
  //   };

  //   fetchData();
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(showLoader());

        const response = await API.get("/api/v1/user/getAllLevel1Users");

        setUsers(response.data.user);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchData();
  }, [user, dispatch]);

  const handleReportGenerate = async (e) => {
    e.preventDefault();

    if (
      input.severity === "choose" ||
      input.verdict === "choose" ||
      input.alertSource === "choose" ||
      input.isIncidence === "choose" ||
      input.initiator === "choose" ||
      input.status === "choose"
    ) {
      setData([]);
      return createToast("You selected 'choose', please reload the page");
    }

    if (
      !input.alertSource.trim() &&
      !input.alertName.trim() &&
      fromDate === undefined &&
      !input.initiator.trim() &&
      !input.isIncidence.trim() &&
      !input.status.trim() &&
      !input.verdict.trim() &&
      !input.severity.trim() &&
      toDate === undefined
    ) {
      return createToast("No filters provided");
    }

    const formData = {
      fromDate,
      toDate,
      alertSource: input.alertSource,
      severity: input.severity,
      alertName: input.alertName,
      isIncidence: input.isIncidence,
      initiator: input.initiator,
      status: input.status,
      verdict: input.verdict,
    };

    try {
      dispatch(showLoader());

      // ✅ Update 1: Pass page and limit in URL
      const result = await API.post(
        `/api/v1/alert/report?page=${selectedPage.current}&limit=${limit}`,
        formData
      );

      // ✅ Update 2: Read nested data (result.data.data.alerts)
      if (result.data.data?.alerts?.length > 0) {
        setData(result.data.data.alerts); // <-- Changed from result.data.data
        setTotalRecords(result.data.data.pagination.totalAlerts);
        setTotalPages(result.data.data.pagination.totalPages);
        // Optional: Store total pages if you have a pagination component
        // setTotalPages(result.data.data.pagination.totalPages);
        return;
      }

      setData([]);
      return createToast("No Alert Found Based on your search");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // ✅ show toast when no filters are sent
        createToast(error.response.data.message);
      } else {
        console.error("Error fetching alerts:", error);
        createToast("Server error while fetching alerts");
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const handlePdfExport = async (e) => {
    e.preventDefault(); // Prevent form submission if inside form

    // 1. Recreate the filter object (Same as in handleReportGenerate)
    const formData = {
      fromDate,
      toDate,
      alertSource: input.alertSource,
      severity: input.severity,
      alertName: input.alertName,
      isIncidence: input.isIncidence,
      initiator: input.initiator,
      status: input.status,
      verdict: input.verdict,
    };

    try {
      dispatch(showLoader());

      // 2. Call API with limit=0 to get ALL matching records
      const result = await API.post(
        `/api/v1/alert/report?page=1&limit=0`,
        formData
      );

      if (result.data.data?.alerts?.length > 0) {
        // 3. Store the FULL list (78 items) in the export state
        setExportData(result.data.data.alerts);
        // 4. Open the modal ONLY after data is fetched
        setIsReportsModalOpen(true);
      } else {
        createToast("No data available to export");
      }
    } catch (error) {
      console.error("Export error:", error);
      createToast("Failed to fetch export data");
    } finally {
      dispatch(hideLoader());
    }
  };

  // for table code

  // --- Helper Constants ---
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

  // table Headers

  const tableHeaders = [
    "View",
    "Initiator",
    "Alert_ID",
    "Alert_Time",
    "Event_Time",
    "Alert_Name",
    "Alert_Source",
    "Severity",
    "Status",
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

  const handlePageClick = async (e) => {
    selectedPage.current = e.selected + 1;
    try {
      // ✅ Update 1: Pass page and limit in URL
      const result = await API.post(
        `/api/v1/alert/report?page=${selectedPage.current}&limit=${limit}`
      );

      // ✅ Update 2: Read nested data (result.data.data.alerts)
      if (result.data.data?.alerts?.length > 0) {
        setData(result.data.data.alerts); // <-- Changed from result.data.data
        // setTotalRecords(result.data.data.pagination.totalAlerts);
        // setTotalPages(result.data.data.pagination.totalPages);
        // Optional: Store total pages if you have a pagination component
        // setTotalPages(result.data.data.pagination.totalPages);
        return;
      }

      setData([]);
      return createToast("No Alert Found Based on your search");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // ✅ show toast when no filters are sent
        createToast(error.response.data.message);
      } else {
        console.error("Error fetching alerts:", error);
        createToast("Server error while fetching alerts");
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const changeLimit = (newLimit) => {
    const parsedLimit = parseInt(newLimit);
    setLimit(parsedLimit);
    selectedPage.current = 1;
  };

  return (
    <>
      <Title title={"SEM | Report"} />

      <div className="min-h-screen bg-gray-900 text-gray-200 py-12">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="py-8">
            <Breadcrumb />
          </div>

          {/* Report Form */}
          <div className="bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center gap-2 p-3 border-b border-gray-700">
              <h5 className="text-red-500 text-lg font-semibold m-0">Report</h5>
              <ClipboardMinus strokeWidth={1} className="w-6 h-6 m-0 text-c" />
            </div>

            <form onSubmit={handleReportGenerate} className="p-4 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">From</label>
                  <input
                    type="datetime-local"
                    name="fromDate"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none datetime-input"
                    // className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 datetime-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To</label>
                  <input
                    type="datetime-local"
                    name="toDate"
                    value={toDate}
                    onChange={handleToDateChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none datetime-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Alert Source
                  </label>
                  <select
                    name="alertSource"
                    value={input.alertSource || ""}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="choose">Choose...</option>
                    <option value="Firewall MZ">Firewall MZ</option>
                    <option value="Firewall DMZ">Firewall DMZ</option>
                    <option value="Trellix ePolicy Orchestrator">
                      Trellix ePolicy Orchestrator
                    </option>
                    <option value="MCM Console">MCM Console</option>
                    <option value="Oracle Audit Vault">
                      Oracle Audit Vault
                    </option>
                    <option value="Oracle Enterprise Manager">
                      Oracle Enterprise Manager
                    </option>
                    <option value="Wazuh Dashboard">Wazuh Dashboard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Severity
                  </label>
                  <select
                    name="severity"
                    value={input.severity || ""}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="choose">Choose...</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Alert Name
                  </label>
                  <input
                    type="text"
                    name="alertName"
                    value={input.alertName}
                    onChange={handleInputChange}
                    placeholder="Alert Name"
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Incident
                  </label>
                  <select
                    name="isIncidence"
                    value={input.isIncidence || ""}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="choose">Choose...</option>
                    <option value="yes">Yes</option>
                    <option value="pending">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Initiator
                  </label>
                  <select
                    name="initiator"
                    value={input.initiator || ""}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="choose">Choose...</option>
                    {Array.isArray(users) &&
                      users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={input.status || ""}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="choose">Choose...</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="escalated">Escalated</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Verdict
                  </label>
                  <select
                    name="verdict"
                    value={input.verdict || ""}
                    onChange={handleSelectChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded px-3 py-2  text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="choose">Choose...</option>
                    <option value="true_positive">True Positive</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex items-end gap-4">
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-1.5 px-6 rounded transition duration-300 cursor-pointer"
                  >
                    Generate Report
                  </button>

                  {/* for PDF Report */}
                  {Array.isArray(data) && data.length > 0 && (
                    <button
                      type="button" // Important: type="button" to prevent form submit
                      onClick={handlePdfExport} // Call the new function
                      className="w-full md:w-auto bg-green-800 hover:bg-green-700 text-white font-medium py-1.5 px-6 rounded transition duration-300 cursor-pointer"
                    >
                      Get PDF Report
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Loader */}
          <Loader />

          {/* Table */}
          {Array.isArray(data) && data.length > 0 && (
            <div className="bg-gray-900 text-gray-200 font-sans">
              <main className="p-0">
                <section id="vulnerabilities">
                  <div className="w-full bg-gray-800  rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      {/* <h2 className="text-lg font-bold text-white"></h2> */}
                      <div className="flex items-center gap-4">
                        {/* <select
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
                  </select> */}
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
                                  Initiator: "author",
                                  Alert_ID: "alertId",
                                  Alert_Time: "createdAt",
                                  Event_Time: "eventTime",
                                  Alert_Name: "alertName",
                                  Alert_Source: "alertSource",
                                  Severity: "severity",
                                  Status: "status",
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
                            {Array.isArray(data) &&
                              data.map((item, index) => (
                                <tr
                                  key={index}
                                  className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors "
                                >
                                  <td
                                    className="p-2 text-cyan-300 cursor-pointer"
                                    onClick={() => handleUserDetails(item._id)}
                                  >
                                    <View className="w-4 h-4 mr-2" />
                                  </td>
                                  <td className="p-2 font-medium text-sm text-gray-400">
                                    {item.author?.name}
                                  </td>
                                  <td className="p-2 text-gray-400 text-sm">
                                    {item.alertId}
                                  </td>
                                  <td className="p-2 text-gray-400 text-sm">
                                    {formatDateTimeReadable(item.createdAt)}
                                  </td>
                                  <td className="p-2 text-gray-400 text-sm">
                                    {formatDateTimeReadable(item.eventTime)}
                                  </td>
                                  <td className="p-2 text-gray-400 text-sm">
                                    {item.alertName}
                                  </td>
                                  <td className="p-2 text-gray-400 text-sm">
                                    {item.alertSource}
                                  </td>

                                  <td className="p-2">
                                    <span
                                      className="font-bold text-sm"
                                      style={{
                                        color: SEVERITY_COLORS[item.severity],
                                      }}
                                    >
                                      {item.severity}
                                    </span>
                                  </td>

                                  <td className="p-2">
                                    <span
                                      className={`px-2  py-1 rounded-full text-xs font-semibold ${
                                        STATUS_COLORS[item.status]
                                      }`}
                                    >
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
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
          )}
        </div>
      </div>

      {/* Report  */}
      <AlertReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        dataToExport={exportData}
        serviceName={"Alert Report"}
      />
    </>
  );
};

export default Report;
