import {
  Drawer,
  Typography,
  TextField,
  Grid,
  Button,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "@css/Sidebar.css";

const Sidebar = ({
  open,
  filter,
  handleFilterChange,
  clearFilters,
  onClose,
}) => {
  return (
    <Drawer anchor="left" open={open} variant="temporary" className="sidebar">
      <Box className="sidebar-content">
        <Box className="filter-sidebar-header">
          <Typography variant="subtitle1" className="sidebar-title">
            Filter Transactions
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="close"
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2} direction="column">
          <Grid item>
            <FormControl fullWidth className="form-control">
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                name="type"
                value={filter.type || ""}
                onChange={handleFilterChange}
                label="Type"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <TextField
              label="Category"
              name="category"
              value={filter.category}
              onChange={handleFilterChange}
              fullWidth
              className="text-field"
            />
          </Grid>
          <Grid item>
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              className="text-field"
            />
          </Grid>
          <Grid item>
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              className="text-field"
            />
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
              className="clear-btn"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
