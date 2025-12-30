import { Link, useNavigate } from "react-router-dom";

import forgotpasswordicon from "../../assets/frontend/img/forgotpasswordicon.png";
import { useDispatch, useSelector } from "react-redux";
import { authSelector, setEmptyMessage } from "../../features/auth/authSlice";
import { useForm } from "../../hooks/useForm";

import { useEffect } from "react";
import createToast from "../../utils/createToast";
import { forgotPassword } from "../../features/auth/authApiSlice";
import Title from "../../components/Title/Title";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, error, message } = useSelector(authSelector);

  const { input, handleInputChange, formReset } = useForm({
    email: "",
  });

  const handleForgotPassword = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(input));

    // navigate("/account-activation-by-otp");
  };

  useEffect(() => {
    if (message) {
      createToast(message, "success");
      dispatch(setEmptyMessage());
      dispatch(formReset);
      navigate("/retrieve-password-by-otp");
    }
    if (error) {
      createToast(error);
      dispatch(setEmptyMessage());
    }
  }, [message, error, dispatch, formReset, navigate]);

  return (
    <>
     <Title title={"TMS | Forgot Password"} />
      {/* Main Wrapper */}


      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1221] via-[#111a2e] to-[#1e2a47] px-4">
  <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white/5 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-white/10">
    
    {/* Left Section (Icon) */}
    <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-[#111a2e] to-[#0b1221] p-10">
      <img
        src={forgotpasswordicon}
        alt="Forgot Password Icon"
        className="w-70 h-auto drop-shadow-lg"
      />
    </div>

    {/* Right Section (Form) */}
    <div className="w-full md:w-1/2 p-8 sm:p-10 text-white">
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold mb-2">Forgot Password?</h1>
        <p className="text-gray-400">Enter your email to get OTP</p>
      </div>

      {/* Form */}
      <form onSubmit={handleForgotPassword} className="space-y-5">
        <div>
          <input
            type="text"
            name="email"
            value={input.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-100"
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-600 transition font-semibold text-white shadow-md"
          >
            {loader ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm mt-6 text-gray-400">
        Remember your password?{" "}
        <Link to="/login" className="text-blue-400 hover:underline">
          Login
        </Link>
      </div>
    </div>
  </div>
</div>

      {/* /Main Wrapper */}
    </>
  );
};

export default ForgotPassword;



      // <div className="main-wrapper login-body">
      //   <div className="login-wrapper">
      //     <div className="container">
      //       <div className="loginbox">
      //         <div className="login-left">
      //           <img
      //             className="img-fluid"
      //             src={forgotpasswordicon}
      //             alt="Logo"
      //           />
      //         </div>
      //         <div className="login-right">
      //           <div className="login-right-wrap">
      //             <h1>Forgot Password?</h1>
      //             <p className="account-subtitle">
      //               Enter your email to get OTP
      //             </p>
      //             {/* Form */}
      //             <form onSubmit={handleForgotPassword}>
      //               <div className="mb-3">
      //                 <input
      //                   className="form-control"
      //                   type="text"
      //                   placeholder="Email"
      //                   name="email"
      //                   value={input.email}
      //                   onChange={handleInputChange}
      //                 />
      //               </div>
      //               <div className="mb-0">
      //                 <button className="btn btn-primary w-100">
      //                   {loader ? "Submitting..." : "Submit"}
      //                 </button>
      //               </div>
      //             </form>
      //             {/* /Form */}
      //             <div className="text-center dont-have">
      //               Remember your password? <Link to="/login">Login</Link>
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   </div>
      // </div>
