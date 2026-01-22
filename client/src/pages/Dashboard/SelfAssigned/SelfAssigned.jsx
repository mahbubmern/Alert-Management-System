import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import Title from "../../../components/Title/Title";

//modal credentials

import Swal from "sweetalert2";
import "./SelfAssigned.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../features/auth/authSlice";
import {
  alertSelector,
  setEmptyAlertMessage,
} from "../../../features/incoming/alertSlice";
import {
  getAllAlert,
  updateInvestigationAlert,
  updateLevel2InvestigationAlert,
} from "../../../features/incoming/alertApiSlice.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);

import pdf from "../../../assets/frontend/img/icons8-pdf-40.png";
import createToast from "../../../utils/createToast.js";

import ChatBox from "../../../components/ChatBox/ChatBox.jsx";
import { io } from "socket.io-client";
import {
  addMessage,
  markUserAsRead,
  messageSelector,
} from "../../../features/incoming/messageSlice.js";
import socket from "../../../helpers/socket.js";
import API from "../../../utils/api.js";
import Select from "react-select";

import {
  ChartSpline,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  Tag,
  Download,
  Printer,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import { motion, AnimatePresence } from "framer-motion";
import AlertReport from "../../../components/AlertReport/AlertReport.jsx";

import { BlobProvider } from "@react-pdf/renderer";
import TransferModal from "../../../components/TransferModal/TransferModal.jsx";
import { useLocation } from "react-router-dom";
import AlertStepper from "../../../components/Stepper/Stepper.jsx";
import { useDebounce } from "../../../hooks/debounce.jsx";

const SelfAssigned = () => {
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

  const [tpEvidenceFiles, setTpEvidenceFiles] = useState([]);
  const [openAlertDetails, setOpenAlertDetails] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [options, setOptions] = useState([]);

  const dispatch = useDispatch();
  const { alertError, alertMessage, alert, alertLoader } =
    useSelector(alertSelector);
  const { user, loader, error, message } = useSelector(authSelector);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [showPdf, setShowPdf] = useState(false);
  const [alertId, setAlertId] = useState("");
  const [alertView, setAlertView] = useState([]);

  // transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAlertId, setTransferAlertId] = useState({
    alertId: "",
    acceptedBy: "",
    assignedTo: [],
  });

  // Pagination State
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const selectedPage = useRef(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // wait 300ms

  // selectedUser

  const [selectedUserRole, setSelectedUserRole] = useState([]);

  // chat

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const socketRef = useRef(null);

  // const fetchAllusers = async () => {
  //   try {
  //     const response = await API.get("/api/v1/user");
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

  // useEffect(() => {
  //   fetchAllusers();
  // }, []);

  const fetchRoles = async () => {
    try {
      // 1. Call the new lightweight endpoint
      const response = await API.get("/api/v1/user/roles");

      // 2. The backend already did the filtering and unique logic
      const uniqueRoles = response.data.roles || [];

      // 3. Map to React-Select format
      const options = uniqueRoles.map((role) => ({
        value: role,
        label: role,
      }));

      setOptions(options);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };
  useEffect(() => {
    fetchRoles();
  }, []);

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
    L2verdict: "false_positive",
    acceptedTime: "",
    file: null,
    tpImpact: "",
    escalation: "no",
    forwardTo: "",
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
    // l2RemediationExecutionLog: "",
    l2RemediationValidation: "",
    // l2RemediationActionDoc: "",
    l2ResolutionTimestamp: "",
    needToDo: {}, // 👈 store as object { roleValue: note }
    incidentDeclarationReason: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  const handleEditDateChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));

    setInput((prevInput) => ({
      ...prevInput,
      fpNote: "",
    }));
  };

  // note input changes
  const handleFpNoteChange = (e) => {
    const value = e.target.value;
    setInput((prev) => ({
      ...prev,
      fpNote: value,
    }));
  };

  const handleNeedToDoChange = (roleValue, newValue) => {
    setInput((prev) => {
      const updatedNeedToDo = { ...prev.needToDo };

      if (newValue.trim() === "") {
        delete updatedNeedToDo[roleValue];
      } else {
        updatedNeedToDo[roleValue] = newValue;
      }

      return {
        ...prev,
        needToDo: updatedNeedToDo,
      };
    });
  };

  const handletpRemedationNoteChange = (e) => {
    const value = e.target.value;
    setInput((prev) => ({
      ...prev,
      tpRemedationNote: value,
    }));
  };
  // word count function

  const wordCount = input.fpNote
    ? input.fpNote.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const isFpValid = wordCount >= 50;

  // handle level 2 investigation Submit

  const handle_Lavel_2_InvestigationSubmit = async (e) => {
    e.preventDefault();

    const {
      investigationFindings,
      investigationToolsUsed,
      incidentDeclarationRequired,
      incidentDeclarationReason,
      _id,
      handBackToL1Assignee,
      handBackNoteToL1,
      isIncidence,
      irp,
      rootCause,
      l2RemediationPlan,
      l2RemediationExecutionLog,
      l2RemediationValidation,
      l2RemediationActionDoc,
      l2ResolutionTimestamp,
      L2verdict,
      forwardTo,
      needToDo,
    } = input;

    if (
      !investigationFindings?.trim() ||
      !investigationToolsUsed?.trim() ||
      !L2verdict?.trim()
    ) {
      createToast("All fields are required", "error");
      return;
    }

    // prepare data
    const data = {
      investigationFindings,
      investigationToolsUsed,
      L2verdict,
    };

    if (L2verdict === "false_positive") {
      if ((forwardTo?.length || 0) === 0) {
        // forwardTo নেই → handBackNoteToL1 mandatory
        if (!handBackNoteToL1?.trim()) {
          createToast("Hand Back Note must be filled Up", "error");
          return;
        }
        data.handBackNoteToL1 = handBackNoteToL1;
      } else {
        // forwardTo আছে → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          createToast("Please select the user and create Note", "error");
          return;
        }
        data.forwardTo = forwardTo;
        data.needToDo = needToDo;
      }
    }

    if (
      (L2verdict === "true_positive" &&
        incidentDeclarationRequired === "Choose") ||
      (L2verdict === "true_positive" && !incidentDeclarationRequired?.trim())
    ) {
      createToast("Incident Declarion Field must be filled up", "error");
      return;
    }

    if (
      L2verdict === "true_positive" &&
      incidentDeclarationRequired === "no" &&
      isIncidence === "pending"
    ) {
      // L2 Remediation Plan mandatory
      if (!l2RemediationPlan?.trim()) {
        createToast("You must provide L2 Remediation Plan", "error");
        return;
      }

      if ((forwardTo?.length || 0) === 0) {
        // forwardTo নেই → handBackNoteToL1 mandatory
        if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
          createToast("All fields are required", "error");
          return;
        }

        data.l2RemediationPlan = l2RemediationPlan;
        data.l2RemediationValidation = l2RemediationValidation;
        data.handBackNoteToL1 = handBackNoteToL1;
      } else {
        // forwardTo আছে → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          createToast("Please select the user and create Note", "error");
          return;
        }

        data.l2RemediationPlan = l2RemediationPlan;
        data.forwardTo = forwardTo;
        data.needToDo = needToDo;
      }

      // Common fields
      data.incidentDeclarationRequired = incidentDeclarationRequired;
      data.isIncidence = isIncidence;
      data.L2verdict = L2verdict;
    }

    // if (L2verdict === "true_positive" && incidentDeclarationRequired === "no" && isIncidence === "pending"  ) {

    //   console.log(L2verdict,incidentDeclarationRequired,isIncidence,l2RemediationPlan, l2RemediationValidation,handBackNoteToL1, forwardTo);

    // }

    // if (L2verdict === "true_positive" && incidentDeclarationRequired === "no" && isIncidence === "pending" &&  l2RemediationPlan?.trim() && !handBackNoteToL1?.trim() && !l2RemediationValidation?.trim()   ) {

    //   if (

    //     (forwardTo?.length > 0 && Object.keys(needToDo).length === 0) ||
    //     (forwardTo?.length > 0 &&
    //       forwardTo?.length !== Object.keys(needToDo).length) ||
    //     // !handBackNoteToL1?.trim() ||
    //     !l2RemediationPlan?.trim()
    //     // !l2RemediationValidation?.trim()
    //   ) {
    //     createToast("All fields are required", "error");
    //     return;
    //   }
    //   data.incidentDeclarationRequired = incidentDeclarationRequired;
    //   data.forwardTo = forwardTo;
    //   data.needToDo = needToDo;
    //   data.l2RemediationPlan = l2RemediationPlan;
    //   data.isIncidence = isIncidence;
    // }

    if (
      L2verdict === "true_positive" &&
      incidentDeclarationRequired === "yes" &&
      isIncidence == "pending"
    ) {
      if ((forwardTo?.length || 0) === 0) {
        // forwardTo none → Incident Declaration Reason mandatory
        if (!incidentDeclarationReason?.trim()) {
          createToast("Incident Declaration Reason Must be filledUp", "error");

          return;
        }

        data.incidentDeclarationReason = incidentDeclarationReason;
      } else {
        // forwardTo value having → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          createToast("Please select the user and create Note", "error");
          return;
        }

        data.incidentDeclarationReason = incidentDeclarationReason;
        data.forwardTo = forwardTo;
        data.needToDo = needToDo;
      }

      // Common fields
      data.incidentDeclarationRequired = incidentDeclarationRequired;
      data.isIncidence = isIncidence;
      data.L2verdict = L2verdict;
    }

    //     if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired === "yes" &&
    //   isIncidence === "yes"
    // ) {
    //   const safeForwardTo = Array.isArray(forwardTo) ? forwardTo : [];
    //   const safeNeedToDo =
    //     needToDo && typeof needToDo === "object" ? needToDo : {};

    //   // Common required fields
    //   if (!irp || !rootCause?.trim() || !l2RemediationPlan?.trim()) {
    //     createToast("All fields are required", "error");
    //     return;
    //   }

    //   if (safeForwardTo.length === 0) {
    //     // Case: forwardTo not selected
    //     if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
    //       createToast(
    //         "Remediation Validation and Hand Back Note must be filled up",
    //         "error"
    //       );
    //       return;
    //     }

    //     data.irp = irp;
    //     data.isIncidence = isIncidence;
    //     data.incidentDeclarationRequired = incidentDeclarationRequired;
    //     data.rootCause = rootCause;
    //     data.l2RemediationPlan = l2RemediationPlan;
    //     data.l2RemediationValidation = l2RemediationValidation;
    //     data.handBackNoteToL1 = handBackNoteToL1;
    //   } else {
    //     // Case: forwardTo selected
    //     if (
    //       Object.keys(safeNeedToDo).length === 0 ||
    //       safeForwardTo.length !== Object.keys(safeNeedToDo).length
    //     ) {
    //       createToast("Need To Do fields are required", "error");
    //       return;
    //     }

    //     data.irp = irp;
    //     data.isIncidence = isIncidence;
    //     data.incidentDeclarationRequired = incidentDeclarationRequired;
    //     data.rootCause = rootCause;
    //     data.l2RemediationPlan = l2RemediationPlan;
    //     data.forwardTo = safeForwardTo;
    //     data.needToDo = safeNeedToDo;
    //   }
    // }

    if (
      L2verdict === "true_positive" &&
      incidentDeclarationRequired === "yes" &&
      isIncidence === "yes"
    ) {
      // 🔎 Mandatory field checks
      const mandatoryChecks = [
        { field: irp, message: "IRP must be filled up" },
        { field: rootCause, message: "Root Cause Analysis must be filled up" },
        {
          field: l2RemediationPlan,
          message: "L2 Remediation Plan must be filled up",
        },
      ];

      for (const { field, message } of mandatoryChecks) {
        if (!field?.trim() || field === "Choose") {
          createToast(message, "error");
          return;
        }
      }

      if ((forwardTo?.length || 0) === 0) {
        // 📝 forwardTo empty → l2RemediationValidation + handBackNoteToL1 mandatory
        if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
          createToast(
            "L2 Remediation Validation & Hand Back Note must be filled up",
            "error",
          );
          return;
        }

        Object.assign(data, {
          irp,
          rootCause,
          l2RemediationPlan,
          l2RemediationValidation,
          handBackNoteToL1,
        });
      } else {
        // 📝 forwardTo has value → needToDo mandatory
        const needToDoInvalid =
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length;

        if (needToDoInvalid) {
          createToast("Please select the user and create Note", "error");
          return;
        }

        Object.assign(data, {
          irp,
          rootCause,
          l2RemediationPlan,
          forwardTo,
          needToDo,
        });
      }

      // ✅ Common fields
      Object.assign(data, {
        incidentDeclarationRequired,
        isIncidence,
        L2verdict,
      });
    }

    // code started to rewrite here dated on 9/12/2025

    // if ( L2verdict === "true_positive" &&
    //   incidentDeclarationRequired === "yes" &&
    //   isIncidence === "yes" && alertView?.fieldsToFill?.length > 0) {

    //     if (!l2RemediationValidation?.trim() ||
    //          !handBackNoteToL1?.trim()) {
    //        createToast("L2 RemediationValidation & Hand Back Note Must be filled up", "error");
    //         return;
    //     }

    //      data.l2RemediationValidation = l2RemediationValidation;
    //      data.handBackNoteToL1 = handBackNoteToL1;
    //      data.fieldsToFill = alertView?.fieldsToFill;

    // }

    if (
      L2verdict === "true_positive" &&
      incidentDeclarationRequired === "yes" &&
      isIncidence === "no"
    ) {
      // ✅ L2 Remediation Plan mandatory
      if (!l2RemediationPlan?.trim()) {
        createToast("L2 Remediation Plan must be filled up", "error");
        return;
      }

      if ((forwardTo?.length || 0) === 0) {
        // forwardTo নেই → l2RemediationValidation + handBackNoteToL1 mandatory
        if (!l2RemediationValidation?.trim() || !handBackNoteToL1?.trim()) {
          createToast("All fields are required", "error");
          return;
        }

        data.l2RemediationPlan = l2RemediationPlan;
        data.l2RemediationValidation = l2RemediationValidation;
        data.handBackNoteToL1 = handBackNoteToL1;
      } else {
        // forwardTo আছে → needToDo mandatory
        if (
          !needToDo ||
          Object.keys(needToDo).length === 0 ||
          forwardTo.length !== Object.keys(needToDo).length
        ) {
          createToast("Please select the user and create Note", "error");
          return;
        }

        data.l2RemediationPlan = l2RemediationPlan;
        data.forwardTo = forwardTo;
        data.needToDo = needToDo;
      }

      // ✅ Common fields
      data.incidentDeclarationRequired = incidentDeclarationRequired;
      data.isIncidence = isIncidence;
      data.L2verdict = L2verdict;
    }

    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired == "no" &&
    //   isIncidence == "no" &&  handBackNoteToL1?.trim() && l2RemediationValidation?.trim()
    // ) {
    //   // const safeForwardTo = Array.isArray(forwardTo) ? forwardTo : [];
    //   // const safeNeedToDo =
    //   //   needToDo && typeof needToDo === "object" ? needToDo : {};
    //   if (
    //     !l2RemediationPlan?.trim()
    //     // !l2RemediationValidation?.trim() ||
    //     // !handBackNoteToL1?.trim() ||
    //     // safeForwardTo.length === 0 ||
    //     // (safeForwardTo.length > 0 && Object.keys(safeNeedToDo).length === 0) ||
    //     // (safeForwardTo.length > 0 &&
    //     //   safeForwardTo.length !== Object.keys(safeNeedToDo).length)
    //   ) {
    //     createToast("All fields are required", "error");
    //     return;
    //   }

    //   data.L2verdict = L2verdict;
    //   data.isIncidence = isIncidence;
    //   data.incidentDeclarationRequired = incidentDeclarationRequired;
    //   // data.l2RemediationPlan = l2RemediationPlan;
    //   data.l2RemediationValidation = l2RemediationValidation;
    //   data.handBackNoteToL1 = handBackNoteToL1;
    //   // data.forwardTo = safeForwardTo;
    //   // data.needToDo = safeNeedToDo;
    // }

    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired == "no" &&
    //   isIncidence == "no" &&
    //   !l2RemediationValidation?.trim() &&
    //   !handBackNoteToL1?.trim()
    // ) {
    //   const safeForwardTo = Array.isArray(forwardTo) ? forwardTo : [];
    //   const safeNeedToDo =
    //     needToDo && typeof needToDo === "object" ? needToDo : {};
    //   if (
    //     !l2RemediationPlan?.trim() ||
    //     // !l2RemediationValidation?.trim() ||
    //     // !handBackNoteToL1?.trim() ||
    //     safeForwardTo.length === 0 ||
    //     (safeForwardTo.length > 0 && Object.keys(safeNeedToDo).length === 0) ||
    //     (safeForwardTo.length > 0 &&
    //       safeForwardTo.length !== Object.keys(safeNeedToDo).length)
    //   ) {
    //     createToast("All fields are required", "error");
    //     return;
    //   }

    //   data.L2verdict = L2verdict;
    //   data.isIncidence = isIncidence;
    //   data.incidentDeclarationRequired = incidentDeclarationRequired;
    //   data.l2RemediationPlan = l2RemediationPlan;
    //   // data.l2RemediationValidation = l2RemediationValidation;
    //   // data.handBackNoteToL1 = handBackNoteToL1;
    //   data.forwardTo = safeForwardTo;
    //   data.needToDo = safeNeedToDo;
    // }

    // if (
    //   L2verdict === "true_positive" &&
    //   incidentDeclarationRequired == "yes" &&
    //   isIncidence == "no"
    // ) {
    //   createToast(`incident Declaration Required will be "NO"`, "error");
    //   return;
    // }

    try {
      //  // Dispatch update action
      const result = await dispatch(
        updateLevel2InvestigationAlert({ id: _id, data }),
      );

      if (updateLevel2InvestigationAlert.fulfilled.match(result)) {
        // Clear form
        setInput({
          investigationFindings: "",
          investigationToolsUsed: "",
          incidentDeclarationRequired: "",
          handBackNoteToL1: "",
          irp: "",
          rootCause: "",
          l2RemediationPlan: "",
          needToDo: {}, // always object
          forwardTo: [], // always array
          l2RemediationValidation: "",
        });

        // Close modal and refresh alert list
        closeModal();
        await dispatch(getAllAlert());

        createToast("Alert Updated", "success");
      } else {
        console.error("Alert update failed", result.error.message);
        createToast("Failed to update alert", "error");
      }
    } catch (error) {
      console.error(
        "Alert update failed:",
        error.response?.data || error.message,
      );
      createToast("Something went wrong", "error");
    }
  };

  // handle investigation form Submit

  const handleInvestigationSubmit = async (e) => {
    e.preventDefault();

    if (input.verdict === "false_positive") {
      Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "Verdict is still set as False Positive. Do you want to continue?",
        showCancelButton: true,
        confirmButtonText: "Yes, submit",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const formData = new FormData();

          formData.append("_id", input._id);
          formData.append("verdict", input.verdict);
          formData.append("fpNote", input.fpNote);

          if (input.forwardTo) {
            // Handle the "to" field as an array
            input.forwardTo.forEach((item) => {
              formData.append("forwardTo[]", item.value); // Append each "to" value as part of an array
            });
          }

          // Dispatch the Alert update action
          const result = await dispatch(updateInvestigationAlert(formData));

          if (updateInvestigationAlert.fulfilled.match(result)) {
            setInput({
              alertId: "",
              eventTime: "",
              alertName: "",
              alertSource: "",
              severity: "",
              affectedIpWebsite: "",
              affectedUserDevice: "",
              verdict: "",
              fpNote: "",
            });
            closeModal();
            // Optionally re-fetch if needed (or just rely on state.alert)
            await dispatch(getAllAlert());

            createToast("Alert Closed", "success");
          } else {
            console.error("Alert update failed", result.error.message);
          }
        }
      });
    }

    //  IF Verdict is true_positive

    if (input.verdict === "true_positive" && input.escalation == "no") {
      // input.forwardTo?.length === 0 ||
      // (input.forwardTo?.length > 0 &&
      //   Object.keys(input.needToDo).length === 0) ||
      // (input.forwardTo?.length > 0 &&
      //   input.forwardTo?.length !== Object.keys(input.needToDo).length)

      if (
        !input.verdict?.trim() ||
        !input.tpImpact?.trim() ||
        !input.caseDetails?.trim() ||
        !input.tpRemedationNote?.trim() ||
        input.tpImpact === "Choose"
      ) {
        createToast("All fields are required");
        return;
      }

      const safeForwardTo = Array.isArray(input.forwardTo)
        ? input.forwardTo
        : [];
      const safeNeedToDo =
        input.needToDo && typeof input.needToDo === "object"
          ? input.needToDo
          : {};

      if (
        (safeForwardTo.length > 0 && Object.keys(safeNeedToDo).length === 0) ||
        (safeForwardTo.length > 0 &&
          safeForwardTo.length !== Object.keys(safeNeedToDo).length)
      ) {
        createToast("All fields are required");
        return;
      }
      Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "You are attempting to close the alert without escalating it. Do you want to continue?",
        showCancelButton: true,
        confirmButtonText: "Yes, submit",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const formData = new FormData();

          formData.append("_id", input._id);
          formData.append("verdict", input.verdict);
          formData.append("tpImpact", input.tpImpact);
          formData.append("escalation", input.escalation);
          formData.append("caseDetails", input.caseDetails);
          formData.append("tpRemedationNote", input.tpRemedationNote);

          // ✅ ForwardTo handling
          if (Array.isArray(input.forwardTo) && input.forwardTo.length > 0) {
            formData.append("forwardTo", JSON.stringify(input.forwardTo));
            formData.append("needToDo", JSON.stringify(input.needToDo));
          }

          if (tpEvidenceFiles && tpEvidenceFiles?.length > 0) {
            for (let i = 0; i < tpEvidenceFiles?.length; i++) {
              formData.append("files", tpEvidenceFiles[i]);
            }
          }

          // Dispatch the Alert update action
          const result = await dispatch(updateInvestigationAlert(formData));

          if (updateInvestigationAlert.fulfilled.match(result)) {
            setInput({
              alertId: "",
              eventTime: "",
              alertName: "",
              alertSource: "",
              severity: "",
              affectedIpWebsite: "",
              affectedUserDevice: "",
              verdict: "false_positive",
              fpNote: "",
              tpImpact: "",
              escalation: "no",
              caseDetails: "",
              tpRemedationNote: "",
              forwardTo: [],
              needToDo: {},
            });
            closeModal();
            // Optionally re-fetch if needed (or just rely on state.alert)
            await dispatch(getAllAlert());

            createToast("Alert Closed", "success");
          } else {
            console.error("Alert update failed", result.error.message);
          }
        }
      });
    }

    // IF Verdict is true_positive and escalation is yes

    if (input.verdict === "true_positive" && input.escalation == "yes") {
      if (
        !input.verdict?.trim() ||
        !input.tpImpact?.trim() ||
        !input.caseDetails?.trim() ||
        !input.tpRemedationNote?.trim() ||
        input.tpImpact === "Choose" ||
        !input.escalationReason?.trim()
      ) {
        createToast("All fields are required");
        return;
      }

      const safeForwardTo = Array.isArray(input.forwardTo)
        ? input.forwardTo
        : [];
      const safeNeedToDo =
        input.needToDo && typeof input.needToDo === "object"
          ? input.needToDo
          : {};

      if (
        (safeForwardTo.length > 0 && Object.keys(safeNeedToDo).length === 0) ||
        (safeForwardTo.length > 0 &&
          safeForwardTo.length !== Object.keys(safeNeedToDo).length)
      ) {
        createToast("All fields are required");
        return;
      }

      const formData = new FormData();

      formData.append("_id", input._id);
      formData.append("verdict", input.verdict);
      formData.append("tpImpact", input.tpImpact);
      formData.append("escalation", input.escalation);
      formData.append("caseDetails", input.caseDetails);
      formData.append("tpRemedationNote", input.tpRemedationNote);
      formData.append("escalationReason", input.escalationReason);
      formData.append("authorId", input.author._id);
      formData.append("authorName", input.author.name);
      formData.append("authorIndex", input.author.index);
      formData.append("authorRole", input.author.role);

      // ✅ ForwardTo handling
      if (Array.isArray(input.forwardTo) && input.forwardTo.length > 0) {
        formData.append("forwardTo", JSON.stringify(input.forwardTo));
        formData.append("needToDo", JSON.stringify(input.needToDo));
      }

      if (tpEvidenceFiles && tpEvidenceFiles?.length > 0) {
        for (let i = 0; i < tpEvidenceFiles?.length; i++) {
          formData.append("files", tpEvidenceFiles[i]);
        }
      }
      // Dispatch the Alert update action
      const result = await dispatch(updateInvestigationAlert(formData));

      if (updateInvestigationAlert.fulfilled.match(result)) {
        setInput({
          alertId: "",
          eventTime: "",
          alertName: "",
          alertSource: "",
          severity: "",
          affectedIpWebsite: "",
          affectedUserDevice: "",
          verdict: "false_positive",
          fpNote: "",
          tpImpact: "",
          escalation: "no",
          caseDetails: "",
          forwardTo: [],
          needToDo: {},
          tpRemedationNote: "",
          escalationReason: "",
        });
        closeModal();
        // Optionally re-fetch if needed (or just rely on state.alert)
        await dispatch(getAllAlert());

        createToast("Alert Forwarded", "success");
      } else {
        console.error("Alert update failed", result.error.message);
      }
    }
  };

  const fileInputRef = useRef(null);

  const handleMultipleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setTpEvidenceFiles((prevFiles) => [...prevFiles, ...files]); // update the file list
  };

  const handleFileShow = (file) => {
    const fileName = typeof file === "string" ? file : file?.name;
    const hasPdf = fileName?.toLowerCase().endsWith(".pdf");

    if (file.type === "application/pdf") {
      setPdfUrl(URL.createObjectURL(file));
      setShowPdf(true);
      setPageNumber(1); // optional
    } else if (hasPdf) {
      handleFileShowToOtherTab(file);
    } else {
      createToast("Only PDF preview supported");
    }
  };

  const handleFileShowToOtherTab = (file) => {
    const fileName = file && file;
    const baseURL = import.meta.env.VITE_APP_URL;
    const filePath = `${baseURL}/files/${fileName}`;
    window.open(filePath, "_blank");
  };

  const handleClosePdf = () => {
    setShowPdf(false);
    setPdfUrl(null);
  };

  useEffect(() => {
    dispatch(getAllAlert());
  }, [dispatch]);

  // useEffect(() => {
  //   if (!user?._id || !Array.isArray(alert)) return;

  //   const filtered = alert.filter((item) => {
  //     const acceptedBy = item.acceptedBy == user._id && item.status === "open";

  //     const isEscalatedByAuthor =
  //       item.assignedTo?._id === user._id && item.status === "escalated";

  //     const isHandBackToL1 =
  //       item.handBackToL1Assignee === "yes" && item.status !== "closed";

  //     const isAssignedToUser = item.assignedTo?.some(
  //       (assignedUser) => assignedUser._id === user._id
  //     );

  //     const hasInvestigationLevelValues =
  //       item.investigationFindings && item.investigationToolsUsed;
  //     const noOfAssignedUsers =
  //       Array.isArray(item.assignedTo) && item.assignedTo?.length === 2;

  //     const hasInvestigationLevel2Values =
  //       // item.l2RemediationActionDoc &&
  //       item.l2RemediationValidation &&
  //       // item.l2RemediationExecutionLog &&
  //       item.l2RemediationPlan &&
  //       item.rootCause;

  //     if (user.role === "Level_1") {
  //       return acceptedBy;
  //     }

  //     if (user.role === "Level_2") {
  //       const isHandBackNotYes =
  //         item.handBackToL1Assignee !== "yes" ||
  //         item.handBackToL1Assignee === undefined;

  //       return isAssignedToUser && isHandBackNotYes;
  //     }

  //     if (
  //       user.role === "Admin" ||
  //       user.role === "SOC Manager" ||
  //       user.role === "CISO"
  //     ) {
  //       const isEligible =
  //         isEscalatedByAuthor || isHandBackToL1 || isAssignedToUser;
  //       const missingL2Values = !hasInvestigationLevel2Values;
  //       const meetsConditionalPath =
  //         missingL2Values &&
  //         (item.incidentDeclarationRequired === "yes" ||
  //           (item.incidentDeclarationRequired === "no" &&
  //             item.handBackToL1Assignee === "yes"));

  //       return (
  //         acceptedBy ||
  //         (isEligible && item.status === "escalated" && meetsConditionalPath) ||
  //         (noOfAssignedUsers &&
  //           !hasInvestigationLevelValues &&
  //           item.status === "escalated") ||
  //         (item.assignedTo?.length === 1 && item.status === "open")
  //       );
  //     }

  //     return false;
  //   });

  //   setData(filtered);
  // }, [alert, user._id, user.role, dispatch]);

  const handleSelectChange2 = (selectedOptions) => {
    setInput((prevInput) => ({
      ...prevInput,
      forwardTo: selectedOptions, // selectedOptions is an array of selected items
    }));
    setSelectedUserRole(selectedOptions);
  };

  // alert accepted Datatable Initialization

  const enrichedData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      unread: unreadCountMap[row._id]?.includes(user.role) || false,
    }));
  }, [data, unreadCountMap, user]);

  const removeFile = (index) => {
    const files = [...tpEvidenceFiles];
    files.splice(index, 1); // use splice instead of slice
    setTpEvidenceFiles(files);
    handleClosePdf();
  };
  const formatForDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // returns YYYY-MM-DDTHH:MM
  };

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

  const alertFields = [
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
    {
      label: "Incident",
      key: "isIncidence",
    },
  ];

  const filledFields = alertFields.filter(({ key }) => alertView[key]);

  //save data

  const handleSaveData = async () => {
    if (input.verdict === "false_positive") {
      const formData = new FormData();

      formData.append("_id", input._id);
      formData.append("verdict", input.verdict);
      formData.append("fpNote", input.fpNote);

      try {
        const res = await API.patch(
          `/api/v1/alert/alert_save/${input._id}`,
          formData,
        );

        if (res.data.message) {
          closeModal();
          dispatch(getAllAlert());
          createToast("Data saved successfully", "success");
        } else {
          createToast("Failed to save data", "error");
        }
      } catch (error) {
        console.error("Error saving data:", error);
        createToast("Failed to save data", "error");
      }
    }

    // input.verdict === true positive and escalation no
    if (input.verdict === "true_positive" && input.escalation == "no") {
      const formData = new FormData();

      formData.append("_id", input._id);

      if (input.tpRemedationNote?.trim()) {
        formData.append("tpRemedationNote", input.tpRemedationNote.trim());
      }
      if (input.caseDetails?.trim()) {
        formData.append("caseDetails", input.caseDetails.trim());
      }

      if (input.tpImpact) {
        formData.append("tpImpact", input.tpImpact);
      }
      if (input.escalation) {
        formData.append("escalation", input.escalation);
      }
      if (input.verdict) {
        formData.append("verdict", input.verdict);
      }

      if (tpEvidenceFiles && tpEvidenceFiles.length > 0) {
        for (let i = 0; i < tpEvidenceFiles.length; i++) {
          formData.append("files", tpEvidenceFiles[i]);
        }
      }

      try {
        const res = await API.patch(
          `/api/v1/alert/alert_save/${input._id}`,
          formData,
        );

        if (res.data.message) {
          closeModal();
          dispatch(getAllAlert());
          createToast("Data saved successfully", "success");
        } else {
          createToast("Failed to save data", "error");
        }
      } catch (error) {
        console.error("Error saving data:", error);
        createToast("Failed to save data", "error");
      }
    }

    // input.verdict === true positive and escalation yes
    if (input.verdict === "true_positive" && input.escalation == "yes") {
      const formData = new FormData();

      formData.append("_id", input._id);

      // Append only if user entered something
      if (input.tpRemedationNote?.trim()) {
        formData.append("tpRemedationNote", input.tpRemedationNote.trim());
      }
      if (input.caseDetails?.trim()) {
        formData.append("caseDetails", input.caseDetails.trim());
      }
      if (input.escalationReason?.trim()) {
        formData.append("escalationReason", input.escalationReason.trim());
      }
      if (input.tpImpact) {
        formData.append("tpImpact", input.tpImpact);
      }
      if (input.escalation) {
        formData.append("escalation", input.escalation);
      }
      if (input.verdict) {
        formData.append("verdict", input.verdict);
      }

      if (tpEvidenceFiles && tpEvidenceFiles.length > 0) {
        for (let i = 0; i < tpEvidenceFiles.length; i++) {
          formData.append("files", tpEvidenceFiles[i]);
        }
      }

      try {
        const res = await API.patch(
          `/api/v1/alert/alert_save/${input._id}`,
          formData,
        );

        if (res.data.message) {
          closeModal();
          dispatch(getAllAlert());
          createToast("Data saved successfully", "success");
        } else {
          createToast("Failed to save data", "error");
        }
      } catch (error) {
        console.error("Error saving data:", error);
        createToast("Failed to save data", "error");
      }
    }
  };

  const handleLevel_2SaveData = async () => {
    // input.verdict === true positive and escalation yes
    if (
      input.verdict === "true_positive" &&
      input.escalation == "yes" &&
      input.isIncidence !== "yes"
    ) {
      const formData = new FormData();

      formData.append("_id", input._id);

      if (input.investigationFindings?.trim()) {
        formData.append(
          "investigationFindings",
          input.investigationFindings.trim(),
        );
      }
      if (input.investigationToolsUsed) {
        formData.append(
          "investigationToolsUsed",
          input.investigationToolsUsed.trim(),
        );
      }

      try {
        const res = await API.patch(
          `/api/v1/alert/alert_level_2_save/${input._id}`,
          formData,
        );

        if (res.data.message) {
          closeModal();
          dispatch(getAllAlert());
          createToast("Data saved successfully", "success");
        } else {
          createToast("Failed to save data", "error");
        }
      } catch (error) {
        console.error("Error saving data:", error);
        createToast("Failed to save data", "error");
      }
    }

    // input.isIncidence is yes

    if (
      input.verdict === "true_positive" &&
      input.escalation == "yes" &&
      input.isIncidence == "yes"
    ) {
      const formData = new FormData();

      formData.append("_id", input._id);

      // Append only if user entered something
      if (input.irp) {
        formData.append("irp", input.irp);
      }
      if (input.rootCause?.trim()) {
        formData.append("rootCause", input.rootCause.trim());
      }
      if (input.l2RemediationPlan?.trim()) {
        formData.append("l2RemediationPlan", input.l2RemediationPlan.trim());
      }

      if (input.l2RemediationValidation) {
        formData.append(
          "l2RemediationValidation",
          input.l2RemediationValidation.trim(),
        );
      }

      if (formatForDateTimeLocal(input.l2ResolutionTimestamp || currentDate)) {
        formData.append(
          "l2ResolutionTimestamp",
          formatForDateTimeLocal(input.l2ResolutionTimestamp || currentDate),
        );
      }

      try {
        const res = await API.patch(
          `/api/v1/alert/alert_level_3_save/${input._id}`,
          formData,
        );

        if (res.data.message) {
          closeModal();
          dispatch(getAllAlert());
          createToast("Data saved successfully", "success");
        } else {
          createToast("Failed to save data", "error");
        }
      } catch (error) {
        console.error("Error saving data:", error);
        createToast("Failed to save data", "error");
      }
    }
  };

  const handleForwardTo = async (e) => {
    e.preventDefault();

    if (input.verdict === "false_positive") {
      if (
        input.forwardTo.length === 0 ||
        (input.forwardTo.length > 0 &&
          (!input.needToDo || Object.keys(input.needToDo).length === 0)) ||
        (input.forwardTo.length > 0 &&
          input.needToDo &&
          input.forwardTo.length !== Object.keys(input.needToDo).length)
      ) {
        createToast("All fields are required");
        return;
      }
      const formData = {
        alertId: input._id,
        verdict: input.verdict,
        toRoles: input.forwardTo.map((item) => item.value),
        fieldsToFill: input.needToDo,
      };

      try {
        const res = await API.patch(`/api/v1/alert/escalateAlert`, formData);

        if (res.data.message) {
          setSelectedUserRole([]);
          closeModal();
          dispatch(getAllAlert());
          createToast("Alert forwarded successfully", "success");
        } else {
          createToast("Failed to forwarded", "error");
        }
      } catch (error) {
        console.error("Error forwarded data:", error);
        createToast("Failed to forwarded", "error");
      }
    }

    if (input.verdict === "true_positive" && input.escalation == "no") {
      if (
        input.forwardTo.length === 0 ||
        (input.forwardTo.length > 0 &&
          (!input.needToDo || Object.keys(input.needToDo).length === 0)) ||
        (input.forwardTo.length > 0 &&
          input.needToDo &&
          input.forwardTo.length !== Object.keys(input.needToDo).length) ||
        !input.tpImpact ||
        input.tpImpact === "Choose" ||
        input.caseDetails?.trim() === "" ||
        input.tpRemedationNote?.trim() === "" ||
        input.tpRemedationNote === undefined
      ) {
        createToast("All fields are required");
        return;
      }

      const formData = new FormData();

      formData.append("alertId", input._id);
      formData.append(
        "toRoles",
        JSON.stringify(input.forwardTo.map((item) => item.value)),
      );
      formData.append("fieldsToFill", JSON.stringify(input.needToDo));
      formData.append("tpImpact", input.tpImpact);
      formData.append("caseDetails", input.caseDetails.trim());
      formData.append("tpRemedationNote", input.tpRemedationNote.trim());
      formData.append("escalation", input.escalation);
      formData.append("verdict", input.verdict);

      if (tpEvidenceFiles && tpEvidenceFiles.length > 0) {
        for (let i = 0; i < tpEvidenceFiles.length; i++) {
          formData.append("files", tpEvidenceFiles[i]);
        }
      }
      try {
        const res = await API.patch(`/api/v1/alert/escalateAlert`, formData);

        if (res.data.message) {
          setSelectedUserRole([]);
          closeModal();
          dispatch(getAllAlert());
          createToast("Alert forwarded successfully", "success");
        } else {
          createToast("Failed to forwarded", "error");
        }
      } catch (error) {
        console.error("Error forwarded data:", error);
        createToast("Failed to forwarded", "error");
      }
    }

    // true positive and escalation yes
    if (input.verdict === "true_positive" && input.escalation == "yes") {
      if (
        input.forwardTo?.length === 0 ||
        (input.forwardTo?.length > 0 &&
          (!input.needToDo || Object.keys(input.needToDo).length === 0)) ||
        (input.forwardTo?.length > 0 &&
          input.needToDo &&
          input.forwardTo?.length !== Object.keys(input.needToDo).length) ||
        !input.tpImpact ||
        input.tpImpact === "Choose" ||
        input.caseDetails?.trim() === "" ||
        input.tpRemedationNote?.trim() === "" ||
        input.tpRemedationNote === undefined ||
        !input.escalationReason ||
        input.escalationReason.trim() === ""
      ) {
        createToast("All fields are required");
        return;
      }

      const formData = new FormData();

      formData.append("alertId", input._id);
      formData.append(
        "toRoles",
        JSON.stringify(input.forwardTo.map((item) => item.value)),
      );
      formData.append("fieldsToFill", JSON.stringify(input.needToDo));
      formData.append("tpImpact", input.tpImpact);
      formData.append("caseDetails", input.caseDetails.trim());
      formData.append("tpRemedationNote", input.tpRemedationNote.trim());
      formData.append("escalation", input.escalation);
      formData.append("verdict", input.verdict);
      formData.append("escalationReason", input.escalationReason.trim());
      formData.append("authorId", input.author._id);
      formData.append("authorName", input.author.name);
      formData.append("authorIndex", input.author.index);
      formData.append("authorRole", input.author.role);

      if (tpEvidenceFiles && tpEvidenceFiles.length > 0) {
        for (let i = 0; i < tpEvidenceFiles.length; i++) {
          formData.append("files", tpEvidenceFiles[i]);
        }
      }

      try {
        const res = await API.patch(
          `/api/v1/alert/forward_EscalateAlert`,
          formData,
        );

        if (res.data?.message) {
          setSelectedUserRole([]);
          closeModal();
          await dispatch(getAllAlert());
          createToast("Alert forwarded successfully", "success");
        } else {
          createToast("Failed to forward", "error");
        }
      } catch (error) {
        console.error("Error forwarding data:", error);
        createToast("Failed to forward", "error");
      }
    }
  };

  const allRoles = alert?.flatMap((item) => item.fieldsToFill || []);

  // new tailwind design
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
    closed: "bg-red-600 text-white",
    open: "bg-green-600 text-white",
    accepted: "bg-green-600 text-white",
    "not assigned": "bg-red-600 text-white",
    "incidence declared": "bg-red-700 text-white",
    "incidence not declared": "bg-sky-500 text-white",
    "incidence declaration pending": "bg-yellow-500 text-black",
    pending: "bg-yellow-500 text-black",
    default: "bg-gray-400 text-white",
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
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        ),
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

  const handleInvestigation = (row) => {
    const formattedEventTime = formatDateTimeReadable(row.eventTime);
    const formattedAcceptedTime = formatDateTimeReadable(row.acceptedTime);
    setInput({
      ...row,
      eventTime: formattedEventTime,
      acceptedTime: formattedAcceptedTime,
    });
    setTpEvidenceFiles(row.uploadedEvidence);
    setIsModalOpen(true);
    setAlertView(row);
  };

  const handleChat = (row) => {
    setIsChatOpen(true);
    setAlertId(row._id);
    socket.emit("markAsRead", { alertId: row._id, userRole: user.role });
    dispatch(markUserAsRead({ alertId, userRole: user.role }));
  };

  // Helper component for the custom switch/toggle
  const SwitchToggle = ({ label, checked, onChange, disabled }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        disabled={disabled}
      />
      <div
        className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}
      ></div>
      <span
        className={`ml-3 text-sm font-medium text-gray-900 ${
          disabled ? "text-gray-400" : ""
        }`}
      >
        {label}
      </span>
    </label>
  );

  // Helper component for Textarea
  const StyledTextarea = ({
    name,
    value,
    onChange,
    placeholder,
    disabled = false,
    required = false,
  }) => {
    const textareaRef = useRef(null);

    const handleInput = (e) => {
      if (onChange) {
        onChange(e);
      }
      // Auto-resize logic
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    return (
      <textarea
        ref={textareaRef}
        name={name}
        value={value || ""}
        onChange={handleInput}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    );
  };

  const handleTransfer = (row) => {
    setTransferModalOpen(true);
    setTransferAlertId({
      alertId: row._id.toString(),
      acceptedBy: row.acceptedBy.toString(),
      assignedTo: row.assignedTo,
    });
  };

  // FETCH FUNCTION
  const fetchSelfAssigned = async () => {
    try {
      setLoading(true);
      // CALL THE NEW API WITH view="self_assigned"
      const response = await API.get(
        `/api/v1/alert/paginated?page=${selectedPage.current}&limit=${limit}&view=self_assigned&search=${encodeURIComponent(
          debouncedSearchTerm,
        )}`,
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
    fetchSelfAssigned();
  }, [
    limit,
    debouncedSearchTerm,
    dispatch,
    selectedPage,
    alert,
    user._id,
    user.role,
  ]); // Add other dependencies if needed

  const handlePageClick = (e) => {
    selectedPage.current = e.selected + 1;
    fetchSelfAssigned();
  };

  const changeLimit = (newLimit) => {
    const parsedLimit = parseInt(newLimit);
    setLimit(parsedLimit);
    selectedPage.current = 1;
    fetchSelfAssigned();
  };

  return (
    <>
      <Title title={"SEM | Self Assigned"} />

      <div className="bg-gray-900 text-gray-200 min-h-screen  font-sans py-12">
        <main className="p-8">
          <Breadcrumb />

          <div className="flex items-center gap-2 !pt-3 pb-3 !rounded-t">
            <h5 className="flex items-center !text-red-500 text-lg font-semibold space-x-2 p-0 m-0">
              {" "}
              Self Assigned
            </h5>

            <Tag className="h-6 w-6 ml-2.5 text-cyan-400" />
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
                            <td className="p-2 text-gray-300">{index + 1}</td>
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
                              {(() => {
                                let label = "";
                                let key = "";

                                if (
                                  item.incidentDeclarationRequired === "yes"
                                ) {
                                  if (item.isIncidence === "yes") {
                                    label = "Incidence Declared";
                                    key = "incidence declared";
                                  } else if (item.isIncidence === "no") {
                                    label = "Incidence Not Declared";
                                    key = "incidence not declared";
                                  } else {
                                    label = "Incidence Declaration Pending";
                                    key = "incidence declaration pending";
                                  }
                                } else {
                                  label =
                                    item.status === "unassigned"
                                      ? "Not Assigned"
                                      : "Accepted";
                                  key =
                                    item.status === "unassigned"
                                      ? "not assigned"
                                      : "accepted";
                                }

                                const colorClass =
                                  STATUS_COLORS[key] || STATUS_COLORS.default;

                                return (
                                  <span
                                    className={`inline-block px-2 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${colorClass}`}
                                  >
                                    {label}
                                  </span>
                                );
                              })()}
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
                            <td className="p-2">
                              <div className="flex flex-wrap items-center gap-3">
                                {/* Investigation Button */}
                                <button
                                  onClick={() => handleInvestigation(item)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-cyan-400 text-xs font-medium rounded-full shadow-md transition-all duration-200 cursor-pointer"
                                >
                                  <ChartSpline className="w-4 h-4 text-cyan-400" />
                                  <span>Investigation</span>
                                </button>

                                {/* Chat Button with Badge (visible only for Level_2) */}
                                {user.role === "Level_2" && (
                                  <div className="relative inline-block">
                                    <button
                                      onClick={() => handleChat(item)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-full shadow-md transition-all duration-200 cursor-pointer"
                                    >
                                      <i className="fa-solid fa-comments"></i>
                                      <span>Chat</span>
                                    </button>

                                    {/* Unread Badge */}
                                    {unreadCountMap[item._id]?.includes(
                                      user.role,
                                    ) && (
                                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                                        {
                                          unreadCountMap[item._id]?.filter(
                                            (r) => r === user.role,
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
                                    <i className="fa fa-exchange"></i> Transfer
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

                  {/* Pagination Controls */}
                  {/* <div className="flex justify-between items-center mt-4 text-gray-300">
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

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50  flex items-center justify-center bg-black/30 bg-opacity-50
          transition-opacity duration-500 ease-out"
        >
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 mt-5">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-b-amber-600 pb-1">
              <h2 className="text-lg font-semibold text-white">
                Alert Investigation
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-white text-sm font-bold pb-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Alert Details Toggle */}

            <div className="mt-4">
              <button
                onClick={() => setOpenAlertDetails(!openAlertDetails)}
                className="border border-green-500 text-green-600 hover:bg-gray-600 font-medium text-sm px-4 py-1 rounded-lg transition-all cursor-pointer"
              >
                Alert Details
              </button>

              {user.role === "Level_2" ? (
                <AnimatePresence>
                  {openAlertDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4"
                    >
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
                      {/* Grid Section */}
                      <div className="grid md:grid-cols-3 gap-3 text-sm text-white">
                        <div className="hidden">
                          <strong>Alert IDs:</strong> {input._id}
                        </div>
                        <div className="hidden">
                          <strong>Author:</strong> {input.author?.name}
                        </div>
                        <div>
                          <strong>Alert Name:</strong> {input.alertName}
                        </div>
                        <div>
                          <strong>Alert ID:</strong> {input.alertId}
                        </div>
                        <div>
                          <strong>Accepted Time:</strong>{" "}
                          {formatDateTimeReadable(alertView.acceptedTime || "")}
                        </div>
                        <div>
                          <strong>Severity:</strong> {input.severity}
                        </div>
                        <div>
                          <strong>Event Time:</strong>{" "}
                          {formatDateTimeReadable(alertView.eventTime)}
                        </div>
                        <div>
                          <strong>Alert Source:</strong> {input.alertSource}
                        </div>
                        <div>
                          <strong>Affected User Device:</strong>{" "}
                          {input.affectedUserDevice}
                        </div>
                        <div>
                          <strong>Affected IP/Website:</strong>{" "}
                          {input.affectedIpWebsite}
                        </div>
                        <div>
                          <strong>Verdict:</strong> {input.verdict}
                        </div>

                        {input.fieldsToFill?.length > 0 && (
                          <div className="mt-4 mb-2">
                            <div className="text-red-500 mb-2 font-bold text-base">
                              Forwarded To:
                            </div>

                            <div className="space-y-2">
                              {input.fieldsToFill.map((field, index) => (
                                <p
                                  key={index}
                                  className="flex flex-wrap items-center gap-2 text-sm text-gray-200"
                                >
                                  <span className="font-medium">
                                    {field.role}
                                  </span>

                                  {field.isPerformed === "performed" ||
                                  field.comments?.trim() !== "" ? (
                                    <>
                                      {/* ✅ Completed Icon */}
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 text-green-500"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                      >
                                        <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5z" />
                                        <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0" />
                                      </svg>

                                      {field.comments?.trim() !== "" && (
                                        <span className="text-gray-400 text-xs">
                                          Comments: {field.comments}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {/* ⏳ Pending Icon */}
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 text-blue-300"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                      >
                                        <path d="M2 14.5a.5.5 0 0 0 .5.5h11a.5.5 0 1 0 0-1h-1v-1a4.5 4.5 0 0 0-2.557-4.06c-.29-.139-.443-.377-.443-.59v-.7c0-.213.154-.451.443-.59A4.5 4.5 0 0 0 12.5 3V2h1a.5.5 0 0 0 0-1h-11a.5.5 0 0 0 0 1h1v1a4.5 4.5 0 0 0 2.557 4.06c.29.139.443.377.443.59v.7c0 .213-.154.451-.443.59A4.5 4.5 0 0 0 3.5 13v1h-1a.5.5 0 0 0-.5.5m2.5-.5v-1a3.5 3.5 0 0 1 1.989-3.158c.533-.256 1.011-.79 1.011-1.491v-.702s.18.101.5.101.5-.1.5-.1v.7c0 .701.478 1.236 1.011 1.492A3.5 3.5 0 0 1 11.5 13v1z" />
                                      </svg>
                                    </>
                                  )}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* stepper */}

                      <div className="grid md:grid-cols-1 text-sm text-white">
                        <AlertStepper assignedTo={input.assignedTo} />
                      </div>
                      {/* stepper */}

                      <div className="mt-6 mb-0 border-t border-gray-700 pt-3">
                        <h6 className="!text-amber-500 text-lg font-semibold mb-0 border-b border-b-amber-600 pb-1">
                          True Positive Case Details
                        </h6>
                      </div>

                      <div className="grid md:grid-cols-1 text-sm  text-white mt-3 mb-3">
                        <div>
                          <strong>Case Details:</strong> {input.caseDetails}
                        </div>
                      </div>
                      {/* Uploaded Evidence */}
                      <div className="grid md:grid-cols-1 text-sm  text-white mt-3 mb-3">
                        <div>
                          <strong>Uploaded Evidence:</strong>
                        </div>

                        {/* File List */}
                        <div className="flex flex-wrap gap-4 mt-3">
                          {tpEvidenceFiles.map((file, index) => (
                            <div
                              key={index}
                              className="relative border border-gray-700 rounded-lg p-3 flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/60 transition-all duration-200 w-28 sm:w-32"
                            >
                              <div
                                className="cursor-pointer flex flex-col items-center"
                                onClick={() => handleFileShowToOtherTab(file)}
                              >
                                <img
                                  src={pdf}
                                  alt="pdf"
                                  className="w-8 h-8 mb-2"
                                />
                                <p className="text-[11px] text-gray-300 text-center break-all">
                                  {file?.split("_").pop()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm text-white">
                        {/* TP Impact */}
                        <div>
                          <strong>TP Impact:</strong> {input.tpImpact}
                        </div>

                        {/* Escalation & Reason */}
                        <div>
                          <strong>Escalation:</strong> {input.escalation}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-1 gap-3 text-sm mt-3 text-white">
                        {/* Escalation & Reason */}
                        <div>
                          <strong>Escalation Reason:</strong>{" "}
                          {input.escalationReason}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-1 gap-3 text-sm mt-3 text-white">
                        {/* TP Remediation Actions */}
                        <div>
                          <strong>TP Remediation Actions:</strong>{" "}
                          {input.tpRemedationNote}
                        </div>
                      </div>

                      {/* L2 Processing Area */}
                      {filledFields?.length > 0 &&
                        input.isIncidence === "yes" && (
                          <div className="mt-4">
                            <h6 className="!text-amber-500 font-semibold mb-2 text-lg">
                              L2 Processing Area
                            </h6>

                            <div className="space-y-2">
                              {filledFields.map(({ label, key }) => (
                                <div
                                  key={key}
                                  className="text-sm text-gray-200"
                                >
                                  <strong className="text-gray-300">
                                    {label}:
                                  </strong>{" "}
                                  <span>{alertView[key]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Other Division Informed */}
                      {input.fieldsToFill && input.fieldsToFill.length > 0 && (
                        <div className="mt-6">
                          <h6 className="text-red-500 font-semibold mb-2">
                            Other Division Informed
                          </h6>
                          <hr className="border-gray-700 mb-3" />

                          {/* Requested Actions */}
                          <div className="space-y-3">
                            {input.fieldsToFill.map((field, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-200"
                              >
                                <label className="block font-medium text-gray-300">
                                  {`${
                                    field.role || "Unknown Role"
                                  }: Need to perform requested actions below`}
                                </label>
                                <ul className="list-disc list-inside ml-4 mt-1">
                                  <li className="text-red-400">
                                    {field.value || "No action provided"}
                                  </li>
                                </ul>
                              </div>
                            ))}
                          </div>

                          {/* Other Divisions Answer */}
                          <div className="mt-6">
                            <h6 className="text-red-500 font-semibold mb-2">
                              Other Divisions Answer:
                            </h6>
                            <hr className="border-gray-700 mb-3" />

                            <div className="space-y-3 text-sm">
                              {input.fieldsToFill.map((field, index) => (
                                <div key={index} className="text-gray-300">
                                  <span className="font-semibold">
                                    {field?.role}:
                                  </span>
                                  {field.comments &&
                                  field.comments.trim() !== "" ? (
                                    <>
                                      <span className="text-gray-400 ml-2">
                                        Action Performed:{" "}
                                        <span className="text-gray-300 font-medium">
                                          {field.isPerformed}
                                        </span>{" "}
                                        &nbsp; &#38;
                                      </span>
                                      <span className="text-gray-400 ml-2">
                                        Comments:{" "}
                                        <span className="text-gray-300 font-medium">
                                          {field.comments}
                                        </span>
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-gray-400 ml-2">
                                        Action Performed:{" "}
                                        <span className="text-gray-300 font-medium">
                                          {field.isPerformed}
                                        </span>{" "}
                                        &nbsp; &#38;
                                      </span>
                                      <span className="text-gray-400 ml-2">
                                        Comments:{" "}
                                        <span className="text-gray-300 font-medium">
                                          No comments
                                        </span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <form
                        onSubmit={handle_Lavel_2_InvestigationSubmit}
                        encType="multipart/form-data"
                        className="w-full text-gray-200"
                      >
                        {/* Hidden Fields */}
                        <input
                          type="text"
                          name="alertId"
                          value={input._id}
                          hidden
                          className="bg-transparent"
                        />
                        <input
                          type="text"
                          name="author"
                          value={input.author}
                          hidden
                          className="bg-transparent"
                        />

                        {/* Conditional Section */}
                        {!filledFields.some(
                          (field) =>
                            field.key === "investigationFindings" &&
                            field.key === "investigationToolsUsed" &&
                            field.key === "incidentDeclarationRequired" &&
                            field.key === "incidentDeclarationReason",
                        ) && (
                          <>
                            {input.isIncidence !== "yes" && (
                              <div className="mt-6">
                                {/* Section Header */}
                                <h6 className="!text-amber-500 text-lg font-semibold mb-0 border-b border-b-amber-600 pb-1">
                                  L2 Processing Area
                                </h6>

                                {/* Investigation Findings */}
                                <div className="flex flex-col mb-4 mt-3 px-2 ">
                                  <label className="font-medium text-gray-300 mb-1">
                                    Investigation Findings
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>

                                  <textarea
                                    name="investigationFindings"
                                    rows="3"
                                    value={input.investigationFindings}
                                    onChange={handleInputChange}
                                    disabled={
                                      user.role === "Level_1" ||
                                      input.isIncidence === "no" ||
                                      alertView?.investigationFindings?.trim()
                                    }
                                    className={`w-full border border-gray-700 rounded-md p-2 text-sm bg-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none h-20 overflow-y-auto ${
                                      user.role === "Level_1"
                                        ? "opacity-70 cursor-not-allowed"
                                        : ""
                                    }`}
                                  />
                                </div>

                                {/* Investigation Tools */}
                                <div className="flex flex-col mb-4 px-2">
                                  <label className="font-medium text-gray-300 mb-1">
                                    Investigation Methodology and Tools
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>

                                  <textarea
                                    name="investigationToolsUsed"
                                    rows="3"
                                    value={input.investigationToolsUsed}
                                    onChange={handleInputChange}
                                    disabled={
                                      user.role === "Level_1" ||
                                      input.isIncidence === "no" ||
                                      alertView?.investigationToolsUsed?.trim()
                                    }
                                    className={`w-full border border-gray-700 rounded-md p-2 text-sm bg-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none h-20 overflow-y-auto ${
                                      user.role === "Level_1"
                                        ? "opacity-70 cursor-not-allowed"
                                        : ""
                                    }`}
                                  />
                                </div>

                                {/* L2 Verdict Switch */}
                                <div className="flex flex-col mb-4">
                                  <label className="font-medium text-gray-300 mb-1">
                                    L2 Verdict
                                    <span className="text-red-500 text-lg align-middle">
                                      *
                                    </span>
                                  </label>

                                  <div className="flex items-center gap-3 px-2">
                                    {/* Custom switch using Tailwind */}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        disabled={
                                          input.isIncidence === "no" ||
                                          alertView?.L2verdict ===
                                            "true_positive" ||
                                          (alertView?.L2verdict ===
                                            "false_positive" &&
                                            alertView?.fieldsToFill?.length >
                                              0) ||
                                          input.isIncidence === "yes"
                                        }
                                        checked={
                                          input.L2verdict === "true_positive"
                                        }
                                        onChange={(e) =>
                                          setInput((prev) => ({
                                            ...prev,
                                            incidentDeclarationRequired: "",
                                            L2verdict: e.target.checked
                                              ? "true_positive"
                                              : "false_positive",
                                          }))
                                        }
                                        className="sr-only peer"
                                      />
                                      <div className="w-9 h-4 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:bg-cyan-500 transition-all"></div>
                                      <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                    </label>

                                    <span className="text-sm text-gray-200">
                                      {input.L2verdict === "true_positive"
                                        ? "True Positive"
                                        : "False Positive"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* False Positive Section */}
                        {input.L2verdict === "false_positive" && (
                          <>
                            <div className="mt-4 mb-4 ">
                              {/* Forward To */}
                              <div className="mb-4">
                                <label className="block font-medium text-gray-300 mb-2">
                                  Forward To
                                </label>
                                <div className="mb-8 relative ">
                                  <Select
                                    className="text-sm"
                                    menuPortalTarget={document.body}
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // Tailwind gray-800
                                        borderColor: "#374151", // Tailwind gray-700
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
                                    options={options}
                                    isMulti
                                    isClearable
                                    value={input.forwardTo}
                                    onChange={handleSelectChange2}
                                  />
                                </div>
                              </div>

                              {/* Actions Need to Perform */}
                              {Array.isArray(selectedUserRole) &&
                                selectedUserRole.map((item) => (
                                  <div key={item.value} className="mb-3 px-2">
                                    <label className="block text-tomato-500 text-sm font-medium mb-2 text-red-400">
                                      {`${item.value}: Actions Need to Perform`}
                                    </label>

                                    <textarea
                                      rows={6}
                                      value={input.needToDo?.[item.value] || ""}
                                      onChange={(e) => {
                                        handleNeedToDoChange(
                                          item.value,
                                          e.target.value,
                                        );
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="Write Down What Should Need to Do"
                                      className="w-full border border-gray-700 rounded-md p-2 text-sm text-gray-200 bg-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none overflow-hidden"
                                    />
                                  </div>
                                ))}
                            </div>

                            {selectedUserRole?.length === 0 && (
                              <>
                                {/* Hand Back Note */}
                                <div className="flex flex-col space-y-1 px-2 ">
                                  <label className="text-sm font-medium text-gray-200">
                                    Hand Back Note to L1 Assignee{" "}
                                    <span className="text-red-500 text-lg">
                                      *
                                    </span>
                                  </label>
                                  <textarea
                                    rows={10}
                                    name="handBackNoteToL1"
                                    value={input.handBackNoteToL1}
                                    onChange={(e) => {
                                      handleInputChange(e);
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Explain Hand Back Note Details..."
                                    className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* True Positive Section */}
                        {input.L2verdict === "true_positive" && (
                          <div className="mt-4">
                            <div className="flex flex-col mb-4">
                              <label className="font-medium text-gray-300 mb-1">
                                Incident Declaration Required?{" "}
                                <span className="text-red-500 text-lg align-middle">
                                  *
                                </span>
                              </label>

                              <div className="px-2">
                                <select
                                  name="incidentDeclarationRequired"
                                  value={input.incidentDeclarationRequired}
                                  onChange={handleSelectChange}
                                  disabled={
                                    user.role === "Level_1" ||
                                    input.isIncidence === "yes" ||
                                    alertView?.l2RemediationPlan?.trim() ||
                                    alertView?.incidentDeclarationRequired?.trim()
                                  }
                                  className={`w-full border border-gray-700 rounded-md p-2 text-sm bg-gray-700 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                                    user.role === "Level_1"
                                      ? "opacity-70 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <option value="Choose">Choose...</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {input.incidentDeclarationRequired === "no" &&
                          alertView?.l2RemediationPlan?.trim() && (
                            <div className="mt-6 bg-gray-800/40 p-6 rounded-2xl border border-gray-700 shadow-md space-y-6">
                              {/* Header */}
                              <div>
                                <h5 className="text-lg font-semibold text-red-500">
                                  Details Forward to L1 Assignee
                                </h5>
                                <hr className="border-gray-700 mt-2" />
                              </div>

                              {/* L2 Remediation Plan */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  L2 Remediation Plan{" "}
                                  <span className="text-red-500 text-lg">
                                    *
                                  </span>
                                </label>
                                <textarea
                                  rows={10}
                                  name="l2RemediationPlan"
                                  value={input.l2RemediationPlan}
                                  disabled={alertView?.l2RemediationPlan?.trim()}
                                  onChange={(e) => {
                                    handleInputChange(e);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  placeholder="Planned actions (e.g., Block C2, Deploy EDR, Restore from backup...)"
                                  className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                              </div>

                              {/* Forward To
                            <div className="flex flex-col space-y-1">
                              <label className="text-sm font-medium text-gray-200">
                                Forward To
                              </label>
                              <Select
                                options={options}
                                isMulti
                                isClearable
                                value={input.forwardTo}
                                onChange={handleSelectChange2}
                                className="text-gray-900 text-sm"
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    backgroundColor: "#1f2937", // Tailwind gray-800
                                    borderColor: "#374151", // Tailwind gray-700
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
                              />
                            </div> */}

                              {/* Dynamic user role textareas */}
                              {/* {Array.isArray(selectedUserRole) &&
                              selectedUserRole.map((item) => (
                                <div
                                  key={item.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <label
                                    htmlFor={`needToDo-${item.value}`}
                                    className="text-sm font-medium text-red-400"
                                  >
                                    {`${item.value}: Actions Need to Perform`}
                                  </label>
                                  <textarea
                                    id={`needToDo-${item.value}`}
                                    rows={10}
                                    value={input.needToDo?.[item.value] || ""}
                                    onChange={(e) => {
                                      handleNeedToDoChange(
                                        item.value,
                                        e.target.value
                                      );
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Write Down What Should Need to do"
                                    className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                  />
                                </div>
                              ))} */}

                              {alertView?.l2RemediationPlan?.trim() && (
                                <>
                                  {/* L2 Remediation Validation */}
                                  <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-200">
                                      L2 Remediation Validation{" "}
                                      <span className="text-red-500 text-lg">
                                        *
                                      </span>
                                    </label>
                                    <textarea
                                      rows={10}
                                      name="l2RemediationValidation"
                                      value={input.l2RemediationValidation}
                                      onChange={(e) => {
                                        handleInputChange(e);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="How L2 validated execution (e.g., Checked firewall logs for block...)"
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>

                                  {/* Hand Back Note */}
                                  <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-200">
                                      Hand Back Note to L1 Assignee{" "}
                                      <span className="text-red-500 text-lg">
                                        *
                                      </span>
                                    </label>
                                    <textarea
                                      rows={10}
                                      name="handBackNoteToL1"
                                      value={input.handBackNoteToL1}
                                      onChange={(e) => {
                                        handleInputChange(e);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="Explain Hand Back Note Details..."
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                        {input.incidentDeclarationRequired === "no" &&
                          !alertView.l2RemediationPlan?.trim() && (
                            <div className="mt-6 bg-gray-800/40 p-6 rounded-2xl border border-gray-700 shadow-md space-y-6">
                              {/* Header */}
                              <div>
                                <h5 className="text-lg font-semibold text-red-500">
                                  Details Forward to L1 Assignee
                                </h5>
                                <hr className="border-gray-700 mt-2" />
                              </div>

                              {/* L2 Remediation Plan */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  L2 Remediation Plan{" "}
                                  <span className="text-red-500 text-lg">
                                    *
                                  </span>
                                </label>
                                <textarea
                                  rows={10}
                                  name="l2RemediationPlan"
                                  value={input.l2RemediationPlan}
                                  disabled={alertView.l2RemediationPlan?.trim()}
                                  onChange={(e) => {
                                    handleInputChange(e);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  placeholder="Planned actions (e.g., Block C2, Deploy EDR, Restore from backup...)"
                                  className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                              </div>

                              {/* Forward To */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  Forward To
                                </label>
                                <Select
                                  options={options}
                                  isMulti
                                  isClearable
                                  value={input.forwardTo}
                                  onChange={handleSelectChange2}
                                  className="text-gray-900 text-sm"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      backgroundColor: "#1f2937", // Tailwind gray-800
                                      borderColor: "#374151", // Tailwind gray-700
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
                                />
                              </div>

                              {/* Dynamic user role textareas */}
                              {Array.isArray(selectedUserRole) &&
                                selectedUserRole.map((item) => (
                                  <div
                                    key={item.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    <label
                                      htmlFor={`needToDo-${item.value}`}
                                      className="text-sm font-medium text-red-400"
                                    >
                                      {`${item.value}: Actions Need to Perform`}
                                    </label>
                                    <textarea
                                      id={`needToDo-${item.value}`}
                                      rows={10}
                                      value={input.needToDo?.[item.value] || ""}
                                      onChange={(e) => {
                                        handleNeedToDoChange(
                                          item.value,
                                          e.target.value,
                                        );
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="Write Down What Should Need to do"
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>
                                ))}

                              {selectedUserRole?.length === 0 && (
                                <>
                                  {/* L2 Remediation Validation */}
                                  <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-200">
                                      L2 Remediation Validation{" "}
                                      <span className="text-red-500 text-lg">
                                        *
                                      </span>
                                    </label>
                                    <textarea
                                      rows={10}
                                      name="l2RemediationValidation"
                                      value={input.l2RemediationValidation}
                                      onChange={(e) => {
                                        handleInputChange(e);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="How L2 validated execution (e.g., Checked firewall logs for block...)"
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>

                                  {/* Hand Back Note */}
                                  <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-200">
                                      Hand Back Note to L1 Assignee{" "}
                                      <span className="text-red-500 text-lg">
                                        *
                                      </span>
                                    </label>
                                    <textarea
                                      rows={10}
                                      name="handBackNoteToL1"
                                      value={input.handBackNoteToL1}
                                      onChange={(e) => {
                                        handleInputChange(e);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="Explain Hand Back Note Details..."
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                        {input.incidentDeclarationRequired === "yes" &&
                          input.isIncidence === "pending" && (
                            <div className="mt-4 bg-gray-800/40 p-3 rounded-2xl border border-gray-700 shadow-md space-y-4">
                              {/* Forward To */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  Forward To
                                </label>
                                <Select
                                  options={options}
                                  isMulti
                                  isClearable
                                  value={input.forwardTo}
                                  onChange={handleSelectChange2}
                                  className="text-gray-900 text-sm"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      backgroundColor: "#1f2937", // Tailwind gray-800
                                      borderColor: "#374151", // Tailwind gray-700
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
                                />
                              </div>

                              {/* Dynamic user role textareas */}
                              {Array.isArray(selectedUserRole) &&
                                selectedUserRole.map((item) => (
                                  <div
                                    key={item.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    <label
                                      htmlFor={`needToDo-${item.value}`}
                                      className="text-sm font-medium text-red-400"
                                    >
                                      {`${item.value}: Actions Need to Perform`}
                                    </label>
                                    <textarea
                                      id={`needToDo-${item.value}`}
                                      rows={10}
                                      value={input.needToDo?.[item.value] || ""}
                                      onChange={(e) => {
                                        handleNeedToDoChange(
                                          item.value,
                                          e.target.value,
                                        );
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="Write Down What Should Need to do"
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>
                                ))}

                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  Incident Declaration Reason{" "}
                                  <span className="text-red-500 text-lg">
                                    *
                                  </span>
                                </label>
                                <textarea
                                  rows={3}
                                  name="incidentDeclarationReason"
                                  placeholder="Please explain..."
                                  value={input.incidentDeclarationReason}
                                  onChange={(e) =>
                                    setInput({
                                      ...input,
                                      incidentDeclarationReason: e.target.value,
                                    })
                                  }
                                  className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                              </div>
                            </div>
                          )}

                        {input.incidentDeclarationRequired === "yes" &&
                          input.isIncidence === "no" && (
                            <>
                              <div className="mt-6 bg-gray-800/40 p-6 rounded-2xl border border-gray-700 shadow-md space-y-6">
                                {/* Header */}
                                <div>
                                  <h5 className="text-lg font-semibold text-red-500">
                                    Details Forward to L1 Assignee
                                  </h5>
                                  <hr className="border-gray-700 mt-2" />
                                </div>

                                {/* L2 Remediation Plan */}
                                <div className="flex flex-col space-y-1">
                                  <label className="text-sm font-medium text-gray-200">
                                    L2 Remediation Plan{" "}
                                    <span className="text-red-500 text-lg">
                                      *
                                    </span>
                                  </label>
                                  <textarea
                                    rows={10}
                                    name="l2RemediationPlan"
                                    value={input.l2RemediationPlan}
                                    disabled={alertView.l2RemediationPlan?.trim()}
                                    onChange={(e) => {
                                      handleInputChange(e);
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Planned actions (e.g., Block C2, Deploy EDR, Restore from backup...)"
                                    className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                  />
                                </div>

                                {/* Forward To */}
                                <div className="flex flex-col space-y-1">
                                  <label className="text-sm font-medium text-gray-200">
                                    Forward To
                                  </label>
                                  <Select
                                    options={options}
                                    isMulti
                                    isClearable
                                    value={input.forwardTo}
                                    onChange={handleSelectChange2}
                                    className="text-gray-900 text-sm"
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // Tailwind gray-800
                                        borderColor: "#374151", // Tailwind gray-700
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
                                  />
                                </div>

                                {/* Dynamic user role textareas */}
                                {Array.isArray(selectedUserRole) &&
                                  selectedUserRole.map((item) => (
                                    <div
                                      key={item.value}
                                      className="flex flex-col space-y-1"
                                    >
                                      <label
                                        htmlFor={`needToDo-${item.value}`}
                                        className="text-sm font-medium text-red-400"
                                      >
                                        {`${item.value}: Actions Need to Perform`}
                                      </label>
                                      <textarea
                                        id={`needToDo-${item.value}`}
                                        rows={10}
                                        value={
                                          input.needToDo?.[item.value] || ""
                                        }
                                        onChange={(e) => {
                                          handleNeedToDoChange(
                                            item.value,
                                            e.target.value,
                                          );
                                          e.target.style.height = "auto";
                                          e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        placeholder="Write Down What Should Need to do"
                                        className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                      />
                                    </div>
                                  ))}

                                {selectedUserRole.length === 0 && (
                                  <>
                                    {/* L2 Remediation Validation */}
                                    <div className="flex flex-col space-y-1">
                                      <label className="text-sm font-medium text-gray-200">
                                        L2 Remediation Validation{" "}
                                        <span className="text-red-500 text-lg">
                                          *
                                        </span>
                                      </label>
                                      <textarea
                                        rows={10}
                                        name="l2RemediationValidation"
                                        value={input.l2RemediationValidation}
                                        onChange={(e) => {
                                          handleInputChange(e);
                                          e.target.style.height = "auto";
                                          e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        placeholder="How L2 validated execution (e.g., Checked firewall logs for block...)"
                                        className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                      />
                                    </div>

                                    {/* Hand Back Note */}
                                    <div className="flex flex-col space-y-1">
                                      <label className="text-sm font-medium text-gray-200">
                                        Hand Back Note to L1 Assignee{" "}
                                        <span className="text-red-500 text-lg">
                                          *
                                        </span>
                                      </label>
                                      <textarea
                                        rows={10}
                                        name="handBackNoteToL1"
                                        value={input.handBackNoteToL1}
                                        onChange={(e) => {
                                          handleInputChange(e);
                                          e.target.style.height = "auto";
                                          e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        placeholder="Explain Hand Back Note Details..."
                                        className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}

                        {input.incidentDeclarationRequired === "yes" &&
                          input.isIncidence === "yes" && (
                            <div className="mt-4 bg-gray-800/40 p-4 rounded-2xl border border-gray-700 shadow-md space-y-6">
                              {/* Section Heading */}
                              <h5 className="text-red-500 text-lg font-semibold">
                                Details Information of Incidence and Remediation
                              </h5>
                              <hr className="border-gray-600" />

                              {/* IRP Initiated */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  IRP Initiated?{" "}
                                  <span className="text-red-500 text-lg">
                                    *
                                  </span>
                                </label>
                                <select
                                  name="irp"
                                  value={input.irp}
                                  disabled={alertView?.irp?.trim()}
                                  onChange={handleSelectChange}
                                  className="bg-gray-700 text-sm text-gray-200 border border-gray-700 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                  <option value="Choose">Choose...</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                  <option value="n/a">N/A</option>
                                </select>
                              </div>

                              {/* L2 Root Cause Analysis */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  L2 Root Cause Analysis{" "}
                                  <span className="text-red-500 text-lg">
                                    *
                                  </span>
                                </label>
                                <textarea
                                  rows={10}
                                  name="rootCause"
                                  placeholder="Follow 5W approach..."
                                  value={input.rootCause}
                                  disabled={alertView?.rootCause?.trim()}
                                  onChange={(e) => {
                                    handleInputChange(e);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                              </div>

                              {/* L2 Remediation Plan */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium text-gray-200">
                                  L2 Remediation Plan{" "}
                                  <span className="text-red-500 text-lg">
                                    *
                                  </span>
                                </label>
                                <textarea
                                  rows={10}
                                  name="l2RemediationPlan"
                                  placeholder="Planned actions (e.g., Block C2, Deploy EDR, Restore from backup...)"
                                  value={input.l2RemediationPlan}
                                  disabled={alertView?.l2RemediationPlan?.trim()}
                                  onChange={(e) => {
                                    handleInputChange(e);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                              </div>

                              <>
                                {/* Forward To */}
                                <div className="flex flex-col space-y-1">
                                  <label className="text-sm font-medium text-gray-200">
                                    Forward To
                                  </label>
                                  <Select
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // Tailwind gray-800
                                        borderColor: "#374151", // Tailwind gray-700
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
                                    options={options}
                                    isMulti
                                    isClearable
                                    value={input.forwardTo}
                                    onChange={handleSelectChange2}
                                  />
                                </div>
                              </>

                              {/* Actions Need to Perform */}
                              {Array.isArray(selectedUserRole) &&
                                selectedUserRole.map((item) => (
                                  <div
                                    key={item.value}
                                    className="flex flex-col space-y-1 mt-3"
                                  >
                                    <label
                                      className="text-sm font-medium"
                                      style={{ color: "tomato" }}
                                    >
                                      {`${item.value}: Actions Need to Perform`}
                                    </label>
                                    <textarea
                                      rows={10}
                                      value={input.needToDo?.[item.value] || ""}
                                      onChange={(e) => {
                                        handleNeedToDoChange(
                                          item.value,
                                          e.target.value,
                                        );
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      placeholder="Write Down What Should Need to do"
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>
                                ))}

                              {selectedUserRole.length === 0 && (
                                <>
                                  {/* L2 Remediation Validation */}
                                  <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-200">
                                      L2 Remediation Validation{" "}
                                      <span className="text-red-500 text-lg">
                                        *
                                      </span>
                                    </label>
                                    <textarea
                                      rows={10}
                                      name="l2RemediationValidation"
                                      value={input.l2RemediationValidation}
                                      placeholder="How L2 validated execution (e.g., Checked firewall logs for block)"
                                      onChange={(e) => {
                                        handleInputChange(e);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>

                                  {/* Hand Back Note */}
                                  <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-200">
                                      Hand Back Note to L1 Assignee{" "}
                                      <span className="text-red-500 text-lg">
                                        *
                                      </span>
                                    </label>
                                    <textarea
                                      rows={10}
                                      name="handBackNoteToL1"
                                      value={input.handBackNoteToL1}
                                      placeholder="Explain Hand Back Note Details..."
                                      onChange={(e) => {
                                        handleInputChange(e);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      className="w-full bg-transparent text-gray-200 border border-gray-700 rounded-xl p-3 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                        <div className="mt-8 pt-4 border-t border-gray-700">
                          {user.role === "Level_1" ? (
                            ""
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="submit"
                                className="flex-1 gap-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center transition-colors duration-200 cursor-pointer"
                              >
                                <i className="fa-regular fa-paper-plane"></i>
                                {alertLoader ? "Submitting..." : "Submit"}
                              </button>

                              <button
                                type="button"
                                onClick={handleLevel_2SaveData}
                                className={`w-full sm:w-1/2 py-2 px-4  text-white font-medium transition-colors cursor-pointer ${
                                  input.isIncidence === "yes"
                                    ? input.handBackNoteToL1?.trim() ||
                                      input.handBackToL1Assignee
                                      ? "bg-gray-500 cursor-not-allowed"
                                      : "bg-cyan-600 hover:bg-cyan-700"
                                    : input.incidentDeclarationRequired ===
                                          "yes" ||
                                        input.incidentDeclarationRequired ===
                                          "no" ||
                                        input.handBackNoteToL1?.trim() ||
                                        input.handBackToL1Assignee
                                      ? "bg-gray-500 cursor-not-allowed"
                                      : "bg-cyan-600 hover:bg-cyan-700"
                                }`}
                                disabled={
                                  input.isIncidence === "yes"
                                    ? input.handBackNoteToL1?.trim() ||
                                      input.handBackToL1Assignee
                                    : input.incidentDeclarationRequired ===
                                        "yes" ||
                                      input.incidentDeclarationRequired ===
                                        "no" ||
                                      input.handBackNoteToL1?.trim() ||
                                      input.handBackToL1Assignee
                                }
                              >
                                Save as Draft
                              </button>
                            </div>
                          )}
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <form
                  onSubmit={handleInvestigationSubmit}
                  encType="multipart/form-data"
                >
                  <AnimatePresence>
                    {openAlertDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="flex justify-between mb-3">
                          <h6 className="flex flex-end gap-2 align-middle !text-amber-500 font-medium mb-3 underline underline-offset-8">
                            Alert Information
                          </h6>

                          <div className="flex items-center gap-3 ">
                            <BlobProvider
                              document={
                                <AlertReport data={input} user={user} />
                              }
                            >
                              {({ blob, url, loading, error }) => {
                                if (loading)
                                  return (
                                    <button disabled>Preparing PDF...</button>
                                  );
                                if (error)
                                  return <div>Error generating PDF</div>;

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
                        {/* Grid Section */}
                        <div className="grid md:grid-cols-3 gap-3 text-sm text-white">
                          <div className="hidden">
                            <strong>Alert IDs:</strong> {input._id}
                          </div>
                          <div className="hidden">
                            <strong>Author:</strong> {input.author?.name}
                          </div>
                          <div>
                            <strong>Alert Name:</strong> {input.alertName}
                          </div>
                          <div>
                            <strong>Alert ID:</strong> {input.alertId}
                          </div>
                          <div>
                            <strong>Accepted Time:</strong>{" "}
                            {formatDateTimeReadable(
                              alertView.acceptedTime || "",
                            )}
                          </div>
                          <div>
                            <strong>Severity:</strong> {input.severity}
                          </div>
                          <div>
                            <strong>Event Time:</strong>{" "}
                            {formatDateTimeReadable(alertView.eventTime)}
                          </div>
                          <div>
                            <strong>Alert Source:</strong> {input.alertSource}
                          </div>
                          <div>
                            <strong>Affected User Device:</strong>{" "}
                            {input.affectedUserDevice}
                          </div>
                          <div>
                            <strong>Affected IP/Website:</strong>{" "}
                            {input.affectedIpWebsite}
                          </div>
                          <div>
                            <strong>Verdict:</strong> {input.verdict}
                          </div>

                          {input.fieldsToFill?.length > 0 && (
                            <div className="mt-4 mb-2">
                              <div className="text-red-500 mb-2 font-bold text-base">
                                Forwarded To:
                              </div>

                              <div className="space-y-2">
                                {input.fieldsToFill.map((field, index) => (
                                  <p
                                    key={index}
                                    className="flex flex-wrap items-center gap-2 text-sm text-gray-200"
                                  >
                                    <span className="font-medium">
                                      {field.role}
                                    </span>

                                    {field.isPerformed === "performed" ||
                                    field.comments?.trim() !== "" ? (
                                      <>
                                        {/* ✅ Completed Icon */}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-4 h-4 text-green-500"
                                          fill="currentColor"
                                          viewBox="0 0 16 16"
                                        >
                                          <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5z" />
                                          <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0" />
                                        </svg>

                                        {field.comments?.trim() !== "" && (
                                          <span className="text-gray-400 text-xs">
                                            Comments: {field.comments}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {/* ⏳ Pending Icon */}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-4 h-4 text-blue-300"
                                          fill="currentColor"
                                          viewBox="0 0 16 16"
                                        >
                                          <path d="M2 14.5a.5.5 0 0 0 .5.5h11a.5.5 0 1 0 0-1h-1v-1a4.5 4.5 0 0 0-2.557-4.06c-.29-.139-.443-.377-.443-.59v-.7c0-.213.154-.451.443-.59A4.5 4.5 0 0 0 12.5 3V2h1a.5.5 0 0 0 0-1h-11a.5.5 0 0 0 0 1h1v1a4.5 4.5 0 0 0 2.557 4.06c.29.139.443.377.443.59v.7c0 .213-.154.451-.443.59A4.5 4.5 0 0 0 3.5 13v1h-1a.5.5 0 0 0-.5.5m2.5-.5v-1a3.5 3.5 0 0 1 1.989-3.158c.533-.256 1.011-.79 1.011-1.491v-.702s.18.101.5.101.5-.1.5-.1v.7c0 .701.478 1.236 1.011 1.492A3.5 3.5 0 0 1 11.5 13v1z" />
                                        </svg>
                                      </>
                                    )}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* stepper */}

                        <div className="grid md:grid-cols-1 text-sm text-white">
                          <AlertStepper assignedTo={input.assignedTo} />
                        </div>
                        {/* stepper */}

                        {Array.isArray(input.fieldsToFill) &&
                        input.fieldsToFill.length > 0 &&
                        Array.isArray(input.escalationToOtherUsersRole) &&
                        input.escalationToOtherUsersRole.length > 0 ? (
                          // ✅ Disabled Verdict Switch
                          <div className="flex flex-wrap items-center gap-2 ">
                            {/* Verdict Label */}
                            <label className="font-medium text-sm text-gray-200 flex items-center">
                              Verdict{" "}
                              <span className="text-red-500 text-lg ml-1">
                                *
                              </span>
                            </label>

                            {/* Switch with text */}
                            <label className="flex items-center cursor-not-allowed opacity-60 space-x-2">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                disabled
                                checked={input.verdict === "true_positive"}
                                onChange={(e) =>
                                  setInput((prev) => ({
                                    ...prev,
                                    verdict: e.target.checked
                                      ? "true_positive"
                                      : "false_positive",
                                  }))
                                }
                              />

                              {/* Switch */}
                              <div className="relative w-10 h-5 bg-gray-400 rounded-full transition-all duration-300 peer-checked:bg-green-500 flex-shrink-0">
                                <div className="absolute top-[2px] left-[2px] bg-white rounded-full h-4 w-4 transition-all peer-checked:translate-x-5"></div>
                              </div>
                            </label>
                            {/* Text label */}
                            <span className="text-sm text-gray-300 leading-none">
                              {input.verdict === "true_positive"
                                ? "True Positive"
                                : "False Positive"}
                            </span>
                          </div>
                        ) : (
                          // ✅ Active Verdict Switch
                          <div className="flex items-center gap-2">
                            <label className="font-medium text-sm text-yellow-600 flex items-center">
                              Verdict{" "}
                              <span className="text-red-500 text-lg ml-1">
                                *
                              </span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={input.verdict === "true_positive"}
                                onChange={(e) =>
                                  setInput((prev) => ({
                                    ...prev,
                                    verdict: e.target.checked
                                      ? "true_positive"
                                      : "false_positive",
                                  }))
                                }
                              />
                              <div className="relative w-10 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-all duration-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                            </label>
                            <span className="text-sm text-gray-200">
                              {input.verdict === "true_positive"
                                ? "True Positive"
                                : "False Positive"}
                            </span>
                          </div>
                        )}

                        {input.verdict === "true_positive" && (
                          <div className="mt-4 border border-gray-700 rounded-xl p-4 bg-gray-900/40 shadow-lg">
                            <h5 className="text-lg font-semibold !text-yellow-600 mb-2">
                              TP Case Details
                            </h5>
                            <hr className="!border-amber-200 mb-3" />

                            {/* 🧾 Case Details */}
                            <div className="mb-3">
                              <label className="flex items-center gap-1 font-medium text-gray-200">
                                <span className="flex flex-center gap-1">
                                  Case Details{" "}
                                  <span className="text-red-500 text-lg">
                                    *
                                  </span>
                                  <div className="relative group">
                                    <i className="fa-solid fa-circle-info text-gray-400 text-sm cursor-pointer"></i>
                                    <div className="absolute hidden group-hover:block bg-gray-800 text-gray-200 text-xs rounded-md p-2 w-64 z-20 left-5 top-0 shadow-lg">
                                      Fill up this field with the 5WH pattern:
                                      <strong>
                                        {" "}
                                        Who, What, When, Where, Why, How
                                      </strong>
                                    </div>
                                  </div>
                                </span>
                              </label>

                              <textarea
                                rows={8}
                                name="caseDetails"
                                value={input.caseDetails}
                                disabled={
                                  input.fieldsToFill?.length > 0 &&
                                  input.escalationToOtherUsersRole?.length > 0
                                }
                                onChange={(e) => {
                                  handleInputChange(e);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Explain Case Details..."
                                className={`w-full mt-2 rounded-lg border ${
                                  isFpValid
                                    ? "border-green-500"
                                    : "border-red-500"
                                } bg-transparent text-gray-200 p-3 text-sm resize-none focus:ring-1 focus:ring-cyan-500 focus:outline-none`}
                              />
                            </div>

                            {/* 📁 TP Upload Evidence */}
                            <div className="mb-3">
                              <label className="block font-medium text-gray-200 mb-2">
                                TP Upload Evidence
                              </label>
                              <input
                                type="file"
                                ref={fileInputRef}
                                name="files"
                                multiple
                                disabled={
                                  input.fieldsToFill?.length > 0 &&
                                  input.escalationToOtherUsersRole?.length > 0
                                }
                                onChange={handleMultipleFilesChange}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                className="w-full border border-gray-600 bg-transparent rounded-lg p-2 text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 transition"
                              />

                              {/* 📄 File List */}
                              <div className="flex flex-wrap gap-5 mt-3">
                                {tpEvidenceFiles.map((file, index) => (
                                  <div
                                    key={index}
                                    className="relative border border-gray-700 rounded-lg p-3 w-28 text-center hover:bg-gray-800/60 transition"
                                  >
                                    <div
                                      className="cursor-pointer"
                                      onClick={() =>
                                        input.fieldsToFill?.length > 0
                                          ? handleFileShowToOtherTab(file)
                                          : handleFileShow(file)
                                      }
                                    >
                                      <img
                                        src={pdf}
                                        alt="pdf"
                                        className="mx-auto w-8 h-8 mb-1"
                                      />
                                      <p className="text-xs text-gray-300 truncate">
                                        {file.name || file}
                                      </p>
                                    </div>
                                    <i
                                      className={`fa fa-times absolute top-1 right-1 text-red-500 text-xs cursor-pointer ${
                                        input.fieldsToFill?.length > 0
                                          ? "opacity-50"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        !(input.fieldsToFill?.length > 0) &&
                                        removeFile(index)
                                      }
                                    ></i>
                                  </div>
                                ))}
                              </div>

                              {/* PDF Preview */}
                              {showPdf && pdfUrl && (
                                <div className="relative mt-6">
                                  <button
                                    onClick={handleClosePdf}
                                    className="absolute top-1 right-2 text-white text-xl cursor-pointer"
                                  >
                                    &times;
                                  </button>
                                  <iframe
                                    title="pdfViewer"
                                    src={pdfUrl}
                                    className="w-full h-[500px] border border-gray-700 rounded-lg"
                                  />
                                </div>
                              )}
                            </div>

                            {/* ⚡ TP Impact */}
                            <div className="mb-4">
                              <label className="block font-medium text-gray-200 mb-2">
                                TP Impact{" "}
                                <span className="text-red-500 text-lg">*</span>
                              </label>
                              <select
                                name="tpImpact"
                                value={input.tpImpact}
                                onChange={handleSelectChange}
                                disabled={
                                  input.fieldsToFill?.length > 0 &&
                                  input.escalationToOtherUsersRole?.length > 0
                                }
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-300 text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                              >
                                <option value="Choose">Choose...</option>
                                <option value="Ransomware Encryption">
                                  Ransomware Encryption
                                </option>
                                <option value="Data Exfiltration">
                                  Data Exfiltration
                                </option>
                                <option value="Unauthorized Privilege Escalation">
                                  Unauthorized Privilege Escalation
                                </option>
                                <option value="Phishing Campaign">
                                  Phishing Campaign
                                </option>
                                <option value="Insider Data Theft">
                                  Insider Data Theft
                                </option>
                                <option value="DDoS Attack">DDoS Attack</option>
                                <option value="Malware Outbreak">
                                  Malware Outbreak
                                </option>
                                <option value="Credential Stuffing">
                                  Credential Stuffing
                                </option>
                                <option value="Misconfigured Cloud Storage">
                                  Misconfigured Cloud Storage
                                </option>
                                <option value="Zero-Day Exploit">
                                  Zero-Day Exploit
                                </option>
                                <option value="Unpatched Critical Vulnerability">
                                  Unpatched Critical Vulnerability
                                </option>
                                <option value="SQL Injection">
                                  SQL Injection
                                </option>
                                <option value="Compromised API Keys">
                                  Compromised API Keys
                                </option>
                                <option value="Business Email Compromise (BEC">
                                  Business Email Compromise (BEC)
                                </option>
                                <option value="Lateral Movement">
                                  Lateral Movement
                                </option>
                                <option value="Cryptojacking">
                                  Cryptojacking
                                </option>
                                <option value="DNS Hijacking">
                                  DNS Hijacking
                                </option>
                                <option value="Log Tampering">
                                  Log Tampering
                                </option>
                                <option value="Shadow IT Usage">
                                  Shadow IT Usage
                                </option>
                                <option value="Third-Party Breach">
                                  Third-Party Breach
                                </option>
                                <option value="Malicious Insider Sabotage">
                                  Malicious Insider Sabotage
                                </option>
                                <option value="IoT Device Compromise">
                                  IoT Device Compromise
                                </option>
                                <option value="Social Engineering Attack">
                                  Social Engineering Attack
                                </option>
                                <option value="Rogue Device on Network">
                                  Rogue Device on Network
                                </option>
                                <option value="Data Corruption">
                                  Data Corruption
                                </option>
                                <option value="Unauthorized Remote Access">
                                  Unauthorized Remote Access
                                </option>
                                <option value="Supply Chain Attack">
                                  Supply Chain Attack
                                </option>
                                <option value="Email Spoofing">
                                  Email Spoofing
                                </option>{" "}
                                <option value="Adware/PUP Installation">
                                  Adware/PUP Installation
                                </option>
                                <option value="Policy Violation (Low-Risk)">
                                  Policy Violation (Low-Risk)
                                </option>
                              </select>
                            </div>

                            {/* 🧠 TP Remediation Actions */}
                            <div className="mb-3">
                              <label className="block font-medium text-gray-200 mb-2">
                                TP Remediation Actions{" "}
                                <span className="text-red-500 text-lg">*</span>
                              </label>
                              <textarea
                                rows={3}
                                name="tpRemedationNote"
                                value={input.tpRemedationNote}
                                disabled={
                                  input.fieldsToFill?.length > 0 &&
                                  input.escalationToOtherUsersRole?.length > 0
                                }
                                onChange={(e) => {
                                  handletpRemedationNoteChange(e);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="TP Remediation Suggestion"
                                className="w-full rounded-lg border border-gray-600 bg-transparent text-gray-200 p-3 text-sm resize-none focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                              />
                            </div>

                            {/* 🚀 Escalation Switch */}
                            <div className="mb-4 flex items-center gap-3">
                              <label className="font-medium text-gray-200">
                                Escalation Required?{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={input.escalation === "yes"}
                                  onChange={(e) =>
                                    setInput((prev) => ({
                                      ...prev,
                                      escalation: e.target.checked
                                        ? "yes"
                                        : "no",
                                    }))
                                  }
                                />
                                <div className="w-10 h-5 bg-gray-400 rounded-full peer-checked:bg-green-500 transition-all duration-300 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                              <span className="text-sm text-gray-300">
                                {input.escalation === "yes"
                                  ? "Escalated"
                                  : "Not Escalated"}
                              </span>
                            </div>

                            {/* forword To Section start  */}

                            {alertView?.fieldsToFill?.length === 0 && (
                              <>
                                {/* Forward To Dropdown */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-2">
                                    Forward To
                                  </label>
                                  <Select
                                    className="text-sm"
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // Tailwind gray-800
                                        borderColor: "#374151", // Tailwind gray-700
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
                                    isMulti
                                    isClearable
                                    options={options}
                                    value={input.forwardTo}
                                    onChange={handleSelectChange2}
                                  />
                                </div>

                                {/* Dynamic Role Fields */}
                                {Array.isArray(selectedUserRole) &&
                                  selectedUserRole.map((item) => (
                                    <div key={item.value} className="mb-2">
                                      <label className="block text-tomato-400 font-medium mb-2 text-red-400">
                                        {`${item.value}: Actions Need to Perform`}
                                      </label>
                                      <textarea
                                        rows={8}
                                        value={
                                          input.needToDo?.[item.value] || ""
                                        }
                                        onChange={(e) => {
                                          handleNeedToDoChange(
                                            item.value,
                                            e.target.value,
                                          );
                                          e.target.style.height = "auto";
                                          e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        placeholder="Write down what should be done..."
                                        className="w-full border border-gray-600 bg-transparent text-gray-200 p-3 text-sm rounded-lg resize-none focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                      />
                                    </div>
                                  ))}
                              </>
                            )}

                            {/* forword To Section end */}

                            {/* 🔻 Escalation Details */}
                            {input.escalation === "yes" && (
                              <div className="mt-4 border border-gray-700 rounded-lg p-4 bg-gray-800/40">
                                <h5 className="text-lg font-semibold !text-yellow-600 mb-2">
                                  Escalation Details
                                </h5>
                                <hr className="border-gray-700 mb-3" />

                                <label className="block text-gray-200 mb-2">
                                  Reason for Escalation{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  rows={3}
                                  name="escalationReason"
                                  value={input.escalationReason}
                                  onChange={(e) =>
                                    setInput({
                                      ...input,
                                      escalationReason: e.target.value,
                                    })
                                  }
                                  placeholder="Please explain..."
                                  className="w-full border border-gray-600 rounded-lg p-3 bg-transparent text-gray-200 text-sm resize-none focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* false positive */}
                        {input.verdict === "false_positive" && (
                          <div className="mt-4 border border-gray-700 rounded-xl p-4 bg-gray-900/40 shadow-lg transition-all duration-300">
                            {/* Header */}
                            <h5 className="text-lg font-semibold !text-yellow-600 mb-2">
                              FP Case Details
                            </h5>
                            <hr className="!border-amber-200 mb-3" />

                            {/* Forward To (only if not escalated or filled) */}
                            {!(
                              Array.isArray(input.fieldsToFill) &&
                              input.fieldsToFill.length > 0 &&
                              Array.isArray(input.escalationToOtherUsersRole) &&
                              input.escalationToOtherUsersRole.length > 0
                            ) && (
                              <>
                                {/* Forward To Dropdown */}
                                <div className="mb-4">
                                  <label className="block text-gray-200 font-medium mb-2">
                                    Forward To
                                  </label>
                                  <Select
                                    className="text-sm"
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        backgroundColor: "#1f2937", // Tailwind gray-800
                                        borderColor: "#374151", // Tailwind gray-700
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
                                    isMulti
                                    isClearable
                                    options={options}
                                    value={input.forwardTo}
                                    onChange={handleSelectChange2}
                                  />
                                </div>

                                {/* Dynamic Role Fields */}
                                {Array.isArray(selectedUserRole) &&
                                  selectedUserRole.map((item) => (
                                    <div key={item.value} className="mb-2">
                                      <label className="block text-tomato-400 font-medium mb-2 text-red-400">
                                        {`${item.value}: Actions Need to Perform`}
                                      </label>
                                      <textarea
                                        rows={8}
                                        value={
                                          input.needToDo?.[item.value] || ""
                                        }
                                        onChange={(e) => {
                                          handleNeedToDoChange(
                                            item.value,
                                            e.target.value,
                                          );
                                          e.target.style.height = "auto";
                                          e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        placeholder="Write down what should be done..."
                                        className="w-full border border-gray-600 bg-transparent text-gray-200 p-3 text-sm rounded-lg resize-none focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                      />
                                    </div>
                                  ))}
                              </>
                            )}

                            {selectedUserRole?.length === 0 && (
                              <>
                                {/* FP Closure Note */}
                                <div className="mt-4">
                                  <label className="flex items-center justify-between font-medium text-gray-200 mb-2">
                                    <span>FP Closure Note</span>
                                    <small
                                      className={`text-xs ${
                                        wordCount === 50
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }`}
                                    >
                                      ({wordCount}/50 words)
                                    </small>
                                  </label>

                                  <textarea
                                    rows={8}
                                    value={input?.fpNote || ""}
                                    onChange={(e) => {
                                      handleFpNoteChange(e);
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Explain why it's a false positive... (approx. 50 words)"
                                    className={`w-full border ${
                                      isFpValid
                                        ? "border-green-500"
                                        : "border-red-500"
                                    } bg-transparent text-gray-200 p-3 text-sm rounded-lg resize-none focus:ring-1 focus:ring-cyan-500 focus:outline-none`}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Forward to L1 Assignee */}
                        {alertView.incidentDeclarationRequired === "no" && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-5"
                          >
                            <hr className="my-3" />
                            <h6 className="text-red-600 font-semibold mb-2">
                              Details Forward to L1 Assignee
                            </h6>
                            <div className="text-sm space-y-2 text-white">
                              <div>
                                <strong>Hand Back To L1 Assignee:</strong>{" "}
                                {alertView.handBackToL1Assignee}
                              </div>
                              <div>
                                <strong>Investigation End Time:</strong>{" "}
                                {formatDateTimeReadable(
                                  alertView.investigationEndTime,
                                )}
                              </div>
                              <div>
                                <strong>Hand Back Note to L1 Assignee:</strong>{" "}
                                {alertView.handBackNoteToL1}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {(user.role === "Level_1" ||
                          input.incidentDeclarationRequired === "yes" ||
                          input.incidentDeclarationRequired === "no") && (
                          <div className="flex flex-col md:flex-row gap-3 mt-5">
                            {/* Forward / Submit Button */}
                            {input.forwardTo?.length > 0 ? (
                              <button
                                onClick={handleForwardTo}
                                type="submit"
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center transition-colors duration-200 cursor-pointer"
                              >
                                <i
                                  className="fa fa-thumbs-up mr-2"
                                  aria-hidden="true"
                                ></i>
                                {alertLoader ? "Forwarding..." : "Forward To"}
                              </button>
                            ) : (
                              <button
                                type="submit"
                                disabled={
                                  input.verdict === "false_positive" &&
                                  !isFpValid
                                }
                                className={`flex-1 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                                  input.verdict === "false_positive"
                                    ? isFpValid
                                      ? "bg-teal-600 hover:bg-teal-700"
                                      : "bg-gray-500 cursor-not-allowed"
                                    : "bg-teal-600 hover:bg-teal-700"
                                }`}
                              >
                                <i
                                  className="fa fa-thumbs-up mr-2"
                                  aria-hidden="true"
                                ></i>
                                {alertLoader ? "Submitting..." : "Submit"}
                              </button>
                            )}

                            {/* Save as Draft Button */}
                            <button
                              type="button"
                              onClick={handleSaveData}
                              disabled={selectedUserRole?.length > 0}
                              className={`flex-1 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200 cursor-pointer ${
                                selectedUserRole?.length > 0
                                  ? "bg-gray-500 cursor-not-allowed"
                                  : "bg-cyan-600 hover:bg-cyan-700"
                              }`}
                            >
                              Save as Draft
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}
            </div>
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

export default SelfAssigned;
