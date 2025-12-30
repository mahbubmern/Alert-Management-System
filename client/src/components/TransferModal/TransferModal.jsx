import { useEffect, useState } from "react";
import API from "../../utils/api";
import createToast from "../../utils/createToast";

const TransferModal = ({
  transferModalOpen,
  onClose,
  alertId,
  lastPathPart,
}) => {
  const [userInfo, setUserInfo] = useState([]);

  // const assignedUsers =
  //   alertId?.assignedTo?.find((item) => item._id !== alertId.acceptedBy) || [];

  const hasLevel_2_user = alertId?.assignedTo?.some(
    (item) => item.role === "Level_2"
  );

  const filteredUserIDArray = alertId?.assignedTo?.filter(
    (u) =>
      u.branch !==
      "99341-Information Security, IT Risk Management & Fraud Control Division"
  );
  const filteredUsersID = filteredUserIDArray?.map((u) => u._id);

  const filteredRoles =
    alertId?.assignedTo
      ?.filter(
        (u) =>
          u.branch !==
          "99341-Information Security, IT Risk Management & Fraud Control Division"
      )
      ?.map((u) => u.role) || [];

  const matchFields =
    alertId?.fieldsToFill
      ?.filter(
        (u) =>
          filteredRoles.includes(u.role) &&
          u.isPerformed === "notPerformed" &&
          u.comments === ""
      )
      .map((item) => item.role) || [];

  const fetchTargetUser = async () => {
    try {
      const targetBranch =
        "99341-Information Security, IT Risk Management & Fraud Control Division";
      let params = {};

      // LOGIC 1: Follow Up Alert -> Find Level 1 in Branch
      if (lastPathPart === "follow_up_alert") {
        params = {
          role: "Level_1",
          branch: targetBranch,
        };
      }

      // LOGIC 2: Self Assigned -> Find Level 2 OR Level 1 in Branch
      else if (lastPathPart === "self_assigned") {
        params = {
          role: hasLevel_2_user ? "Level_2" : "Level_1",
          branch: targetBranch,
        };
      }

      // LOGIC 3: Assigned -> Find user matching allowed roles
      else if (lastPathPart === "assigned") {
        // matchFields is assumed to be an array e.g. ["Admin", "Manager"]
        // We join it to a string: "Admin,Manager" for the URL
        if (Array.isArray(matchFields) && matchFields.length > 0) {
          params = { roles: matchFields.join(",") };
        } else {
          return; // No roles to search, abort
        }
      } else {
        return; // No matching path, do nothing
      }

      // CALL THE NEW API
      // URL becomes: /api/v1/user/find-one?role=Level_1&branch=99341...
      const response = await API.get("/api/v1/user/find-one", { params });

      if (response.data.user) {
        setUserInfo(response.data.user);
      } else {
        console.warn("No matching user found for criteria:", params);
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Error fetching target user:", error);
    }
  };

  useEffect(() => {
    if (lastPathPart) {
      fetchTargetUser();
    }
  }, [lastPathPart, hasLevel_2_user, alertId]); // Added dependencies for safety

  const [input, setInput] = useState({
    transferUser: "",
    transferUserRole: "",
  });

  const handleTransferUSer = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  const handleTransferForm = async (e) => {
    e.preventDefault();

    // if (input.transferUser === "Choose" || !input.transferUser?.trim()) {
    //   createToast("Please Select User");
    //   return;
    // }

    const data = {
      transferUserId: userInfo?._id,
      transferUserRole: userInfo?.role,
      alertId: alertId.alertId,
      acceptedBy: alertId?.acceptedBy,
    };

    try {
      const response = await API.patch("/api/v1/alert/userTransfer", data);

      if (response.data.message === "Alert transferred successfully") {
        setInput({
          transferUser: "",
        });
        onClose();
        createToast("Alert transferred successfully", "success");
      }
      if (response.data.message === "User already assigned") {
        createToast("User already assigned");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <>
      {transferModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            // Prevent clicks on backdrop from closing or propagating
            e.stopPropagation();
          }}
        >
          {/* Prevent backdrop click from closing modal */}
          <div
            className="bg-gray-900 text-gray-100 rounded-xl shadow-2xl w-[90%] sm:w-[600px] md:w-[700px] transform transition-all duration-300 scale-100"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()} // stops outside click inside container
            onKeyDown={(e) => {
              // Prevent ESC from closing modal
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-700 px-4 py-2">
              <h2 className="text-lg font-semibold flex items-center gap-3 text-cyan-400">
                <i className="fa fa-exchange" aria-hidden="true"></i> Alert
                Transfer
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-400 transition cursor-pointer"
              >
                <i className="fa fa-times text-lg" aria-hidden="true"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-2">
              <form onSubmit={handleTransferForm} className="space-y-5">
                {/* Label Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-lg font-medium text-green-400">
                    Assigned User :{" "}
                    {`${userInfo?.name} - ${userInfo?.role} - ${userInfo?._id}`}
                    <span className="text-red-500 text-lg align-middle">*</span>
                  </label>
                </div>

                {/* Select + Button Row */}
                <div className="flex flex-col sm:flex-row gap-4 pb-8">
                  {/* <div className="flex-1">
                    <select
                      name="transferUser"
                      value={input.transferUser}
                      onChange={handleTransferUSer}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                      <option className="bg-gray-700" value="Choose">
                        Choose...
                      </option>
                      {Array.isArray(userInfo) &&
                        userInfo.map((user, index) => (
                          <option
                            key={index}
                            value={user._id}
                            className="bg-gray-800 hover:bg-cyan-900"
                          >
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </div> */}

                  <div className="sm:w-1/3"></div>

                  <div className="sm:w-1/3">
                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition cursor-pointer"
                    >
                      Transfer Alert
                    </button>
                  </div>

                  <div className="sm:w-1/3"></div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferModal;
