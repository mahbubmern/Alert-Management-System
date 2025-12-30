import { useLocation } from "react-router-dom";
import { createBreadCrumb } from "../../helpers/helpers";

const Breadcrumb = () => {
  const { pathname } = useLocation();

  return (
    <>
      <nav
        aria-label="breadcrumb"
        className="bg-gray-900 text-gray-300 rounded-lg pb-5 w-full"
      >
        <ol className="flex flex-wrap items-center space-x-2 text-md md:text-base">
          <li>
            <a
              href="/dashboard"
              className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
            >
              Dashboard
            </a>
          </li>

          <li>
            <span className="text-gray-500">/</span>
          </li>

          <li
            className="text-gray-300 font-medium capitalize truncate max-w-[150px] sm:max-w-[300px]"
            aria-current="page"
          >
            {createBreadCrumb(pathname.split("/").pop())}
          </li>
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;
