// export default Register;

import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/frontend/img/sonali-bank-logo.png";
import { useForm } from "../../hooks/useForm";
import { useDispatch, useSelector } from "react-redux";
import { createUserRegister } from "../../features/auth/authApiSlice";
import { authSelector, setEmptyMessage } from "../../features/auth/authSlice";

import { useEffect, useState } from "react";
import createToast from "../../utils/createToast";
import API from "../../utils/api";
import Title from "../../components/Title/Title";

const stations = [
  {
    name: "Head Office",
    subStations: [
      {
        name: "Head Office",
        division: [
          "99341-Information Security, IT Risk Management & Fraud Control Division",
          "99342-Information Technology Division (Business IT)",
          "99343-Information Technology Division (Infrastructure IT)",
          "99344-Information Technology Division (IT Service Management)",
          "99345-Information Technology Division (IT Procurement)",
          "99346-Card Division",
        ],
      },
    ],
  },
  // {
  //   name: "GMO",
  //   subStations: [
  //     {
  //       name: "Dhaka South",
  //       division: [
  //         "Sadarghat",
  //         "Naya Bazar",
  //         "Bangshal",
  //         "Armanitola",
  //         "Jatrabari",
  //       ],
  //     },
  //     {
  //       name: "Dhaka North",
  //       division: ["Banani", "Dhanmondi", "Gulshan", "Badda", "Kafrul"],
  //     },
  //   ],
  // },
];

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [station, setStation] = useState("");
  const [subStation, setSubStation] = useState("");

  const [division, setDivision] = useState("");

  const [secondStation, setSecondStation] = useState([]);
  // const [thirdStation, setThirdStation] = useState([]);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const [findAdmin, setFindAdmin] = useState(false);
  const { loader, error, message } = useSelector(authSelector);
  const { input, setInput, handleInputChange, formReset } = useForm({
    index: "",
    name: "",
    email: "",
    password: "",
  });

  const handleStationChange = (e) => {
    const selectedStation = e.target.value;
    setStation(selectedStation);
    if (selectedStation !== "-Select-") {
      setSecondStation(
        stations.find((data) => data.name === selectedStation).subStations[0]
          .division
      );
      // setThirdStation([]);
      setInput(() => ({
        branch: "",
      }));
    } else {
      setSecondStation([]);
      setSubStation("");
      // setThirdStation([]);
      setInput(() => ({
        branch: "",
      }));

      // setDivision("");
    }
  };

  // const handleSubStationChange = (e) => {
  //   const selectedSubStation = e.target.value;
  //   setSubStation(selectedSubStation);
  //   if (selectedSubStation !== "-Select-") {
  //     setThirdStation(
  //       secondStation.find((data) => data.name === selectedSubStation).division
  //     );
  //     setDivision("");
  //     setInput((prevState) => ({
  //       ...prevState,
  //       branch: "",
  //     }));
  //   } else {
  //     setInput((prevState) => ({
  //       ...prevState,
  //       branch: "",
  //     }));
  //     setThirdStation([]);
  //   }
  // };

  const handleDivisionChange = (e) => {
    setDivision(e.target.value);
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  const handleRegisterForm = (e) => {
    e.preventDefault();
    dispatch(createUserRegister(input));

    // navigate("/account-activation-by-otp");
  };

  // find Admin User

  useEffect(() => {
    const AdminUser = async () => {
      try {
        const response = await API.get(`/api/v1/user`);
        setFindAdmin(response.data.user.some((user) => user.role === "Admin"));
      } catch (error) {
        throw new Error(error.response.data.message);
      }
    };

    AdminUser();
  }, []);

  useEffect(() => {
    if (message) {
      createToast(message, "success");
      dispatch(setEmptyMessage());
      dispatch(formReset);
      navigate("/account-activation-by-otp");
    }
    if (error) {
      createToast(error);
      dispatch(setEmptyMessage());
    }
  }, [message, error, dispatch, formReset, navigate]);

  return (
    <>
      <Title title={"SEM Solution | Register"} />
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
              <h1 className="text-xl font-semibold mb-2">User Register</h1>
              <p className="text-gray-400">Access to Alert Management</p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterForm} className="space-y-5">
              {/* Station & Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    name="ho"
                    value={station}
                    onChange={(e) => {
                      handleStationChange(e);
                      handleSelectChange(e);
                    }}
                    className="w-full px-4 py-2 bg-gray/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                  >
                    <option className="bg-gray-800">-Select-</option>
                    {stations.map((item, index) => (
                      <option
                        className=" bg-gray-800 text-white"
                        key={index}
                        value={item.name}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    name="branch"
                    value={division}
                    onChange={(e) => {
                      handleDivisionChange(e);
                      handleSelectChange(e);
                    }}
                    className="w-full px-4 py-2 bg-gray/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                  >
                    <option className="bg-gray-800">-Select-</option>
                    {secondStation?.map((item, index) => (
                      <option
                        className=" bg-gray-800 text-white"
                        key={index}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Index & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="index"
                    value={input.index}
                    onChange={handleInputChange}
                    placeholder="Index"
                    className="w-full px-4 py-2 bg-gray/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                  />
                </div>

                <div>
                  <select
                    name="role"
                    value={input.role}
                    onChange={handleSelectChange}
                    className="w-full px-4 py-2 bg-gray/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                  >
                    <option className="bg-gray-800 text-white" value="select">-Select-</option>
                    {!findAdmin && <option className=" bg-gray-800 text-white" value="Admin">Admin</option>}
                    <option className=" bg-gray-800 text-white" value="user">User</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* Name */}
                  <input
                    type="text"
                    name="name"
                    value={input.name}
                    onChange={handleInputChange}
                    placeholder="Name"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                  />
                </div>

                <div>
                  {/* Email */}
                  <input
                    type="text"
                    name="email"
                    value={input.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                  />
                </div>

              
              </div>
               <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={input.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
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
               </div>

            

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition font-semibold text-white shadow-md cursor-pointer"
              >
                {loader ? "Creating..." : "Register"}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center text-sm mt-6 text-gray-400">
              Already have an account?{" "}
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

export default Register;

// <div className="main-wrapper login-body">
//   <div className="login-wrapper">
//     <div className="container">
//       <div className="loginbox">
//         <div className="login-left">
//           <img className="img-fluid" src={logo} alt="Logo" />
//         </div>
//         <div className="login-right">
//           <div
//             className="login-right-wrap"
//             style={{ position: "relative" }}
//           >
//             <h1>User Register</h1>
//             <p className="account-subtitle">Access to SEM Solution</p>
//             {/* Form */}
//             <form onSubmit={handleRegisterForm}>
//               <div className="row">
//                 <div className="col-12 col-md-6">
//                   <div className="mb-3">
//                     <select
//                       className="form-control"
//                       name="ho"
//                       value={station}
//                       onChange={(e) => {
//                         handleStationChange(e);
//                         handleSelectChange(e);
//                       }}
//                     >
//                       <option>-Select-</option>
//                       {stations.map((item, index) => (
//                         <option key={index} value={item.name}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="col-12 col-md-6">
//                   <div className="mb-3">
//                     <select
//                       className="form-control"
//                       name="branch"
//                       value={division}
//                       onChange={(e) => {
//                         handleDivisionChange(e);
//                         handleSelectChange(e);
//                       }}
//                     >
//                       <option>-Select-</option>
//                       {secondStation?.map((item, index) => (
//                         <option key={index} value={item}>
//                           {item}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className="row">
//                 {/* <div className="col-12 col-md-6">
//                   <div className="mb-3">
//                     <select
//                       className="form-control"
//                       name="branch"
//                       value={division}
//                       onChange={(e) => {
//                         handleDivisionChange(e);
//                         handleSelectChange(e);
//                       }}
//                     >
//                       {thirdStation && (
//                         <>
//                           <option>-Select-</option>
//                           {thirdStation.map((item, index) => (
//                             <option key={index} value={item}>
//                               {item}
//                             </option>
//                           ))}
//                         </>
//                       )}
//                     </select>
//                   </div>
//                 </div> */}
//                 <div className="col-12 col-md-6">
//                         <div className="mb-3">
//                         <input
//                           className="form-control"
//                           type="text"
//                           placeholder="Index"
//                           name="index"
//                           value={input.index}
//                           onChange={handleInputChange}
//                         />
//                       </div>
//                 </div>

//                 <div className="col-12 col-md-6">
//                 <div className="mb-3">
//                       <select
//                         className="form-control"
//                         name="role"
//                         value={input.role}
//                         onChange={handleSelectChange}
//                       >
//                         <option value="select">-Select-</option>
//                         {!findAdmin && <option value="Admin">Admin</option>}
//                         <option value="user">User</option>
//                       </select>
//                 </div>

//                 </div>
//               </div>

//               <div className="mb-3">
//                 <input
//                   className="form-control"
//                   type="text"
//                   placeholder="Name"
//                   name="name"
//                   value={input.name}
//                   onChange={handleInputChange}
//                 />
//               </div>
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
//               <div className="mb-3" style={{ position: "relative" }}>
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
//                     color: "#A8A8A8",
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

//               <div className="mb-0">
//                 <button
//                   className="btn btn-primary w-100"
//                   onClick={handleRegisterForm}
//                 >
//                   {loader ? "Creating..." : "Register"}
//                 </button>
//               </div>
//             </form>
//             <div className="text-center dont-have">
//               Already have an account? <Link to="/login">Login</Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// </div>
