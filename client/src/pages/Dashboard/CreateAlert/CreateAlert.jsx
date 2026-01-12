import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import createToast from "../../../utils/createToast";
import {
  createAlert,
  editAlert,
  getAllAlert,
} from "../../../features/incoming/alertApiSlice.js";

import {
  alertSelector,
  setEmptyAlertMessage,
} from "../../../features/incoming/alertSlice.js";
import { authSelector } from "../../../features/auth/authSlice";
import API from "../../../utils/api";
import Title from "../../../components/Title/Title";

import {
  generateDateTime,
  generateUniqueAlertId,
} from "../../../utils/GenerateAlertId.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import {
  formatDateTimeReadable,
  isValidIP,
} from "../../../utils/ConvertTime.js";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FilePenLine,
  HandCoins,
  Pencil,
  PenLine,
  Search,
} from "lucide-react";
import ReactPaginate from "react-paginate";

import toolsArray from "../SOC_Monitoring_tools/ToolsArray.js";
import { useDebounce } from "../../../hooks/debounce.jsx";

dayjs.extend(advancedFormat);

const CreateAlert = () => {
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

  // Pagination State
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const selectedPage = useRef(1);
  const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms

  // for table


  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });

  const [enabled, setEnabled] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State to control the visibility of the modal
  const [editSelectedFile, setEditSelectedFile] = useState(null);


  const [data, setData] = useState([]);

  const closeModal = () => {
    // Close the modal
    setShowCreateForm(false);
    setInput({
      eventTime: "",
      alertName: "",
      alertSource: "",
      severity: "",
      affectedIpWebsite: "",
      affectedUserDevice: "",
    });
    setCurrentDate("");
  };

  //close edit modal
  const closeEditModal = () => {
    // Close the modal
    setIsEditModalOpen(false);
    setInput({
      eventTime: "",
      alertName: "",
      alertSource: "",
      severity: "",
      affectedIpWebsite: "",
      affectedUserDevice: "",
    });
    setCurrentDate("");
  };

  const handleAccept = async (row) => {
    const formData = {
      ...row,
      status: "open",
    };

    // if (user._id === row.author._id) {
    try {
      const result = await dispatch(editAlert(formData));

      if (editAlert.fulfilled.match(result)) {
        // Fetch latest data from backend
        // const res = await dispatch(getAllAlert());
        fetchCreatedAlerts()

        createToast("Alert Accepted", "success");
        setEnabled(false);
      }
    } catch (error) {
      console.error("Failed to update alert:", error);
    }
  };

  // Helper function to format date
  const formatDatetimeLocal = (dateString) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  };

  const handleEdit = (item) => {
    const formattedEventTime = formatDatetimeLocal(item.eventTime);

    setInput({
      ...item,
      eventTime: formattedEventTime,
    });

    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (editSelectedFile) {
      if (editSelectedFile.deadLine === null) {
        setDeadLines(currentDate);
      } else {
        setDeadLines(editSelectedFile.deadLine);
      }
    }
  }, [editSelectedFile]);

  // unassigned Datatable Initialization

  const handleDateChange = (e) => {
    setCurrentDate(e.target.value);
  };

  const handleEditDateChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // form Data init

  const [input, setInput] = useState({
    alertName: "",
    alertSource: "",
    eventTime: "",
    affectedIpWebsite: "",
    affectedUserDevice: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();

    const [ipPart] = input.affectedIpWebsite.split("/");
    if (ipPart && !isValidIP(ipPart)) {
      createToast("Invalid IP address format");
      return;
    }

    if (
      !input.alertName?.trim() ||
      !input.alertSource?.trim() ||
      !input.severity?.trim() ||
      !input.affectedIpWebsite?.trim() ||
      !input.affectedUserDevice?.trim() ||
      !currentDate?.trim() ||
      input.alertSource === "choose" ||
      input.severity === "choose"
    ) {
      createToast("All fields are required");
      return;
    }

    const alertData = {
      eventTime: currentDate,
      alertName: input.alertName,
      alertSource: input.alertSource,
      severity: input.severity,
      affectedIpWebsite: input.affectedIpWebsite,
      affectedUserDevice: input.affectedUserDevice,
    };

    // Await Redux thunk so it's done before resetting UI
    const result = await dispatch(createAlert(alertData));

    if (createAlert.fulfilled.match(result)) {
      setInput({
        eventTime: "",
        alertName: "",
        alertSource: "",
        severity: "",
        affectedIpWebsite: "",
        affectedUserDevice: "",
      });
      setShowCreateForm(false);

      // Optionally re-fetch if needed (or just rely on state.alert)
      fetchCreatedAlerts()
    } else {
      console.error("Alert creation failed", result.error.message);
    }
  };

  useEffect(() => {
    fetchCreatedAlerts()
  }, [dispatch]);

  // useEffect(() => {
  //   if (Array.isArray(alert)) {
  //     const filtered = alert.filter((item) => item.status === "unassigned");
  //     setData(filtered);
  //   }
  // }, [alert]);

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

  // Function to handle changes in select inputs
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  // handle Send Incoming Modal Form

  const handleEditAlertModalForm = async (e) => {
    e.preventDefault();
    const [ipPart] = input.affectedIpWebsite.split("/");
    if (ipPart && !isValidIP(ipPart)) {
      createToast("Invalid IP address format");
      return;
    }
    const {
      alertName,
      eventTime,
      alertSource,
      severity,
      affectedIpWebsite,
      affectedUserDevice,
      _id,
      author,
    } = input;

    const formData = {
      alertName,
      eventTime,
      alertSource,
      severity,
      affectedIpWebsite,
      affectedUserDevice,
      _id,
      author,
    };

    // if (user._id === author._id) {
    // Dispatch the Alert update action
    const result = await dispatch(editAlert(formData));
    // Await Redux thunk so it's done before resetting UI

    if (editAlert.fulfilled.match(result)) {
      setInput({
        eventTime: "",
        alertName: "",
        alertSource: "",
        severity: "",
        affectedIpWebsite: "",
        affectedUserDevice: "",
      });
      closeEditModal();
      // Optionally re-fetch if needed (or just rely on state.alert)
      // dispatch(getAllAlert());
      fetchCreatedAlerts()
      createToast("Alert Updated", "success");
    } else {
      console.error("Alert update failed", result.error.message);
    }
  };

  // for tailwind css

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
    "Edit",
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

  // // pagination code
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 10;

  // const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const currentItems = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const ActionMenu = ({ user, onStatusChange, onClose }) => {
    const handleAction = async (status) => {
      try {
        const res = await API.put(`/api/v1/user/${user._id}`, { status });
        if (res.data.success === true) {
          createToast("User Status updated!", "success");
          onStatusChange(user._id, status);
          dispatch(getAllUser());
          onClose();
        } else {
          console.log("something went wrong");
        }
      } catch (error) {
        createToast(error.data.messaage);
      }
    };

    return (
      <div className="absolute right-4 mt-2 w-40 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
        <div className="flex justify-end items-center mb-0.5 mr-3">
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-white text-3xl"
          >
            &times;
          </button>
        </div>
        {user.status === "Active" && (
          <>
            <button
              onClick={() => handleAction("Blocked")}
              className="w-full text-left px-2 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center"
            >
              <CircleOff className="w-4 h-4 mr-2" />
              Blocked
            </button>
          </>
        )}
        {user.status === "Blocked" && (
          <>
            <button
              onClick={() => handleAction("Active")}
              className="w-full text-left px-2 py-2 text-sm text-green-400 hover:bg-gray-600 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Active
            </button>
          </>
        )}
      </div>
    );
  };

  const ActionRoleMenu = ({ user, onRoleChange, onClose }) => {
    const handleAction = async (role) => {
      try {
        const res = await API.put(`/api/v1/user/${user._id}`, { role });
        if (res.data.success === true) {
          createToast("User Role updated!", "success");
          onRoleChange(user._id, role);
          dispatch(getAllUser());
          onClose();
        } else {
          console.log("something went wrong");
        }
      } catch (error) {
        createToast(error.data.messaage);
      }
    };

    return (
      <div className="absolute right-4 mt-2 w-40 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
        <div className="flex justify-end items-center mb-0.5 mr-3">
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-white text-3xl"
          >
            &times;
          </button>
        </div>

        <>
          {[...new Set(sortedData.map((item) => item.role))] // ✅ unique roles
            .filter((role) => role !== user.role) // ✅ exclude current user's role
            .map((role, index) => (
              <button
                key={index}
                onClick={() => handleAction(role)}
                className="w-full text-left px-2 py-2 text-sm text-blue-400 hover:bg-gray-600 flex items-center"
              >
                <BriefcaseBusiness className="w-4 h-4 mr-2" />

                {role}
              </button>
            ))}
        </>
      </div>
    );
  };

  // FETCH FUNCTION
  const fetchCreatedAlerts = async () => {
    try {
      setLoading(true);
      // CALL THE NEW API WITH view="self_assigned"
      const response = await API.get(
        `/api/v1/alert/paginated?page=${
          selectedPage.current
        }&limit=${limit}&view=unassigned&search=${encodeURIComponent(
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
    fetchCreatedAlerts();
  }, [limit, debouncedSearchTerm, dispatch, selectedPage]); // Add other dependencies if needed

  const handlePageClick = (e) => {
    selectedPage.current = e.selected + 1;
    fetchCreatedAlerts();
  };

  const changeLimit = (newLimit) => {
    const parsedLimit = parseInt(newLimit);
    setLimit(parsedLimit);
    selectedPage.current = 1;
    fetchCreatedAlerts();
  };

  return (
    <>
      <Title title={"SEM | Create Alert"} />

      <div className="bg-gray-900 text-gray-200 min-h-screen  font-sans py-12">
        <main className="p-8">
          <Breadcrumb />
          <div className="flex items-center gap-2 pt-3 pb-3 rounded-t">
            <h5 className="flex items-center !text-red-400 text-lg font-semibold space-x-2">
              <span>Create Alert</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                className="text-current"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <polyline points="14 15 9 20 4 15" />
                <path d="M20 4h-7a4 4 0 0 0-4 4v12" />
              </svg>
              <button
              disabled={user?.role === "Auditor"}
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="ml-auto flex items-center text-sm bg-green-200 hover:bg-green-300 text-gray-900 font-medium px-3 py-1 rounded transition-colors cursor-pointer"
              >
                <i className="fe fe-plus mr-1"></i> Entry
              </button>
            </h5>
          </div>
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showCreateForm
                ? "max-h-[800px] opacity-100 animate-slide-down"
                : "max-h-0 opacity-0 animate-slide-up"
            }`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center align-middle px-6 py-1 border-b border-gray-700">
              <h6 className="text-white text-lg font-semibold mb-0">
                New Alert Information
              </h6>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-3">
              <form onSubmit={handleCreateAlert} className="space-y-4">
                {/* Row 1: Alert Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      Alert Name <span className="text-red-500 text-xl">*</span>
                    </label>
                    <input
                      type="text"
                      name="alertName"
                      placeholder="Alert Name"
                      value={input.alertName}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {/* Affected User Device */}
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      Affected User Device{" "}
                      <span className="text-red-500 text-xl">*</span>
                    </label>
                    <input
                      type="text"
                      name="affectedUserDevice"
                      placeholder="e.g. Rezaul, G-45051, 99341-ITSEC-031"
                      value={input.affectedUserDevice}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 2: Event Time, Alert Source, Severity */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Event Time */}
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      Event Time <span className="text-red-500 text-xl">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="eventTime"
                      value={currentDate}
                      onChange={handleDateChange}
                      className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 datetime-input"
                    />
                  </div>

                  {/* Alert Source */}
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      Alert Source{" "}
                      <span className="text-red-500 text-xl">*</span>
                    </label>
                    <select
                      name="alertSource"
                      value={input.alertSource || ""}
                      onChange={handleSelectChange}
                      className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="choose">Choose...</option>

                      {toolsArray.map((tool, index) => (
                        <option key={index} value={tool.value}>
                          {tool.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      Severity <span className="text-red-500 text-xl">*</span>
                    </label>
                    <select
                      name="severity"
                      value={input.severity || ""}
                      onChange={handleSelectChange}
                      className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="choose">Choose...</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {/* Affected IP/Website */}
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      Affected IP/Website{" "}
                      <span className="text-red-500 text-xl">*</span>
                    </label>
                    <input
                      type="text"
                      name="affectedIpWebsite"
                      placeholder="e.g. 192.168.0.172/spg.sonalibank.com.bd"
                      value={input.affectedIpWebsite}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 3: Affected User Device, Affected IP/Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>

                {/* Submit Button */}
                <div className="mt-4">
                  <button
                    type="submit"
                    className="w-full py-2 my-3 bg-gray-600 hover:bg-gray-500 dark:text-sky-400/100 font-semibold rounded-lg 
               transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PenLine strokeWidth={1} className="w-5 h-5" />
                    Create Alert
                  </button>
                </div>
              </form>
            </div>
          </div>

          <section id="vulnerabilities">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
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
                           
                            <td
                              className="p-2 text-cyan-300 cursor-pointer"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                            </td>

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

                            <td>
                              <button
                                disabled={
                                  user.role === "Admin" ||
                                  user.role === "SOC Manager" ||
                                  user.role === "CISO" ||
                                  user.role === "Auditor"
                                }
                                type="button"
                                onClick={() => handleAccept(item)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-cyan-400 text-xs font-medium rounded-full shadow-md transition-all duration-200 cursor-pointer"
                              >
                                <HandCoins className="w-4 h-4 text-cyan-400" />

                                <span>Accept</span>
                              </button>
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

      {/* Edit incoming  Modal */}

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50
    transition-opacity duration-500 ease-out
    ${isEditModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className={`bg-gray-800 w-full max-w-3xl rounded-lg shadow-lg transform
      transition-all duration-500 ease-out
      ${isEditModalOpen ? "scale-100 opacity-100" : "scale-100 opacity-0"}`}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center align-middle px-6 py-1 border-b border-gray-700">
            <h6 className="text-white text-lg font-semibold mb-0">
              Edit Alert
            </h6>
            <button
              onClick={closeEditModal}
              className="text-gray-400 hover:text-white text-xl font-bold cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-3">
            <form onSubmit={handleEditAlertModalForm} className="space-y-4">
              {/* alert Id row */}

              <input
                type="text"
                name="alertId"
                placeholder="Alert Id"
                value={input._id}
                hidden
                className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* author row */}

              <input
                type="text"
                name="author"
                placeholder="Author"
                value={input.author}
                hidden
                className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Row 1: Alert Name */}
              <div className="flex flex-col">
                <label className="text-gray-300 font-medium">
                  Alert Name <span className="text-red-500 text-xl">*</span>
                </label>
                <input
                  type="text"
                  name="alertName"
                  placeholder="Alert Name"
                  value={input.alertName}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Row 2: Event Time, Alert Source, Severity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Time */}
                <div className="flex flex-col">
                  <label className="text-gray-300 font-medium">
                    Event Time <span className="text-red-500 text-xl">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="eventTime"
                    value={input.eventTime || ""}
                    onChange={handleEditDateChange}
                    className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 datetime-input"
                  />
                </div>

                {/* Alert Source */}
                <div className="flex flex-col">
                  <label className="text-gray-300 font-medium">
                    Alert Source <span className="text-red-500 text-xl">*</span>
                  </label>
                  <select
                    name="alertSource"
                    value={input.alertSource || ""}
                    onChange={handleSelectChange}
                    className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="choose">Choose...</option>
                    {toolsArray.map((tool, index) => (
                      <option key={index} value={tool.value}>
                        {tool.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div className="flex flex-col">
                  <label className="text-gray-300 font-medium">
                    Severity <span className="text-red-500 text-xl">*</span>
                  </label>
                  <select
                    name="severity"
                    value={input.severity || ""}
                    onChange={handleSelectChange}
                    className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="choose">Choose...</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Affected User Device, Affected IP/Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Affected User Device */}
                <div className="flex flex-col">
                  <label className="text-gray-300 font-medium">
                    Affected User Device{" "}
                    <span className="text-red-500 text-xl">*</span>
                  </label>
                  <input
                    type="text"
                    name="affectedUserDevice"
                    placeholder="e.g. Rezaul, G-45051, 99341-ITSEC-031"
                    value={input.affectedUserDevice}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Affected IP/Website */}
                <div className="flex flex-col">
                  <label className="text-gray-300 font-medium">
                    Affected IP/Website{" "}
                    <span className="text-red-500 text-xl">*</span>
                  </label>
                  <input
                    type="text"
                    name="affectedIpWebsite"
                    placeholder="e.g. 192.168.0.172/spg.sonalibank.com.bd"
                    value={input.affectedIpWebsite}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                disabled={user?.role === "Auditor"}
                  type="submit"
                  className="w-full py-2 my-2 bg-gray-600 hover:bg-gray-500 dark:text-sky-400/100 font-semibold !rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    <FilePenLine strokeWidth={1} />
                  </span>{" "}
                  Edit Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateAlert;
