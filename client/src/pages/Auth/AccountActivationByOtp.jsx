import { Link, useNavigate } from "react-router-dom";
import otpImage from "../../assets/frontend/img/otp.png";
// import Cookies from "universal-cookie";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authSelector, setEmptyMessage } from "../../features/auth/authSlice";
import { useForm } from "../../hooks/useForm";
import createToast from "../../utils/createToast";
import { accountActivation } from "../../features/auth/authApiSlice";
import Title from "../../components/Title/Title";

const AccountActivationByOtp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, error, message } = useSelector(authSelector);
  // const [formAction, setFormAction] = useState("");

  const { input, handleInputChange, formReset } = useForm({
    otp: "",
  });

  // useEffect(() => {
  //   const activationToken = new Cookies().get("activationToken");
  //   if (activationToken) {
  //     setFormAction(
  //       `http://localhost:5050/api/v1/auth/account-activate-by-otp/${activationToken}`
  //     );
  //   }
  // }, []);

  const handleOTP = (e) => {
    e.preventDefault();
    // Dispatching the accountActivation action with the token included in the request body
    // const activationToken = new Cookies().get("activationToken");
    // if (activationToken) {
    // }
    dispatch(accountActivation(input));
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
      dispatch(formReset);
    }
  }, [message, error, dispatch, formReset, navigate]);

  return (
    <>
    <Title title={"TMS | Account Activation"} />



      <div className="min-h-screen flex items-center justify-center bg-gray-900">
  <div className="w-full max-w-4xl flex flex-col md:flex-row bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
    {/* Left side - Image */}
    <div className="md:w-1/2 flex items-center justify-center bg-gray-700 p-6">
      <img src={otpImage} alt="Logo" className="w-3/4 md:w-full object-contain" />
    </div>

    {/* Right side - Form */}
    <div className="md:w-1/2 p-8 flex flex-col justify-center">
      <h1 className="text-xl font-semibold !text-gray-400 mb-2">Account Activation By OTP</h1>
      <p className="text-gray-400 mb-6">Enter your OTP</p>

      <form onSubmit={handleOTP} className="space-y-4">
        {/* OTP Input */}
        <div>
          <input
            type="text"
            name="otp"
            value={input.otp}
            onChange={handleInputChange}
            placeholder="OTP"
            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Resend OTP Link */}
      <div className="text-center mt-4 text-gray-400 text-sm">
        Need Resend Activation OTP?{" "}
        <Link to="/resend-activation-link" className="text-cyan-400 hover:underline">
          Click
        </Link>
      </div>
    </div>
  </div>
</div>

    </>
  );
};

export default AccountActivationByOtp;


      // <div className="main-wrapper login-body">
      //   <div className="login-wrapper">
      //     <div className="container">
      //       <div className="loginbox">
      //         <div className="login-left">
      //           <img className="img-fluid" src={otpImage} alt="Logo" />
      //         </div>
      //         <div className="login-right">
      //           <div className="login-right-wrap">
      //             <h1>Account Activation By OTP</h1>
      //             <p className="account-subtitle">Enter your OTP</p>
      //             <form onSubmit={handleOTP}>
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
      //               <div className="mb-0">
      //                 <button className="btn btn-primary w-100">
      //                   {loader ? "Checking..." : "Submit"}
      //                 </button>
      //               </div>
      //             </form>
      //             <div className="text-center dont-have">
      //               Need Resend Activation OTP?{" "}
      //               <Link to="/resend-activation-link">Click</Link>
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   </div>
      // </div>
