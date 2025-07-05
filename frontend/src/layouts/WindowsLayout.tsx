import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import { apiUrl } from '../services/http/index';
import {
    GetUnreadNotificationCountsByUserID,
    GetUserById,
    socketUrl,
} from "../services/http";
import { UserInterface } from "../interfaces/IUser";
import Footer from "../components/Footer/Footer";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import {MaintenaceImagesInterface} from '../interfaces/IMaintenaceImages'
import { Container, Chip, useTheme } from '@mui/material';


import { Role } from "../constants/navigationConfig";

import { useLocation, useNavigate } from "react-router-dom";
import {
    AppProvider,
    DashboardLayout,
    Navigation,
    NavigationItem,
    Router,
    Session,
} from "@toolpad/core";
// import ToolbarActions from "../components/ToolbarActions/ToolbarActions";
import { useTranslation } from "react-i18next";

import { io } from "socket.io-client";
import { isAdmin, isManager, isOperator } from "../routes";
import { ClipboardList, DoorOpen, HardHat, Home, LayoutDashboard, UserCog, UserRound, UserRoundPlus, Wrench,ShieldUser  } from "lucide-react";

function useToolpadRouter(): Router {
    const location = useLocation();
    const navigate = useNavigate();

    return React.useMemo(() => {
        return {
            pathname: location.pathname,
            searchParams: new URLSearchParams(location.search),
            navigate: (path: string | URL) => navigate(String(path)),
        };
    }, [location, navigate]);
}

function hasSegment(item: NavigationItem): item is { segment: string } {
    return "segment" in item;
}

interface NotificationCountsInterface {
    UnreadRequests?: number;
    UnreadTasks?: number;
}

