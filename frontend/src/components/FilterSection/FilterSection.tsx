import {
    InputAdornment,
    MenuItem,
    FormControl,
    Button,
    Grid,
} from "@mui/material";
import { TextField } from "../TextField/TextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartSimple, faMagnifyingGlass, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../DatePicker/DatePicker";
import { Select } from "../Select/Select";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { CalendarMonth } from "@mui/icons-material";


type Props = {
    display?: { [key: string]: string };
    searchText: string;
    setSearchText: (val: string) => void;
    selectedDate: any;
    setSelectedDate: (val: any) => void;
    selectedStatus: number;
    setSelectedStatus: (val: number) => void;
    handleClearFilter: () => void;
    requestStatuses: RequestStatusesInterface[];
};

const FilterSection = ({
    display,
    searchText,
    setSearchText,
    selectedDate,
    setSelectedDate,
    selectedStatus,
    setSelectedStatus,
    handleClearFilter,
    requestStatuses,
}: Props) => {

    return (
        <Grid
            container
            spacing={1}
            className="filter-section"
            size={{ xs: 12 }}
            sx={{
                alignItems: "flex-end",
                height: "auto",
                display,
            }}
        >
            <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                    fullWidth
                    className="search-box"
                    variant="outlined"
                    placeholder="ค้นหา"
                    margin="none"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start" sx={{ px: 0.5 }}>
                                    <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Grid>

            <Grid size={{ xs: 5, sm: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        views={['year', 'month']}
                        format="MM/YYYY"
                        value={selectedDate}
                        onChange={(newValue) => setSelectedDate(newValue)}
                        slots={{
                            openPickerIcon: CalendarMonth,
                        }}
                    />
                </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 5, sm: 3 }}>
                <FormControl fullWidth>
                    <Select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(Number(e.target.value))}
                        displayEmpty
                        startAdornment={
                            <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                <FontAwesomeIcon icon={faChartSimple} size="lg" />
                            </InputAdornment>
                        }
                    >
                        <MenuItem value={0}>ทุกสถานะ</MenuItem>
                        {requestStatuses.map((item, index) => (
                            <MenuItem key={index} value={index + 1}>
                                {item.Name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid size={{ xs: 2, sm: 1 }}>
                <Button
                    onClick={handleClearFilter}
                    sx={{
                        minWidth: 0,
                        width: "100%",
                        height: "45px",
                        borderRadius: "10px",
                        border: "1px solid rgb(109, 110, 112, 0.4)",
                        "&:hover": {
                            boxShadow: "none",
                            borderColor: "primary.main",
                            backgroundColor: "transparent",
                        },
                    }}
                >
                    <FontAwesomeIcon icon={faRotateRight} size="lg" style={{ color: "gray" }} />
                </Button>
            </Grid>
        </Grid>
    );
};

export default FilterSection;
