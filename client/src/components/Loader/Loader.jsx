// Loader.jsx

import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners"; // npm install react-spinners

const Loader = () => {
  const loading = useSelector((state) => state.loader.loading);

  if (!loading) return null;

  return (
    <div
      style={{
        zIndex: "999999999",
        margin: "auto",
        display: "block",
        width: "100%",
        textAlign: "center",
      }}
    >
      <ClipLoader color="#c7753fff" size={30} />
    </div>
  );
};

export default Loader;
