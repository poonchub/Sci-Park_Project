import React, { useState } from "react";
import { Box, Container, Typography, Grid, Card, CardContent, Skeleton, useMediaQuery } from "@mui/material";
import { ClipboardList } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle,faCircleXmark, faHourglassHalf, faCheck, faFlagCheckered } from "@fortawesome/free-solid-svg-icons";
import theme from "../../styles/Theme";
import "./ServiceRequestList.css";

const ServiceRequestList: React.FC = () => {
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    // Mock data for status counts
    const [statusCounts] = useState<Record<string, number>>({
        "Pending": 5,
        "Approved": 12,
        "Completed": 8,
        "Unsuccessful": 3
    });

    // Status configuration for Service Request List (4 statuses only)
    // Using the same colors as AllMaintenanceRequest from statusConfig.ts
    const statusConfig = {
        "Pending": {
            color: "#ebca0c", // Same as AllMaintenanceRequest
            colorLite: "rgba(235, 202, 12, 0.22)", // Same as AllMaintenanceRequest
            icon: faHourglassHalf
        },
        "Approved": {
            color: "#10a605", // Same as AllMaintenanceRequest
            colorLite: "rgba(0, 255, 60, 0.18)", // Same as AllMaintenanceRequest
            icon: faCheck
        },
        "Completed": {
            color: "#884af7", // Same as AllMaintenanceRequest
            colorLite: "rgba(110, 66, 193, 0.18)", // Same as AllMaintenanceRequest
            icon: faFlagCheckered
        },
        "Unsuccessful": {
            color: "#DC3545", // Same as AllMaintenanceRequest
            colorLite: "rgba(220, 53, 70, 0.19)", // Same as AllMaintenanceRequest
            icon: faCircleXmark
        }
    };

    // Only 4 statuses for Service Request List
    const displayStatuses = ["Pending", "Approved", "Completed", "Unsuccessful"];

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const statusCards = displayStatuses.map((status) => {
        const count = statusCounts[status] || 0;
        const config = statusConfig[status as keyof typeof statusConfig] || {
            color: "#000",
            colorLite: "#000",
            icon: faQuestionCircle
        };

        return { name: status, count, ...config };
    });

    return (
        <Box className="service-request-list-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid 
                        container 
                        className="title-box" 
                        direction={'row'} 
                        size={{ xs: 5, sm: 5 }}
                        sx={{ gap: 1 }}
                    >
                        <ClipboardList size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Service Request List
                        </Typography>
                    </Grid>

                    {!isLoadingData && statusCounts ? (
                        <>
                            <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                                {/* Status Cards Section */}
                                {statusCards.map((item, index) => (
                                    <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Card 
                                            className="status-card" 
                                            sx={{ 
                                                height: "100%", 
                                                borderRadius: 2, 
                                                overflow: "hidden",
                                                position: "relative"
                                            }}
                                        >
                                            {/* Vertical colored bar on the left */}
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: "4px",
                                                    bgcolor: item.color
                                                }}
                                            />
                                            
                                            <CardContent 
                                                className="status-card-content" 
                                                sx={{ 
                                                    height: '100%',
                                                    pl: 3, // Add left padding to account for the colored bar
                                                    pr: 2,
                                                    py: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                {/* Left side - Text content */}
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography 
                                                        variant="body1" 
                                                        sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: 16, 
                                                            color: 'text.secondary',
                                                            mb: 1
                                                        }}
                                                    >
                                                        {item.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="h5" 
                                                        fontWeight="bold" 
                                                        color="textPrimary" 
                                                    >
                                                        <Box component="span">
                                                            {item.count}
                                                        </Box>
                                                        {' '}
                                                        <Box component="span" sx={{ fontSize: 16, fontWeight: 600 }}>
                                                            Items
                                                        </Box>
                                                    </Typography>
                                                </Box>
                                                
                                                {/* Right side - Circular icon */}
                                                <Box
                                                    sx={{
                                                        borderRadius: "50%",
                                                        bgcolor: item.colorLite,
                                                        border: 1,
                                                        borderColor: item.color,
                                                        aspectRatio: "1/1",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        width: 55,
                                                        height: 55,
                                                        color: item.color,
                                                        ml: 2
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={item.icon} size="lg" />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}

                                {/* Filter Section - Placeholder for future implementation */}
                                <Grid size={{ xs: 12 }}>
                                    <Card sx={{ p: 2, borderRadius: 2 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            Filter section will be implemented here
                                        </Typography>
                                    </Card>
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: 2 }} />
                    )}
                    
                    {/* Data Table Section */}
                    <Grid size={{ xs: 12, md: 12 }} minHeight={'200px'}>
                        {!isLoadingData && statusCounts ? (
                            <Card sx={{ p: 2, borderRadius: 2 }}>
                                <Typography variant="body1" className="content-text">
                                    Service Request List table will be implemented here.
                                </Typography>
                            </Card>
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ServiceRequestList;
