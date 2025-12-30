import { Link, useNavigate } from "react-router-dom";
import resetpasswordicon from "../../assets/frontend/img/resetpasswordicon.png";
import { useDispatch, useSelector } from "react-redux";
import { authSelector, setEmptyMessage } from "../../features/auth/authSlice";
import { useForm } from "../../hooks/useForm";
import { useEffect } from "react";
import createToast from "../../utils/createToast";
import { retrievePasswordByOTP } from "../../features/auth/authApiSlice";
import Title from "../../components/Title/Title";

const RetrievePasswordByOtp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, error, message } = useSelector(authSelector);

  const { input, handleInputChange, formReset } = useForm({
    otp: "",
    password: "",
  });

  const handleForgotPasswordByOTP = (e) => {
    e.preventDefault();
    dispatch(retrievePasswordByOTP(input));
  };

  useEffect(() => {
    if (message) {
      createToast(message, "success");
      dispatch(setEmptyMessage());
      dispatch(formReset);
      navigate("/login");
    }
    if (error) {
      createToast(error);
      dispatch(setEmptyMessage());
    }
  }, [message, error, dispatch, formReset, navigate]);

  return (
    <>
      <Title title={"TMS | Retrieve Password By OTP"} />
      {/* Main Wrapper */}

      <div className="min-h-screen flex items-center justify-center bg-gray-900">
  <div className="w-full max-w-4xl flex flex-col md:flex-row bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
    
    {/* Left Side - Image */}
    <div className="md:w-1/3 flex items-center justify-center bg-gray-700 p-6">
      <img
        src={resetpasswordicon}
        alt="Logo"
        className="w-3/4 md:w-full object-contain"
      />
    </div>

    {/* Right Side - Form */}
    <div className="md:w-1/2 p-8 flex flex-col justify-center">
      <h1 className="text-xl font-semibold !text-gray-400 mb-2">
        Retrieve Password By OTP
      </h1>
      <p className="text-gray-400 mb-6">Enter your OTP and Password</p>

      {/* Form */}
      <form onSubmit={handleForgotPasswordByOTP} className="space-y-4">
        {/* OTP Field */}
        <div>
          <input
            type="text"
            placeholder="OTP"
            name="otp"
            value={input.otp}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Password Field */}
        <div>
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={input.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            {loader ? "Checking..." : "Submit"}
          </button>
        </div>
      </form>
      {/* /Form */}

      {/* Login Link */}
      <div className="text-center mt-4 text-gray-400 text-sm">
        Remember your password?{" "}
        <Link to="/login" className="text-cyan-400 hover:underline">
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

export default RetrievePasswordByOtp;


      // <div className="main-wrapper login-body">
      //   <div className="login-wrapper">
      //     <div className="container">
      //       <div className="loginbox">
      //         <div className="login-left">
      //           <img className="img-fluid" src={resetpasswordicon} alt="Logo" />
      //         </div>
      //         <div className="login-right">
      //           <div className="login-right-wrap">
      //             <h1>Retrieve Password By OTP</h1>
      //             <p className="account-subtitle">
      //               Enter your OTP and Password
      //             </p>
      //             {/* Form */}

      //             <form onSubmit={handleForgotPasswordByOTP}>
      //               <div className="mb-3">
      //                 <input
      //                   className="form-control"
      //                   type="text"
      //                   placeholder="OTP"
      //                   name="otp"
      //                   value={input.otp}
      //                   onChange={handleInputChange}
      //                 />
      //               </div>
      //               <div className="mb-3">
      //                 <input
      //                   className="form-control"
      //                   type="password"
      //                   placeholder="Password"
      //                   name="password"
      //                   value={input.password}
      //                   onChange={handleInputChange}
      //                 />
      //               </div>
      //               <div className="mb-0">
      //                 <button className="btn btn-primary w-100">
      //                   {loader ? "Checking..." : "Submit"}
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
