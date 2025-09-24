import React from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";

interface Props {
  statusCounts: Record<string, number>;
  size?: {
    xs?: number;
    sm?: number;
    md?: number;
    md1000?: number;
    lg?: number;
    xl?: number;
  };
  /** ระบุลิสต์สถานะที่จะโชว์ (เช่น "pending approval","Pending Payment","Partially Paid","Awaiting Receipt","Completed","Cancelled") */
  customDisplayStatuses?: string[];
}

const BookingStatusCards: React.FC<Props> = ({
  statusCounts,
  size,
  customDisplayStatuses,
}) => {
  const displayStatuses =
    customDisplayStatuses || ["pending approval", "Pending Payment", "Partially Paid", "Awaiting Receipt", "Completed", "Cancelled"];

  const statusCards = displayStatuses.map((label) => {
    const keyLower = label.toLowerCase();
    const count = statusCounts?.[keyLower] ?? 0;
    const cfg = getBookingStatusConfig(keyLower); // ให้ config รองรับ mapping key ใหม่ทั้งหมด
    return {
      name: cfg.label || label,
      count,
      color: cfg.color,
      colorLite: cfg.colorLite,
      Icon: cfg.icon,
    };
  });

  return (
    <>
      {statusCards.map(({ name, count, color, colorLite, Icon }, idx) => (
        <Grid
          key={idx}
          size={{
            xs: size?.xs || 12,
            sm: size?.sm || 6,
            md: size?.md || 6,
            md1000: size?.md1000 || 4,
            lg: size?.lg,
            xl: size?.xl,
          }}
          className="status-section"
          sx={{ display: { xs: "none", md: "grid" } }}
        >
          <Card
            className="status-card"
            sx={{ height: "100%", borderRadius: 2, px: 2.5, py: 2, borderLeft: `4px solid ${color}` }}
          >
            <CardContent className="status-card-content" sx={{ height: "100%" }}>
              <Grid
                size={{ xs: 10, md: 12 }}
                container
                direction="column"
                sx={{ height: "100%", justifyContent: "space-between", alignItems: "flex-start" }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: "text.secondary" }} gutterBottom>
                  {name}
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="textPrimary">
                  <Box component="span">{count}</Box>{" "}
                  <Box component="span" sx={{ fontSize: 16, fontWeight: 600 }}>
                    Items
                  </Box>
                </Typography>
              </Grid>

              <Grid size={{ xs: 10, md: 4 }} sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <Box
                  sx={{
                    borderRadius: "50%",
                    bgcolor: colorLite,
                    border: 1,
                    aspectRatio: "1/1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 55,
                    height: 55,
                    color,
                  }}
                >
                  <Icon size={28} strokeWidth={2} style={{ minWidth: 28, minHeight: 28 }} />
                </Box>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </>
  );
};

export default BookingStatusCards;
