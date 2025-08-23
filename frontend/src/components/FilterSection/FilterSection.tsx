import {
    InputAdornment,
    MenuItem,
    FormControl,
    Button,
    Grid,
    Card,
} from "@mui/material";
import { TextField } from "../TextField/TextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../DatePicker/DatePicker";
import { Select } from "../Select/Select";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { CalendarMonth } from "@mui/icons-material";
import { isAdmin, isManager } from "../../routes";
import { Activity, BrushCleaning, Calendar, Search } from "lucide-react";


type Props = {
    display?: { [key: string]: string };
    searchText: string;
    setSearchText: (val: string) => void;
    selectedDate: any;
    setSelectedDate: (val: any) => void;
    selectedStatuses: number[];
    setSelectedStatuses: (val: number[]) => void;
    handleClearFilter: () => void;
    requestStatuses: RequestStatusesInterface[];
};

const FilterSection = ({
    display,
    searchText,
    setSearchText,
    selectedDate,
    setSelectedDate,
    selectedStatuses,
    setSelectedStatuses,
    handleClearFilter,
    requestStatuses,
}: Props) => {
    const inProcessNames = isAdmin || isManager ?
        ["Created"] :
        ["Created", "Pending", "Approved", "In Progress", "Rework Requested"]

    // สร้าง array ของ ID ที่อยู่ใน in-process จากชื่อ
    const inProcessIds = requestStatuses
        .filter(status => inProcessNames.includes(status.Name || ''))
        .map(status => status.ID!)

    const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <Calendar size={20} style={{ minWidth: '20px', minHeight: '20px' }} {...props} />;

    return (
        <Grid
            className="filter-section"
            size={{ xs: 12 }}
            sx={{
                display,
            }}
        >
            <Card sx={{ width: '100%', borderRadius: 2 }}>
                <Grid container sx={{ alignItems: "flex-end", p: 1.5 }} spacing={1}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                            fullWidth
                            className="search-box"
                            variant="outlined"
                            placeholder="Search"
                            margin="none"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ px: 0.5 }}>
                                            <Search size={20} style={{ minWidth: '20px', minHeight: '20px' }}/>
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
                                    openPickerIcon: CalendarIcon,
                                }}
                                sx={{ width: '100%'}}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid size={{ xs: 5, sm: 3 }}>
                        <FormControl fullWidth>
                            <Select
                                startAdornment={
                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                        <Activity size={20} style={{ minWidth: '20px', minHeight: '20px' }}/>
                                    </InputAdornment>
                                }
                                value={
                                    selectedStatuses.length === inProcessIds.length &&
                                        inProcessIds.every(id => selectedStatuses.includes(id || 0))
                                        ? "in-process"
                                        : selectedStatuses[0] ?? ""
                                }
                                onChange={(event) => {
                                    const value = event.target.value as string | number;

                                    if (value === "in-process") {
                                        setSelectedStatuses(inProcessIds);
                                    } else {
                                        setSelectedStatuses([Number(value)]);
                                    }
                                }}
                            >
                                <MenuItem value={0}>All Statuses</MenuItem>
                                {!(isAdmin || isManager) && <MenuItem value="in-process">In Process</MenuItem>}
                                {requestStatuses
                                    .filter(status => !inProcessNames.includes(status.Name || ''))
                                    .map((status) => (
                                        <MenuItem key={status.ID} value={status.ID}>
                                            {status.Name}
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
                            <BrushCleaning size={20} style={{ color: "gray", minWidth: '20px', minHeight: '20px' }} />
                        </Button>
                    </Grid>
                </Grid>
            </Card>
        </Grid>
    );
};

export default FilterSection;
