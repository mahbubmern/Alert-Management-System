import { useMemo, useState, useEffect, useRef } from "react";
import { formatDateTimeReadable } from "../../../utils/ConvertTime.js";
import { useDispatch, useSelector } from "react-redux";
import {
  setEmptyMessage,
  userSelector,
} from "../../../features/users/userSlice";
import createToast from "../../../utils/createToast";
import { getPaginatedUser } from "../../../features/users/userApiSlice";
import { authSelector } from "../../../features/auth/authSlice";
import API from "../../../utils/api";
import Title from "../../../components/Title/Title.jsx";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Image as ImageIcon,
  CheckCircle,
  MoreVertical,
  CircleOff,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  View,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import "./Users.css";
import { set } from "mongoose";
import { useDebounce } from "../../../hooks/debounce.jsx";

const Users = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(authSelector);
  const { loader, error, message } = useSelector(userSelector);

  // various state

  const [data, setData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // State to store the selected user
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control the visibility of the modal
  const [totalPage, setTotalPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // const [selectedPage, setSelectedPage] = useState(1);
  const selectedPage = useRef(1);

  // for table

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms
  const [sortConfig, setSortConfig] = useState({
    key: "index",
    direction: "descending",
  });

  const [actionMenuId, setActionMenuId] = useState(null);
  const [actionRoleMenuId, setActionRoleMenuId] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);

  const userRolesArray = [
    "SOC Manager",
    "CISO",
    "INFRA DB Admin",
    "INFRA App Admin",
    "INFRA System Admin",
    "INFRA Network Admin",
    "ITSM Admin",
    "BSIT Admin",
    "CARD Admin",
    "Admin",
    "Level_1",
    "Level_2",
  ];

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

  useEffect(() => {
    // const fetchData = async () => {
    //   try {
    //     // dispatch(getAllUser());
    //     const response = await API.get(
    //       `/api/v1/user/paginatedUser?${selectedPage}page=1&limit=10`
    //     );

    //     const users = response.data?.user || [];
    //     setTotalPage(users.totalPages || 1);

    //     const sortedData = [...users.paginatedUser].reverse();
    //     {
    //       user.role === "Admin" ||
    //       user.role === "SOC Manager" ||
    //       user.role === "CISO"
    //         ? setData(sortedData)
    //         : setData(sortedData.filter((data) => data.branch === user.branch));
    //     }
    //   } catch (error) {
    //     console.error("Error fetching data:", error);
    //   }
    // };

    // fetchData();
    selectedPage.current = 1;
    getPaginatedUser();
  }, [dispatch, selectedPage, limit, debouncedSearchTerm]);

  const closeModal = () => {
    // Close the modal
    setIsModalOpen(false);
  };

  // --- Helper Constants ---
  const SEVERITY_COLORS = {
    Admin: "#ef4444",
    Level_2: "#f97316",
    Level_1: "#eab308",
    Low: "#22c55e",
  };
  const STATUS_COLORS = {
    Blocked: "bg-red-500/20 text-red-400",
    "In Progress": "bg-amber-500/20 text-amber-400",
    Active: "bg-green-500/20 text-green-400",
    "Risk Accepted": "bg-sky-500/20 text-sky-400",
  };

  // table Headers

  const tableHeaders = [
    "View",
    "Name",
    "Index",
    "Division",
    "Email",
    "Role",
    ...(user?.role === "Admin" ? ["Change Role"] : []),
    "Status",
    ...(user?.role === "Admin" ? ["Actions"] : []),
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
    let sortableData = [...data];

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

  const handleStatusChange = (id, newStatus) => {
    setData(
      data.map((user) =>
        user._id === id ? { ...user, status: newStatus } : user
      )
    );
  };

  const handleRoleChange = (id, newRole) => {
    setData(
      data.map((user) => (user._id === id ? { ...user, role: newRole } : user))
    );
  };

  // handle User Details

  const handleUserDetails = (id) => {
    const findSingleUser =
      Array.isArray(data) && data.find((item) => item._id === id);
    setSelectedUser(findSingleUser);
    setIsModalOpen(true);
  };

  // pagination code
  // const [currentPage, setCurrentPage] = useState(1);
  //  const itemsPerPage = 10;

  // const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const currentItems = data.slice(startIndex, startIndex + itemsPerPage);

  const ActionMenu = ({ user, onStatusChange, onClose }) => {
    const handleAction = async (status) => {
      try {
        const res = await API.put(`/api/v1/user/${user._id}`, { status });
        if (res.data.success === true) {
          createToast("User Status updated!", "success");
          onStatusChange(user._id, status);
          dispatch(getPaginatedUser());
          onClose();
        } else {
          console.log("something went wrong");
        }
      } catch (error) {
        createToast(error.response?.data?.message);
      }
    };

    return (
      <div className="absolute right-4 mt-2 w-40 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
        <div className="flex justify-end items-center mb-0.5 mr-3">
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-white text-3xl cursor-pointer"
          >
            &times;
          </button>
        </div>
        {user.status === "Active" && (
          <>
            <button
              onClick={() => handleAction("Blocked")}
              className="w-full text-left px-2 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center cursor-pointer"
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
          dispatch(getPaginatedUser());
          onClose();
        } else {
          console.log("something went wrong");
        }
      } catch (error) {
        createToast(error.response?.data?.message);
      }
    };

    return (
      <div className="absolute right-4 mt-2 w-40 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
        <div className="flex justify-end items-center mb-0.5 mr-3">
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-white text-3xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        <>
          {
            // [...new Set(sortedData.map((item) => item.role))] // ✅ unique roles
            userRolesArray
              .filter((role) => role !== user.role) // ✅ exclude current user's role
              .map((role, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(role)}
                  className="w-full text-left px-2 py-2 text-sm text-blue-400 hover:bg-gray-600 flex items-center cursor-pointer"
                >
                  <BriefcaseBusiness className="w-4 h-4 mr-2" />

                  {role}
                </button>
              ))
          }
        </>
      </div>
    );
  };

    const handlePageClick = (e) => {
    selectedPage.current = e.selected + 1;
    getPaginatedUser();
  };

  // const changeLimit = (newLimit) => {
  //   const parsedLimit = parseInt(newLimit, 10);
  //   setLimit(parsedLimit);
  // };
  const changeLimit = (newLimit) => {
    const parsedLimit = parseInt(newLimit);
    setLimit(parsedLimit);
    selectedPage.current = 1;
    getPaginatedUser();
  };


  // const getPaginatedUser = async () => {
  //   try {
  //     const response = await API.get(
  //       `/api/v1/user/paginatedUser?page=${selectedPage.current}&limit=${limit}&search=${debouncedSearchTerm}`
  //     );

  //     const users = response.data?.user || [];
  //     setTotalPage(users.totalPages || 1);

  //     if (users.totalUsers === 0) {
  //     setData([]);
  //     createToast("No data found", "error"); // show toast or message
  //     return;
  //   }

  //     const sortedData = [...users.paginatedUser];
  //      if (user.role === "Admin" || user.role === "SOC Manager" || user.role === "CISO") {
  //     setData(sortedData);
  //     setTotalUsers(users.totalUsers);
  //   } else {
  //     setData(sortedData.filter((data) => data.branch === user.branch));
  //     setTotalUsers(users.totalUsers);
  //   }
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };


  

  //  const getPaginatedUser = async () => {
  //   try {
  //     const response = await API.get(
  //       `/api/v1/user/paginatedUser?page=${selectedPage.current}&limit=${limit}&search=${encodeURIComponent(
  //         debouncedSearchTerm
  //       )}`
  //     );

  //     const users = response.data?.user || {
  //       totalUsers: 0,
  //       totalPages: 0,
  //       paginatedUser: [],
  //     };

  //     setTotalPage(users.totalPages || 1);
  //     setTotalUsers(users.totalUsers || 0);

  //     // Defensive client-side branch filter for non-admins
  //     const rows =
  //       ["Admin", "SOC Manager", "CISO"].includes(user.role)
  //         ? users.paginatedUser
  //         : users.paginatedUser.filter((u) => u.branch === user.branch);

  //     setData(rows);

  //     if (!users.totalUsers) {
  //       createToast?.("No data found", "info");
  //     }
  //   } catch (error) {
  //     const msg = error.response?.data?.message || "Error fetching data";
  //     console.error(msg, error);
  //     createToast?.(msg, "error");
  //     setData([]);
  //     setTotalPage(1);
  //     setTotalUsers(0);
  //   }
  // };

  const getPaginatedUser = async () => {
  try {
    const response = await API.get(
      `/api/v1/user/paginatedUser?page=${selectedPage.current}&limit=${limit}&search=${encodeURIComponent(
        debouncedSearchTerm
      )}`
    );

    const users = response.data?.user || {
      totalUsers: 0,
      totalPages: 0,
      paginatedUser: [],
    };

    setTotalPage(users.totalPages || 1);
    setTotalUsers(users.totalUsers || 0);

    // REMOVED: Client-side branch filtering. 
    // The backend now guarantees this data is filtered correctly.
    setData(users.paginatedUser);

    if (!users.totalUsers) {
      createToast?.("No data found", "info");
    }
  } catch (error) {
    const msg = error.response?.data?.message || "Error fetching data";
    createToast?.(msg, "error");
    setData([]);
    setTotalPage(1);
    setTotalUsers(0);
  }
};


  return (
    <>
      <Title title={"TMS | Users"} />
      <div className="bg-gray-900 text-gray-200 min-h-screen font-sans py-13 overflow-y-auto">
        <main className="p-8">
          <section id="vulnerabilities">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                {/* Left side: title + select */}
                <div className="flex items-center space-x-6">
                  <h2 className="text-xl font-bold text-white">Users List</h2>
                  <div>
                    {/* <label
        htmlFor="pageSize"
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        Items per page
      </label> */}
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
                  </div>
                  <p> <span className="text-xs text-cyan-600">Showing page {selectedPage.current} of {totalPage}</span> &nbsp; <span className="font-bold text-sm text-amber-600">Users</span> &nbsp;: <span className="text-sm text-cyan-400">{totalUsers} Members</span> </p>
                </div>

                {/* Right side: search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by name, index, role or ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

          


              <div className="bg-gray-800">
                <div className="w-ful">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-700">
                      <tr>
                        {/* <th className="p-2 text-sm font-semibold text-gray-400">
                          SI
                        </th> */}
                        {tableHeaders.map((header) => {
                          const key = {
                            View: null,
                            Name: "name",
                            Index: "index",
                            Division: "branch",
                            Email: "email",
                            Role: "role",
                            "Change Role": null,
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
                      {data.length === 0 ? (<tr><td colSpan={tableHeaders.length} className="p-2 text-gray-500 text-center">No users found</td></tr>) : (data.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors "
                        >
                          {/* <td className="p-2 text-gray-300">
                            { index + 1}
                          </td> */}
                          <td
                            className="p-2 text-cyan-300 cursor-pointer"
                            onClick={() => handleUserDetails(item._id)}
                          >
                            <View className="w-4 h-4 mr-2" />
                          </td>
                          <td className="p-2 font-medium text-sm text-white">
                            {item.name}
                          </td>
                          <td className="p-2 text-gray-300 text-sm">
                            {item.index}
                          </td>
                          <td className="p-2 text-gray-300 text-sm">
                            {item.branch}
                          </td>
                          <td className="p-2 text-gray-300 text-sm">
                            {item.email}
                          </td>
                          <td className="p-2">
                            <span
                              className="font-bold text-sm"
                              style={{
                                color: SEVERITY_COLORS[item.role],
                              }}
                            >
                              {item.role}
                            </span>
                          </td>

                          {(user.role === "Admin" ||
                            user.role === "SOC Manager" ||
                            user.role === "CISO") && (
                            <td className="p-2 relative">
                              <button
                                onClick={() =>
                                  setActionRoleMenuId(
                                    actionRoleMenuId === item._id
                                      ? null
                                      : item._id
                                  )
                                }
                                className="p-1 rounded-full hover:bg-gray-600"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {actionRoleMenuId === item._id && (
                                <ActionRoleMenu
                                  user={item}
                                  onRoleChange={handleRoleChange}
                                  onClose={() => setActionRoleMenuId(null)}
                                />
                              )}
                            </td>
                          )}

                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                STATUS_COLORS[item.status]
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          {(user.role === "Admin" ||
                            user.role === "SOC Manager" ||
                            user.role === "CISO") && (
                            <td className="p-2 relative">
                              <button
                                onClick={() =>
                                  setActionMenuId(
                                    actionMenuId === item._id ? null : item._id
                                  )
                                }
                                className="p-1 rounded-full hover:bg-gray-600"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {actionMenuId === item._id && (
                                <ActionMenu
                                  user={item}
                                  onStatusChange={handleStatusChange}
                                  onClose={() => setActionMenuId(null)}
                                />
                              )}
                            </td>
                          )}
                        </tr>
                      )))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-4 text-gray-300">
                    {/* <p className="text-sm">
                      Showing {startIndex + 1}–
                      {Math.min(startIndex + itemsPerPage, sortedData.length)}{" "}
                      of {sortedData.length}
                    </p> */}

                    {/* <div className="flex items-center space-x-4">
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
                    </div> */}
                  </div>

                  {/* react paginate */}
                  <ReactPaginate
  previousLabel="Prev"
  nextLabel="Next"
  breakLabel="..."
  pageCount={totalPage}
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

      {/* view user information */}

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-50
          transition-opacity duration-500 ease-out
          ${isModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className={`bg-gray-800 w-full max-w-3xl rounded-lg shadow-lg transform
            transition-all duration-500 ease-out
            ${isModalOpen ? "scale-100 opacity-100" : "scale-100 opacity-0"}`}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center align-middle px-6 py-1 border-b border-gray-700">
            <h6 className="text-white text-lg font-semibold mb-0">
              View User Details
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
            <form className="space-y-4">
              {/* Row 1: Alert Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Time */}
                <div className="flex flex-col">
                  <label className="text-gray-400 font-medium">User Name</label>
                  <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-sky-400">
                    {selectedUser && selectedUser.name}
                  </p>
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-medium">Email</label>
                  <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-sky-400">
                    {selectedUser && selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-400 font-medium">
                  User Division
                </label>
                <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-sky-400">
                  {selectedUser && selectedUser.branch}
                </p>
              </div>

              {/* Row 2: Event Time, Alert Source, Severity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Time */}
                <div className="flex flex-col">
                  <label className="text-gray-400 font-medium">Index</label>
                  <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-sky-400">
                    {selectedUser && selectedUser.index}
                  </p>
                </div>

                {/* Alert Source */}
                <div className="flex flex-col">
                  <label className="text-gray-400 font-medium">Role</label>
                  <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-sky-400">
                    {selectedUser && selectedUser.role}
                  </p>
                </div>

                {/* Severity */}
                <div className="flex flex-col">
                  <label className="text-gray-400 font-medium mb-1">
                    Status
                  </label>
                  {selectedUser && selectedUser.status === "Active" ? (
                    <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-green-400">
                      {selectedUser.status}
                    </p>
                  ) : (
                    <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-red-400">
                      {selectedUser && selectedUser.status}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Affected User Device, Affected IP/Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Affected User Device */}
                <div className="flex flex-col">
                  <label className="text-gray-400 font-medium">
                    User Created Time
                  </label>
                  <p className="m-0 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-sky-400">
                    {selectedUser &&
                      formatDateTimeReadable(selectedUser.createdAt)}
                  </p>
                </div>

                {/* Affected IP/Website */}
                <div className="flex flex-col">
                  <label className="text-gray-400 font-medium">
                    User Updated Time
                  </label>
                  <p className="mb-4 w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-cyan-400 dark:text-sky-400">
                    {selectedUser &&
                      formatDateTimeReadable(selectedUser.updatedAt)}
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Users;
