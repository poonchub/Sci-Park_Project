import { IconButton, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { DarkMode, LightMode, Settings } from "@mui/icons-material";
import { useColorScheme } from "@mui/material/styles";
import i18n from "../../i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import CookieConsent from "../CookieConsent/CookieConsent";

const ToolbarActions = () => {
  const { mode, setMode } = useColorScheme();
  const { i18n: i18nInstance } = useTranslation();
  const [showCookieSettings, setShowCookieSettings] = useState(false);

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

  const handleCookieSettings = () => {
    setShowCookieSettings(true);
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

      <Tooltip title="Cookie Settings">
        <IconButton onClick={handleCookieSettings} color="inherit">
          <Settings sx={{ color: "primary.main" }} />
        </IconButton>
      </Tooltip>

      {/* Cookie Settings Dialog */}
      <CookieConsent 
        open={showCookieSettings}
        onClose={() => setShowCookieSettings(false)}
        onAccept={() => {
          setShowCookieSettings(false);
        }}
        onDecline={() => {
          setShowCookieSettings(false);
        }}
      />
    </Stack>
  );
};

export default ToolbarActions;
