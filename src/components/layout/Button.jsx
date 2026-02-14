const Button = ({ children, ...props }) => {
  return (
    <div className="grid place-items-center">
      <button
        {...props}
        className="w-half mx-auto flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {children}
      </button>
    </div>
  );
};

export default Button;
