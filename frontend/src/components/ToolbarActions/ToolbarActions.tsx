import { IconButton, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useColorScheme } from "@mui/material/styles";
import i18n from "../../i18n";
import { useTranslation } from "react-i18next";

const ToolbarActions = () => {
  const { mode, setMode } = useColorScheme();
  const { i18n: i18nInstance } = useTranslation();

  const toggleTheme = () => {
    setMode(mode === "light" ? "dark" : "light");
  };

  const handleLanguageChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLang: string | null
  ) => {
    if (newLang) {
      i18n.changeLanguage(newLang);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <ToggleButtonGroup
        value={i18nInstance.language}
        exclusive
        onChange={handleLanguageChange}
        size="small"
        color="primary"
      >
        <ToggleButton value="en">EN</ToggleButton>
        <ToggleButton value="th">ไทย</ToggleButton>
      </ToggleButtonGroup>

      <IconButton onClick={toggleTheme} color="inherit">
        {mode === "dark" ? (
          <DarkMode sx={{ color: "primary.main" }} />
        ) : (
          <LightMode sx={{ color: "primary.main" }} />
        )}
      </IconButton>

      
    </Stack>
  );
};

export default ToolbarActions;
