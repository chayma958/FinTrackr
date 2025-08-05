import { useContext, useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { TransactionContext } from "@context/TransactionContext";
import { UserContext } from "@context/UserContext";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircle from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import useMediaQuery from "@mui/material/useMediaQuery";
import "@css/Navbar.css";

const Navbar = () => {
  const { token, handleLogout, preferredCurrency, username, loading } =
    useContext(UserContext) || {};
  const { currentDayBalance, lastTransactionAdded } =
    useContext(TransactionContext) || {};

  const [balanceUpdated, setBalanceUpdated] = useState(false);
  const [prevCurrency, setPrevCurrency] = useState(preferredCurrency);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const isExtraSmall = useMediaQuery("(max-width:420px)");

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSettingsClick = () => {
    handleMenuClose();
  };

  const handleLogoutClick = () => {
    handleLogout();
    handleMenuClose();
    handleSidebarClose();
  };

  useEffect(() => {
    if (lastTransactionAdded || preferredCurrency !== prevCurrency) {
      setBalanceUpdated(true);
      setTimeout(() => setBalanceUpdated(false), 1000);
      setPrevCurrency(preferredCurrency);
    }
  }, [lastTransactionAdded, preferredCurrency, prevCurrency]);

  const formatBalance = (balance, currency) => {
    const decimals = currency === "JPY" ? 0 : 2;
    return balance ? balance.toFixed(decimals) : "0.00";
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/dashboard", label: "Add Transaction" },
    { to: "/dashboard/list", label: "Transactions" },
    { to: "/dashboard/charts", label: "Charts" },
  ];

  if (loading) {
    return (
      <AppBar position="fixed" className="navbar">
        <Toolbar className="toolbar">
          <Box className="left-group">
            <Typography variant="h6" component="div" className="navbar-title">
              FinTrackr
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  const sidebarContent = (
    <Box className="sidebar">
      <Box className="sidebar-header" sx={{ position: "relative" }}>
        <Box className="sidebar-username">
          <AccountCircle className="sidebar-user-icon" />
          <Typography variant="subtitle1" className="sidebar-user-name">
            {username || "User"}
          </Typography>
        </Box>
        {isExtraSmall && (
          <Typography
            variant="subtitle2"
            className={`sidebar-balance ${
              balanceUpdated ? "balance-updated" : ""
            }`}
          >
            Balance: {formatBalance(currentDayBalance, preferredCurrency)}{" "}
            {preferredCurrency}
          </Typography>
        )}
        <IconButton
          onClick={handleSidebarClose}
          sx={{ position: "absolute", top: 4, right: 4, color: "#fff" }}
          aria-label="Close sidebar"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        {navLinks.map((link) => (
          <ListItem key={link.to} disablePadding>
            <ListItemButton
              component={Link}
              to={link.to}
              onClick={handleSidebarClose}
              className={`sidebar-link ${isActive(link.to) ? "active" : ""}`}
            >
              <ListItemText primary={link.label} />
            </ListItemButton>
          </ListItem>
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/dashboard/settings"
            onClick={handleSidebarClose}
            className={`sidebar-link ${
              isActive("/dashboard/settings") ? "active" : ""
            }`}
          >
            <ListItemIcon>
              <SettingsIcon
                className={`sidebar-icon ${
                  isActive("/dashboard/settings") ? "active" : ""
                }`}
              />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogoutClick} className="sidebar-link">
            <ListItemIcon>
              <LogoutIcon className="sidebar-icon" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="fixed" className="navbar">
      <Toolbar className="toolbar">
        <Box className="left-group">
          <Typography variant="h6" component="div" className="navbar-title">
            FinTrackr
          </Typography>
          {!isMobile && token && (
            <Box className="nav-links">
              {navLinks.map((link) => (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  className={`nav-button ${isActive(link.to) ? "active" : ""}`}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        <Box className="right-group">
          {token && (
            <>
              {!isExtraSmall && (
                <Typography
                  variant="subtitle1"
                  className={`balance ${
                    balanceUpdated ? "balance-updated" : ""
                  }`}
                >
                  Balance: {formatBalance(currentDayBalance, preferredCurrency)}{" "}
                  {preferredCurrency}
                </Typography>
              )}
              {!isMobile ? (
                <>
                  <IconButton
                    onClick={handleMenuOpen}
                    className="settings-button"
                    aria-label="settings"
                  >
                    <SettingsIcon />
                  </IconButton>
                  <Menu
                    id="user-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    className="user-menu"
                    PaperProps={{ className: "user-menu-paper" }}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <Box className="user-menu-header">
                      <AccountCircle className="user-icon" />
                      <Typography variant="subtitle1" className="user-name">
                        {username || "User"}
                      </Typography>
                    </Box>
                    <MenuItem
                      component={Link}
                      to="/dashboard/settings"
                      onClick={handleSettingsClick}
                      className="user-menu-item"
                    >
                      <SettingsIcon className="menu-icon" />
                      <Typography>Settings</Typography>
                    </MenuItem>
                    <MenuItem
                      onClick={handleLogoutClick}
                      className="user-menu-item"
                    >
                      <LogoutIcon className="menu-icon" />
                      <Typography>Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <IconButton
                  onClick={handleSidebarToggle}
                  className="mobile-menu-button"
                  aria-label="menu"
                >
                  <MenuIcon />
                </IconButton>
              )}
            </>
          )}
        </Box>

        <Drawer
          anchor="right"
          open={sidebarOpen}
          onClose={handleSidebarClose}
          className="sidebar-drawer"
          PaperProps={{ className: "sidebar-paper" }}
        >
          {sidebarContent}
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
