const TabNavigation = ({ isLogin, onLoginClick, onRegisterClick }) => {
  return (
    <div className="tab-container">
      <button
        onClick={onLoginClick}
        className={`tab-button ${isLogin ? "active" : "inactive"}`}
      >
        Login
      </button>
      <button
        onClick={onRegisterClick}
        className={`tab-button ${!isLogin ? "active" : "inactive"}`}
      >
        Register
      </button>
    </div>
  );
};

export default TabNavigation;