const WindowsLayout: React.FC = (props: any) => {
    const { window } = props;
    const theme = useTheme();

    const router = useToolpadRouter();

    const demoWindow = window ? window() : undefined;

    const [user, setUser] = useState<UserInterface>();
    const [notificationCounts, setNotificationCounts] =
        useState<NotificationCountsInterface>();

    // Role of current user (from localStorage)
    const role = (localStorage.getItem("role") || "Guest") as Role;
    const userId = localStorage.getItem("userId");

    
    
    const iconSize = 24

    const { t } = useTranslation();

    const NAVIGATION: Navigation = [
        {
            kind: "header",
            title: "Main items",
        },
        {
            segment: "home",
            title: t("home"),
            icon: <Home size={iconSize}/>,
        },
        {
            segment: "booking-room",
            title: t("bookingRoom"),
            icon: <DoorOpen size={iconSize}/>,
        },
        {
            segment: "maintenance/my-maintenance-request",
            title: t("maintenance"),
            icon: <Wrench size={iconSize}/>,
        },
        {
            kind: "divider",
        },
        {
            kind: "header",
            title: "Management",
        },
        {
            segment: "dashboard",
            title: t("dashboard"),
            icon: <LayoutDashboard size={iconSize}/>,
        },
        {
            segment: "maintenance",
            title: t("maintenance"),
            icon: <Wrench size={iconSize}/>,
            action:
                notificationCounts?.UnreadRequests && notificationCounts?.UnreadRequests > 0 && (isAdmin || isManager) ? (
                    <Chip
                        label={notificationCounts.UnreadRequests}
                        color="primary"
                        size="small"
                    />
                ) : notificationCounts?.UnreadTasks && notificationCounts.UnreadTasks && isOperator ? (
                    <Chip
                        label={notificationCounts.UnreadTasks}
                        color="primary"
                        size="small"
                    />
                ) : null,
            children: [
                {
                    segment: "all-maintenance-request",
                    title: t("requestList"),
                    icon: <ClipboardList size={iconSize}/>,
                    action:
                        notificationCounts?.UnreadRequests && notificationCounts?.UnreadRequests > 0 && (isAdmin || isManager) ? (
                            <Chip
                                label={notificationCounts.UnreadRequests}
                                color="primary"
                                size="small"
                            />
                        ) : null,
                },
                {
                    segment: "accept-work",
                    title: "My Work",
                    icon: <HardHat />,
                    action:
                        notificationCounts?.UnreadTasks && notificationCounts.UnreadTasks && isOperator ? (
                            <Chip
                                label={notificationCounts.UnreadTasks}
                                color="primary"
                                size="small"
                            />
                        ) : null,
                },
            ],
        },
        {
            segment: "user",
            title: t("user"),
            icon: <UserRound size={iconSize} />,
            children: [
                {
                    segment: "manage-user",
                    title: t("manageUser"),
                    icon: <UserCog size={iconSize}/>,
                },
                {
                    segment: "add-user",
                    title: t("addUser"),
                    icon: <UserRoundPlus  size={iconSize}/>,
                },
                {
                    segment: "traffic",
                    title: "Traffic",
                    icon: <DescriptionIcon />,
                },
            ],
        },
        {
            segment: "integrations",
            title: "Integrations",
            icon: <LayersIcon />,
        },
        {
            segment: "room",
            title: t("room"),
            icon: <DoorOpen size={iconSize}/>,
            children: [
                {
                    segment: "manage-room",
                    title: t("manageRoom"),
                    icon: <ClipboardList />,
                },
                {
                    segment: "traffic",
                    title: "Traffic",
                    icon: <ClipboardList />,
                },
            ],
        },
        {
            segment: "all-booking-room",
            title: "All Booking Room",
            icon: <LayersIcon />,
        },
        {
            kind: "divider",
        },
        {
            segment: "my-account",
            title: "My Account",
            icon: <ShieldUser  />,
        },
    ];

    const accessibleSegments: Record<Role, string[]> = {
        Admin: [
            "home",
            "dashboard",
            "booking-room",
            "maintenance",
            "maintenance/my-maintenance-request",
            "room",
            "user",
            "all-booking-room",
            "my-account",

            "all-maintenance-request",
            "manage-room",
            "manage-user",
            "add-user",
        ],
        Manager: [
            "home",
            "dashboard",
            "booking-room",
            "maintenance",
            "maintenance/my-maintenance-request",
            "all-booking-room",
            "my-account",

            "all-maintenance-request",
        ],
        Operator: [
            "home",
            "booking-room",
            "maintenance",
            "maintenance/my-maintenance-request",
            "room",
            "my-account",

            "accept-work",
        ],
        User: ["booking-room", "maintenance/my-maintenance-request","my-account",],
    };

    function isAllowed(segment: string, role: Role): boolean {
        const allowed = accessibleSegments[role] || [];
        return allowed.includes("*") || allowed.includes(segment);
    }

    function getNavigationByRole(role: Role): Navigation {
        return NAVIGATION.filter((item) => {
            if (item.kind === "header" || item.kind === "divider") return true;
            return hasSegment(item) && isAllowed(item.segment || "", role);
        }).map((item) => {
            if ("children" in item && Array.isArray(item.children)) {
                const filteredChildren = item.children.filter(
                    (child) =>
                        hasSegment(child) &&
                        isAllowed(child.segment || "", role)
                );
                return { ...item, children: filteredChildren };
            }
            return item;
        });
    }

    
    const [profileImage, setProfileImage] = useState<string | null>(null);

    const convertPathsToBase64 = async (images: MaintenaceImagesInterface[]): Promise<string | null> => {
    if (images.length === 0) return null;

    const img = images[0]; // ✅ ดึงแค่ไฟล์แรก
    const url = apiUrl + "/" + img.FilePath;

    try {
        const response = await fetch(url);
        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to base64: ', error);
        return null;
    }
};


    useEffect(() => {
    const loadUserAndImage = async () => {
        try {
            const res = await GetUserById(Number(userId));
            if (res) {
                const imagePathArray = [{ ID: 0, FilePath: String(res?.ProfilePath) }];
                const base64Image = await convertPathsToBase64(imagePathArray);

                // เซ็ต session หลังจากได้ user และ image
                setSession({
                    user: {
                        name: `${res.FirstName} ${res.LastName}`,
                        email: res.Email,
                        image: base64Image || "",
                    },
                });

                setUser(res);
                setProfileImage(base64Image);
                getUnreadNotificationCounts(); // ดึงเฉพาะหลังจากเซ็ต session เสร็จ
            }
        } catch (error) {
            console.error("Error loading user or image:", error);
        }
    };

    loadUserAndImage();
}, []);


    const navigation = getNavigationByRole(role);
    const navigateUrl = useNavigate();

    const [session, setSession] = React.useState<Session | null>(null);

    


    const authentication = React.useMemo(() => {
        return {
            signIn: () => {
                if (user && profileImage) {
                    setSession({
                        user: {
                            name: `${user.FirstName} ${user.LastName}`,
                            email: user.Email,
                            image: profileImage || "",
                        },
                    });
                } else {
                    navigateUrl("/login");
                }
            },
            signOut: () => {
                setSession(null);
                localStorage.clear();
                localStorage.setItem("isLogin", "false");
                navigateUrl("/login");
            },
        };
    }, [user]);

    const getUnreadNotificationCounts = async () => {
        try {
            const resCounts = await GetUnreadNotificationCountsByUserID(user?.ID);
            if (resCounts) {
                setNotificationCounts(resCounts);
            }
        } catch (error) {
            console.error("Error fetching notification counts:", error);
        }
    };

    const getNewUnreadNotificationCounts = async () => {
        try {
            const resCounts = await GetUnreadNotificationCountsByUserID(user?.ID);
            if (resCounts) {
                setNotificationCounts((prev) => ({
                    ...prev,
                    ...resCounts,
                }));
            }
        } catch (error) {
            console.error("Error fetching new notification counts:", error);
        }
    };

    useEffect(() => {
        
        if (user && profileImage) {
            getUnreadNotificationCounts();
        }
    }, [user]);

    useEffect(() => {
        if (!user?.ID) return;

        const socket = io(socketUrl);

        socket.on("notification_created", (data) => {
            console.log("📦 New notification:", data);
            getNewUnreadNotificationCounts();
        });

        socket.on("notification_updated", (data) => {
            console.log("📦 Notification updated:", data);
            getNewUnreadNotificationCounts();
        });

        socket.on("notification_updated_bulk", (data) => {
            console.log("📦 Notification updated bulk:", data);
            getNewUnreadNotificationCounts();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.ID]);

    return (
        <AppProvider
            navigation={navigation}
            router={router}
            theme={theme}
            window={demoWindow}
            authentication={authentication}
            session={session}
            branding={{
                logo: <img src="/images/RSP2.png" alt="MUI logo" />,
                title: "RSP Northeast 2",
                homeUrl: "/home",
            }}
        >
            <DashboardLayout
				sidebarExpandedWidth={260}
			>
				{/* Main content area */}
				<Container
					maxWidth={false}
					sx={{ p: '0px !important', overflow: 'auto' }}
					className='content-box'
				>
					<Box
						sx={{
							minHeight: '95vh',
							p: 4,
						}}
					>
						<Outlet />
					</Box>
					<Footer />
				</Container>
			</DashboardLayout>
        </AppProvider>
        
    );
};

export default WindowsLayout;
