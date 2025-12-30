import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/frontend/img/sonali-bank-logo.png";
import { useDispatch, useSelector } from "react-redux";
import { authSelector, setEmptyMessage } from "../../features/auth/authSlice";
import { useForm } from "../../hooks/useForm";
import { useEffect, useState } from "react";
import createToast from "../../utils/createToast";
import { userLogin } from "../../features/auth/authApiSlice";
import Title from "../../components/Title/Title";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, error, message } = useSelector(authSelector);

  const [showPassword , setShowPassword] = useState(false);

  const { input, handleInputChange, formReset } = useForm({
    index: "",
    password: "",
  });

  const handleLoginForm = (e) => {
    e.preventDefault()
    dispatch(userLogin(input))
 

    // navigate("/account-activation-by-otp");
  };

  // toggle Password

  const togglePassword = () =>{
    setShowPassword(!showPassword)
  }

 useEffect(() => {
  if (message) {
    // Display a success message only if there is a message
    createToast(message, "success"); // Display the success message
    dispatch(setEmptyMessage()); // Clear the message state
    dispatch(formReset); // Reset the form
    navigate('/dashboard'); // Redirect to the dashboard
  }
  if (error) {
    // Display an error message only if there is an error
    createToast(error); // Display the error message
    dispatch(setEmptyMessage()); // Clear the message state
  }
}, [message, error, dispatch, formReset, navigate]);

  return (
    <>
     <Title title={"TMS | Login"} />
      {/* Main Wrapper */}


      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1221] via-[#111a2e] to-[#1e2a47] px-4">
  <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white/5 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-white/10">
    
    {/* Left Section (Logo) */}
    <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-[#111a2e] to-[#0b1221] p-10">
      <img src={logo} alt="Logo" className="w-64 h-auto drop-shadow-lg" />
    </div>

    {/* Right Section (Form) */}
    <div className="w-full md:w-1/2 p-8 sm:p-10 text-white">
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold mb-2">User Login</h1>
        <p className="text-gray-400">Access to Alert Management dashboard</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLoginForm} className="space-y-5">
        {/* Index Input */}
        <div>
          <input
            type="text"
            name="index"
            value={input.index}
            onChange={handleInputChange}
            placeholder="Index"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-100"
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={input.password}
            onChange={handleInputChange}
            placeholder="Password"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-100"
          />
          <button
            type="button"
            onClick={togglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-2 right-3 text-gray-400 hover:text-blue-400 transition"
          >
            {showPassword ? (
              <i className="fa fa-eye"></i>
            ) : (
              <i className="fa fa-eye-slash"></i>
            )}
          </button>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition font-semibold text-white shadow-md"
          >
            {loader ? "Checking..." : "Login"}
          </button>
        </div>
      </form>

      {/* Forgot Password */}
      <div className="text-center mt-4">
        <Link
          to="/forgot-password"
          className="text-sm text-blue-400 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center my-6">
        <span className="w-16 h-px bg-white/20"></span>
        <span className="px-3 text-gray-400 text-sm">or</span>
        <span className="w-16 h-px bg-white/20"></span>
      </div>

      {/* Register */}
      <div className="text-center text-sm">
        Don’t have an account?{" "}
        <Link to="/register" className="text-blue-400 hover:underline">
          Register
        </Link>
      </div>
    </div>
  </div>
</div>

      {/* /Main Wrapper */}
    </>
  );
};

export default Login;


      // <div className="main-wrapper login-body">
      //   <div className="login-wrapper">
      //     <div className="container">
      //       <div className="loginbox">
      //         <div className="login-left">
      //           <img className="img-fluid" src={logo} alt="Logo" />
      //         </div>
      //         <div className="login-right">
      //           <div className="login-right-wrap">
      //             <h1>User Login</h1>
      //             <p className="account-subtitle">Access to DMS dashboard</p>
      //             {/* Form */}
      //           <form onSubmit={handleLoginForm}>
      //             <div className="mb-3">
      //               <input
      //                 className="form-control"
      //                 type="text"
      //                 placeholder="Index"
      //                 name="index"
      //                 value={input.index}
      //                 onChange={handleInputChange}
      //               />
      //             </div>
      //             <div className="mb-3" style={{ position: "relative" }}>
      //                 <input
      //                   className="form-control"
      //                   type={showPassword ? "text" : "password"}
      //                   placeholder="Password"
      //                   name="password"
      //                   value={input.password}
      //                   onChange={handleInputChange}
      //                 />
      //                 <button
      //                   style={{
      //                     border: "none",
      //                     outline: "none",
      //                     backgroundColor: "white",
      //                     position: "absolute",
      //                     top: "5px",
      //                     right: "5px",
      //                     color : '#A8A8A8'
      //                   }}
      //                   type="button"
      //                   onClick={togglePassword}
      //                   aria-label={
      //                     showPassword ? "Hide password" : "Show password"
      //                   }
      //                 >
      //                   {showPassword ? (
      //                     <i className="fa fa-eye"></i>
      //                   ) : (
      //                     <i className="fa fa-eye-slash"></i>
      //                   )}
      //                 </button>
      //               </div>
      //             <div className="mb-3">
      //               <button className="btn btn-primary w-100"> {loader ?  'Checking...' : 'Login'}</button>
      //             </div>
      //             </form>
      //             {/* /Form */}
      //             <div className="text-center forgotpass">
      //               <Link to="/forgot-password">Forgot Password?</Link>
      //             </div>
      //             <div className="login-or">
      //               <span className="or-line" />
      //               <span className="span-or">or</span>
      //             </div>

      //             <div className="text-center dont-have">
      //               Don’t have an account? <Link to="/register">Register</Link>
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   </div>
      // </div>
