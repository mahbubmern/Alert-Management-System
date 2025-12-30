// export public routes


import AccountActivationByOtp from "../pages/Auth/AccountActivationByOtp";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import Login from "../pages/Auth/Login";
import NewActivationOTP from "../pages/Auth/NewActivationOTP";
import Register from "../pages/Auth/Register";
import RetrievePasswordByOtp from "../pages/Auth/RetrievePasswordByOtp";
import PublicGuard from "./PublicGuard";


export const publicRoutes = [

  {
    element : <PublicGuard/>,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
    
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/retrieve-password-by-otp",
        element: <RetrievePasswordByOtp />,
      },
      {
        path: "/account-activation-by-otp",
        element: <AccountActivationByOtp />,
      },
      {
        path: "/resend-activation-link",
        element: <NewActivationOTP />,
      },
    ]
  }
 

 
];
