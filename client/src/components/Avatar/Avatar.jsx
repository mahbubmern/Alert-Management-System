import avatar from "../../../src/assets/frontend/img/Avatar.png";

const Avatar = ({ url, className, width, height, alt }) => {
  return (
    <>
        <img
      src={url || avatar}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
      
    </>
  );
};

export default Avatar;

