import { Helmet } from "react-helmet";
import favicon from "../../assets/frontend/img/sonali-bank-logo.png";

const Title = ({ title }) => {
  return (
    <div>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <link rel="canonical" href="http://mysite.com/example" />
        <link rel="shortcut icon" href={favicon} type="image/x-icon" />
      </Helmet>
    </div>
  );
};

export default Title;
