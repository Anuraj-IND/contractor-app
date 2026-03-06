const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px' }) => {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        minWidth: width,
        minHeight: height
      }}
    />
  );
};

export default Skeleton;
