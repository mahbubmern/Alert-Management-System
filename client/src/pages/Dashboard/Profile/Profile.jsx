import Breadcrumb from "../../../components/Breadcrumb/Breadcrumb";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { authSelector } from "../../../features/auth/authSlice";

import { setEmptyMessage } from "../../../features/userCred/userCredSlice";

import {
  setPersonalEmptyMessage,
  userPersonalSelector,
} from "../../../features/userPersonal/userPersonalSlice";
import Avatar from "../../../components/Avatar/Avatar";


import { useForm } from "../../../hooks/useForm";
import createToast from "../../../utils/createToast";
import { userCredSelector } from "../../../features/userCred/userCredSlice";
import { updateUserCred } from "../../../features/userCred/userCredApiSlice";
import { updateUserPersonal } from "../../../features/userPersonal/userPersonalApiSlice";
import { updateUserPhoto } from "../../../features/userPhoto/userPhotoApiSlice";
import {
  setPhotoEmptyMessage,
  userPhotoSelector,
} from "../../../features/userPhoto/userPhotoSlice";
import axios from "axios";
import API from "../../../utils/api";
import Title from "../../../components/Title/Title";
import { X } from "lucide-react";

const Profile = () => {
  const { user } = useSelector(authSelector);
  const { message, error } = useSelector(userCredSelector);
  const { personalmessage, personalerror } = useSelector(userPersonalSelector);
  const { photomessage, photoerror } = useSelector(userPhotoSelector);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const [selectedFile, setSelectedFile] = useState(null);
  const dispatch = useDispatch();

  // change password
  const { input, handleInputChange, formReset } = useForm({
    _id: user._id,
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // change details Start

  const [personalInput, setPersonalInput] = useState({
    _id: user._id,
    division: "",
    department: "",
    phone: "",
    designation: "",
  });

  // change photo input
  const [image, setImage] = useState();

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!validTypes.includes(file.type)) {
      createToast("Only Supported for Image Format (JPEG, JPG, PNG)");
      e.target.value = ""; // reset input
      return;
    }

    setSelectedFile(file);
    setImage(file);
  };

  const handlePhotoChangeModal = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("photo", image);
    await API.patch(`/api/v1/userphoto/${user._id}`, formData)
      .then((res) => {})
      .catch((err) => console.log(err));

    closeModal();
  };

  useEffect(() => {
    if (photomessage) {
      createToast(photomessage, "success");
      dispatch(setPhotoEmptyMessage());
    }
    if (photoerror) {
      createToast(photoerror);
      dispatch(setPhotoEmptyMessage());
    }
  }, [photomessage, photoerror, dispatch]);

  const handlePersonalInputChange = (e) => {
    setPersonalInput((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePersonalDetailForm = (e) => {
    e.preventDefault();
    dispatch(updateUserPersonal(personalInput));
  };
  //Change personal Change Use Effect
  useEffect(() => {
    if (personalmessage) {
      createToast(personalmessage, "success");
      dispatch(setPersonalEmptyMessage());
      PersonalInputformReset();
      personalEditCloseModal();
    }
    if (personalerror) {
      createToast(personalerror);
      dispatch(setPersonalEmptyMessage());
    }
  }, [personalmessage, personalerror, dispatch]);

  // form Reset
  const PersonalInputformReset = () => {
    setPersonalInput({
      division: "",
      department: "",
      phone: "",
      designation: "",
    });
  };
  // change details End

  // const [input, setInput] = useState({
  //   id: '',
  //   photo: null,
  // });

  // change password handler

  const changePassword = (e) => {
    e.preventDefault();
    dispatch(updateUserCred(input));
  };

  useEffect(() => {
    if (message) {
      createToast(message, "success");
      dispatch(setEmptyMessage());
      dispatch(formReset);
    }
    if (error) {
      createToast(error);
      dispatch(setEmptyMessage());
    }
  }, [message, error, dispatch, formReset]);

  const modalOpen = () => {
    // open the modal
    setIsModalOpen(true);
  };

  const personalEditModalOpen = () => {
    // open the modal
    setPersonalModalOpen(true);
  };

  const closeModal = () => {
    // Close the modal
    setIsModalOpen(false);
  };

  const personalEditCloseModal = () => {
    // Close the modal
    setPersonalModalOpen(false);
  };
  return (
    <>
      <Title title={"TMS | Profile"} />
    
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
          {/* Page Header */}
          <div className="mb-6">
            <Breadcrumb />
          </div>

          {/* Profile Header */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg transition hover:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Left Side - Profile Info */}
              <div className="flex items-center gap-4">
                <div className="w-full h-full sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-gray-700">
                  <Avatar
                    url={user.photo && user.photo}
                    className="w-full h-full"
                    height="100%"
                    width="100%"
                  />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{user.name}</h2>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  {user.division && (
                    <p className="text-sm mt-1 text-gray-400">
                      <i className="fa-solid fa-location-dot mr-1 text-emerald-500" />
                      {user.division}
                    </p>
                  )}
                </div>
              </div>

              {/* Change Photo Button */}
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={modalOpen}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Change Profile Photo
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-gray-700">
            <ul className="flex flex-wrap text-sm font-medium text-gray-400">
              <li>
                <button
                  className={`px-4 py-2 rounded-t-lg cursor-pointer ${
                    activeTab === "about"
                      ? "text-emerald-400 border-b-2 border-emerald-500 "
                      : "hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("about")}
                >
                  About
                </button>
              </li>
              <li>
                <button
                  className={`px-4 py-2 rounded-t-lg cursor-pointer ${
                    activeTab === "password"
                      ? "text-emerald-400 border-b-2 border-emerald-500"
                      : "hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("password")}
                >
                  Password
                </button>
              </li>
            </ul>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "about" && (
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Personal Details</h3>
                  <button
                    onClick={personalEditModalOpen}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-sm transition cursor-pointer"
                  >
                    Add More Details
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 sm:grid-cols-4">
                    <span className="text-gray-400">Name</span>
                    <span className="col-span-2 sm:col-span-3">
                      {user.name}
                    </span>
                  </div>
                  {user.designation && (
                    <div className="grid grid-cols-3 sm:grid-cols-4">
                      <span className="text-gray-400">Designation</span>
                      <span className="col-span-2 sm:col-span-3">
                        {user.designation}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4">
                    <span className="text-gray-400">Email</span>
                    <span className="col-span-2 sm:col-span-3">
                      {user.email}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4">
                    <span className="text-gray-400">Index</span>
                    <span className="col-span-2 sm:col-span-3">
                      {user.index}
                    </span>
                  </div>
                  {user.branch && (
                    <div className="grid grid-cols-3 sm:grid-cols-4">
                      <span className="text-gray-400">Division</span>
                      <span className="col-span-2 sm:col-span-3">
                        {user.branch}
                      </span>
                    </div>
                  )}
                  {user.department && (
                    <div className="grid grid-cols-3 sm:grid-cols-4">
                      <span className="text-gray-400">Section</span>
                      <span className="col-span-2 sm:col-span-3">
                        {user.department}
                      </span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="grid grid-cols-3 sm:grid-cols-4">
                      <span className="text-gray-400">Mobile</span>
                      <span className="col-span-2 sm:col-span-3">
                        {user.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-lg mx-auto">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>

                <form onSubmit={changePassword} className="space-y-4">
                  <input type="hidden" name="id" value={user._id} />
                  <div>
                    <label className="text-sm text-gray-400">
                      Old Password
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={input.oldPassword}
                      onChange={handleInputChange}
                      className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={input.newPassword}
                      onChange={handleInputChange}
                      className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={input.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium transition"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Tailwind Modal for Photo */}
          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-[90%] sm:w-[400px]">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={handlePhotoChangeModal}
                  encType="multipart/form-data"
                  className="space-y-4"
                >
                  {selectedFile && (
                    <div className="flex justify-center">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="w-40 h-40 rounded-full object-cover border-4 border-gray-700"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    name="photo"
                    onChange={handleFileChange}
                    className="w-full text-sm bg-gray-700 border mb-4 border-gray-600 rounded-md p-2 cursor-pointer file:mr-3 file:bg-emerald-600 file:text-white file:px-3 file:py-1 file:rounded-md"
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium transition"
                  >
                    Set Photo
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* personal information changes */}
         {personalModalOpen && ( <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3">
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn relative">
              {/* Close button */}
              <div className="flex justify-between align-middle">
                <button
                onClick={personalEditCloseModal}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>

              <div>
                   <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
                Update Personal Details
              </h2>
              </div>

              {/* Header */}
            
              </div>

              {/* Form */}
              <form onSubmit={handlePersonalDetailForm} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={input.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Division/Branch</label>
                  <input
                    type="text"
                    name="division"
                    value={input.division}
                    onChange={handleInputChange}
                    placeholder="Enter your division or branch"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    Department/Section
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={input.department}
                    onChange={handleInputChange}
                    placeholder="Enter your department or section"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg font-medium transition duration-300"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>)}
        </div>
     
    </>
  );
};

export default Profile;
