import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Button, DialogActions, InputAdornment, TextFieldProps } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import dayjs, { Dayjs } from "dayjs";
import { MobileTimePicker } from "../MobileTimePicker/MobileTimePicker";

interface TimePickerFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    minTime?: string;
    maxTime?: string;
    name?: string;
}

const TimePickerField: React.FC<TimePickerFieldProps> = ({ label, value, onChange, disabled = false, error = false, helperText = "", minTime, maxTime, name = "" }) => {
    const CustomActionBar = ({ onAccept, onCancel }: any) => {
        return (
            <DialogActions sx={{ mb: 1 }}>
                <Button onClick={onCancel} variant="outlinedGray">
                    Cancel
                </Button>
                <Button
                    onClick={onAccept}
                    variant="contained"
                    sx={{
                        backgroundColor: "#F26522",
                        "&:hover": {
                            backgroundColor: "#d2551d",
                        },
                    }}
                >
                    OK
                </Button>
            </DialogActions>
        );
    };
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MobileTimePicker
                name={name}
                label={label}
                value={value ? dayjs(value, "HH:mm") : null}
                onChange={(newValue: Dayjs | null) => {
                    onChange(newValue ? newValue.format("HH:mm") : "");
                }}
                disabled={disabled}
                minTime={minTime ? dayjs(minTime, "HH:mm") : undefined}
                maxTime={maxTime ? dayjs(maxTime, "HH:mm") : undefined}
                slotProps={{
                    layout: {
                        sx: {
                            display: "flex",
                            flexDirection: "column",
                        },
                    },
                    textField: {
                        fullWidth: true,
                        error: error,
                        helperText: helperText,
                        InputProps: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <AccessTimeIcon sx={{ color: !disabled ? "primary.main" : "#6D6E70" }} />
                                </InputAdornment>
                            ),
                        },
                        sx: disabled
                            ? {
                                  pointerEvents: "none",
                                  "& .MuiOutlinedInput-root:hover fieldset": {
                                      borderColor: "inherit",
                                  },
                                  "& .MuiInputBase-root": {
                                    //   backgroundColor: " #f5f5f5",
                                  },
                              }
                            : {},
                    } as TextFieldProps,
                }}
                slots={{
                    actionBar: CustomActionBar,
                }}
            />
        </LocalizationProvider>
    );
};

export default TimePickerField;
