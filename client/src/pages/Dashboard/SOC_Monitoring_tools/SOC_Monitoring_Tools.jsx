import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import Title from "../../../components/Title/Title";

import { Link } from "react-router-dom";

import React, { useState } from "react";

import Select from "react-select";
import { useEffect } from "react";
import API from "../../../utils/api";
import { useDispatch, useSelector } from "react-redux";
import { monitoringToolsAvailability } from "../../../features/incoming/monitoringToolsApiSlice";
import createToast from "../../../utils/createToast";
import toolsArray from "./ToolsArray";
import { authSelector } from "../../../features/auth/authSlice";

const SOC_Monitoring_Tools = () => {
  const { user, loader, error, message } = useSelector(authSelector);
  const dispatch = useDispatch();
  // selected tools state
  const [selectedTools, setSelectedTools] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedUserRole, setSelectedUserRole] = useState([]);

  const handleSelectChange2 = (index, selectedOptions) => {
    setRowInputs((prev) => {
      const updated = [...prev];
      updated[index].forwardTo = selectedOptions;
      if (name === "loginStatus" && value === "failed") {
        updated[index].operationalStatus = "offline";
      }
      return updated;
    });
  };

  const [input, setInput] = useState({
    loginStatus: "",
    operationalStatus: "",
    forwardTo: "",
    needToDo: {},
  });

  const [rowInputs, setRowInputs] = useState(
    toolsArray.map(() => ({
      loginStatus: "select",
      operationalStatus: "select",
      forwardTo: [],
      needToDo: {}, // { userValue: "text" }
    }))
  );
  const handleSelectChange = (index, e) => {
    const { name, value } = e.target;
    setRowInputs((prev) => {
      const updated = [...prev];
      updated[index][name] = value;
      if (name === "loginStatus" && value === "failed") {
        updated[index].operationalStatus = "offline";
      }

      if (name === "loginStatus" && value === "successful") {
        updated[index].operationalStatus = "operational";
      }
      if (name === "loginStatus" && value === "select") {
        updated[index].operationalStatus = "select";
      }

      return updated;
    });
  };

  const fetchAllusers = async () => {
    try {
      const response = await API.get("/api/v1/user/getAllUsersNoPagination");

      const rolesList = response.data.roles;

      const options = rolesList.map((role) => ({
        value: role,
        label: role,
      }));

      setOptions(options);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };
  // const fetchAllusers = async () => {
  //   try {
  //     const response = await API.get("/api/v1/user/paginatedUser");
  //     const allUsers = response.data.user.filter(
  //       (data) =>
  //         data.branch !==
  //         "99341-Information Security, IT Risk Management & Fraud Control Division"
  //     );

  //     const uniqueRoles = [...new Set(allUsers.map((user) => user.role))];

  //     const options = uniqueRoles.map((role) => ({
  //       value: role,
  //       label: role,
  //     }));

  //     setOptions(options);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };

  useEffect(() => {
    fetchAllusers();
  }, [user, dispatch]);

  const handleNeedToDoChange = (rowIndex, userValue, value) => {
    setRowInputs((prev) => {
      const updated = [...prev];
      if (!updated[rowIndex].needToDo) updated[rowIndex].needToDo = {};
      updated[rowIndex].needToDo[userValue] = value;
      return updated;
    });
  };

  const handleUpdate = async (e, tool, rowInputs) => {
    e.preventDefault();

    if (
      !rowInputs.loginStatus ||
      rowInputs.loginStatus === "select" ||
      (rowInputs.loginStatus === "failed" && rowInputs.forwardTo.length <= 0) ||
      (rowInputs.loginStatus === "failed" &&
        rowInputs.forwardTo.length > 0 &&
        (!rowInputs.needToDo ||
          Object.keys(rowInputs.needToDo).length === 0)) ||
      (rowInputs.loginStatus === "successful" &&
        rowInputs.operationalStatus === "select")
    ) {
      createToast("Fields are required");
      return;
    }
    const formData = {
      sessionUserId: user?._id,
      sessionUserName: user?.name,
      loginStatus: rowInputs.loginStatus,
      operationalStatus: rowInputs.operationalStatus,
      tools: tool.toolsName,
      forwardTo: rowInputs.forwardTo
        ? rowInputs.forwardTo.map((item) => item.value)
        : [],
      needToDo: rowInputs.needToDo,
    };

    try {
      const result = await dispatch(monitoringToolsAvailability(formData));

      if (result.payload.success) {
        createToast("Data Saved Successfully", "success");
        setInput({
          loginStatus: "",
          operationalStatus: "",
          forwardTo: "",
          needToDo: {},
        });
        setSelectedTools([]);
        setSelectedUserRole([]);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
      <Title title={"SEM | SOC Monitoring Tools"} />

      <div className="min-h-screen bg-gray-900 text-gray-100 p-8 py-20">
        <div className="flex items-center justify-between"></div>
        <Breadcrumb />

        {/* Main Content */}
        <div className=" bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="overflow-x-auto">
              <h2 className="text-xl font-semibold text-cyan-400 mb-3">
                SOC Monitoring Tools
              </h2>
              <table className="min-w-full text-sm border border-gray-700 rounded-lg">
                <thead className="bg-gray-700 text-gray-200 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Tools Name</th>
                    <th className="px-3 py-2 text-left">Login Status</th>
                    <th className="px-3 py-2 text-left">Operational Status</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {Array.isArray(toolsArray) &&
                    toolsArray.map((tool, index) => (
                      <React.Fragment key={tool.toolsName}>
                        {/* Row */}
                        <tr className="border-t border-gray-700 hover:bg-gray-750 transition">
                          <td className="px-3 py-2">{index + 1}</td>

                          {/* Tools Name */}
                          <td className="px-3 py-2 text-cyan-300 hover:underline">
                            <Link to={tool.link} target="_blank">
                              {tool.toolsName}
                            </Link>
                          </td>

                          {/* Login Status */}
                          <td className="px-3 py-2">
                            <select
                              name="loginStatus"
                              value={rowInputs[index]?.loginStatus}
                              onChange={(e) => handleSelectChange(index, e)}
                              className="w-full bg-gray-800 border border-gray-600 rounded-md text-gray-200 px-2 py-1 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            >
                              <option value="select">-Select-</option>
                              <option value="successful">Successful</option>
                              <option value="failed">Failed</option>
                            </select>
                          </td>

                          {/* Operational Status */}
                          <td className="px-3 py-2">
                            <select
                              name="operationalStatus"
                              value={rowInputs[index]?.operationalStatus}
                              onChange={(e) => handleSelectChange(index, e)}
                              className="w-full bg-gray-800 border border-gray-600 rounded-md text-gray-200 px-2 py-1 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            >
                              <option value="select">-Select-</option>

                              {rowInputs[index]?.loginStatus === "failed" ? (
                                <>
                                  <option value="degraded">Degraded</option>
                                  <option value="offline">Offline</option>
                                  <option value="specialIssue">
                                    Special Issue
                                  </option>
                                </>
                              ) : (
                                <>
                                  <option value="operational">
                                    Operational
                                  </option>
                                  <option value="degraded">Degraded</option>
                                  <option value="offline">Offline</option>
                                  <option value="specialIssue">
                                    Special Issue
                                  </option>
                                </>
                              )}
                            </select>
                          </td>

                          {/* Action */}
                          <td className="px-3 py-2 text-center">
                            <button
                              disabled={user?.role === "Auditor"}
                              onClick={(e) =>
                                handleUpdate(e, tool, rowInputs[index])
                              }
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-md transition cursor-pointer"
                            >
                              Update
                            </button>
                          </td>
                        </tr>

                        {/* Collapse Row */}
                        {rowInputs[index] && (
                          <tr>
                            <td colSpan={5} className="p-0 border-none">
                              <div
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                  rowInputs[index]?.loginStatus === "failed" ||
                                  rowInputs[index]?.operationalStatus ===
                                    "degraded" ||
                                  rowInputs[index]?.operationalStatus ===
                                    "offline" ||
                                  rowInputs[index]?.operationalStatus ===
                                    "specialIssue"
                                    ? "max-h-[1000px] opacity-100"
                                    : "max-h-0 opacity-0"
                                }`}
                              >
                                <div className="bg-gray-900 p-4 border-t border-gray-700 rounded-b-md">
                                  <label className="block text-sm text-gray-300 mb-2">
                                    Forward To
                                  </label>

                                  <Select
                                    options={options}
                                    isMulti
                                    isClearable
                                    value={rowInputs[index]?.forwardTo || []}
                                    onChange={(selectedOptions) =>
                                      handleSelectChange2(
                                        index,
                                        selectedOptions
                                      )
                                    }
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // Tailwind gray-800
                                        borderColor: "#374151", // Tailwind gray-700
                                        padding: "2px",
                                      }),
                                      menu: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // Set dropdown background
                                        color: "#e5e7eb", // Tailwind gray-200 for text
                                      }),
                                      menuList: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // dropdown scrollable area
                                        maxHeight: "200px",
                                      }),
                                      option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused
                                          ? "#374151" // Tailwind gray-700 when hovered
                                          : "#1f2937", // Default bg
                                        color: state.isSelected
                                          ? "#22d3ee"
                                          : "#e5e7eb", // Selected text color cyan-400
                                      }),
                                      menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                      }),
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                  />

                                  {/* Need to Do Section */}
                                  <div className="mt-3">
                                    {Array.isArray(
                                      rowInputs[index]?.forwardTo
                                    ) &&
                                      rowInputs[index].forwardTo.map((item) => (
                                        <div key={item.value} className="mb-4">
                                          <label className="block text-red-400 text-sm font-medium mb-1">
                                            {`${item.value}: Actions Need to Perform`}
                                          </label>
                                          <textarea
                                            rows={8}
                                            value={
                                              rowInputs[index]?.needToDo?.[
                                                item.value
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              handleNeedToDoChange(
                                                index,
                                                item.value,
                                                e.target.value
                                              )
                                            }
                                            placeholder="Write Down What Should Need to Do"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200 text-sm resize-none focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                          />
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SOC_Monitoring_Tools;
