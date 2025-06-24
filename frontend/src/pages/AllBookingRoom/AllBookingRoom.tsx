import { Box, Container, Grid, Typography } from "@mui/material"

function AllBookingRoom() {
  return (
    <Box className="all-booking-room-page">
        <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
            <Grid container spacing={3}>
                <Grid className="title-box" size={{ xs: 12, md: 12 }}>
                        <Typography
                            variant="h5"
                            className="title"
                            sx={{
                                fontWeight: 700,
                            }}
                        >
                            รายการจองห้อง
                        </Typography>
                    </Grid>
            </Grid>
        </Container>
    </Box>
  )
}
export default AllBookingRoom