// export private routes

import Dashboard from "../pages/Dashboard/Dashboard";
import Users from "../pages/Dashboard/Users/Users";
// import Department from "../pages/Dashboard/Department/Department";
import Layout from "../components/Layouts/Layout";
import PrivateGuard from "./PrivateGuard";
// import Incoming from "../pages/Dashboard/Incoming/Incoming";
// import Outgoing from "../pages/Dashboard/Outgoing/Outgoing";
import Profile from "../pages/Dashboard/Profile/Profile";
// import TaskList from "../pages/Dashboard/TaskList/TaskList";
// import TodaysIncoming from "../pages/Dashboard/TodaysIncoming/TodaysIncoming";
// import FileManager from "../pages/Dashboard/FileManger/FileManager";
// import SharingFiles from "../components/SharingFiles/SharingFiles";
import SOC_Monitoring_Tools from "../pages/Dashboard/SOC_Monitoring_tools/SOC_Monitoring_Tools";
import CreateAlert from "../pages/Dashboard/CreateAlert/CreateAlert";
import SelfAssigned from "../pages/Dashboard/SelfAssigned/SelfAssigned";
import FollowUpAlert from "../pages/Dashboard/FollowUpAlert/FollowUpAlert";
import Archive from "../pages/Dashboard/Archive/Archive";
import EscalatedAlert from "../pages/Dashboard/EscalatedAlert/EscalatedAlert";
import IncidencePendingStage from "../pages/Dashboard/IncidencePendingStage/IncidencePendingStage";
import IncidenceRegister from "../pages/Dashboard/IncidenceRegister/IncidenceRegister";
import AssignedAlert from "../pages/Dashboard/AssignedAlert/AssignedAlert";
import PendingAlert from "../pages/Dashboard/PendingAlert/PendingAlert";
import Report from "../pages/Dashboard/Report/Report";
import Vulnerability_Management_Portal from "../pages/Dashboard/Vulnerability_Management_Portal/Vulnerability_Management_Portal";

export const privateRoutes = [
  {
    element: <PrivateGuard />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/dashboard",
            element: <Dashboard />,
          },

          {
            path: "/dashboard/users",
            element: <Users />,
          },
          {
            path: "/dashboard/vulnerability_Management_portal",
            element: <Vulnerability_Management_Portal />,
          },

          {
            path: "/dashboard/soc_monitoring_tools",
            element: <SOC_Monitoring_Tools />,
          },
          {
            path: "/dashboard/create_alert",
            element: <CreateAlert />,
          },
          {
            path: "/dashboard/escalated_alert",
            element: <EscalatedAlert />,
          },
          {
            path: "/dashboard/self_assigned",
            element: <SelfAssigned />,
          },
          {
            path: "/dashboard/assigned",
            element: <AssignedAlert />,
          },
          {
            path: "/dashboard/pending",
            element: <PendingAlert />,
          },
          {
            path: "/dashboard/follow_up_alert",
            element: <FollowUpAlert />,
          },
          {
            path: "/dashboard/incidence_pending_stage",
            element: <IncidencePendingStage />,
          },
          {
            path: "/dashboard/incidence_register",
            element: <IncidenceRegister />,
          },
          {
            path: "/dashboard/archive",
            element: <Archive />,
          },
          {
            path: "/dashboard/report",
            element: <Report />,
          },
          {
            path: "/dashboard/settings",
            element: <Profile />,
          },
        ],
      },
    ],
  },
];
