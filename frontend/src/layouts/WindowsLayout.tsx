import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import { apiUrl, GetOrganizationInfo } from "../services/http/index";
import {
    GetUnreadNotificationCountsByUserID,
    GetUserById,
    socketUrl,
} from "../services/http";
import { UserInterface } from "../interfaces/IUser";
import Footer from "../components/Footer/Footer";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import { MaintenaceImagesInterface } from "../interfaces/IMaintenaceImages";
import { Container, Chip, useTheme, Skeleton } from "@mui/material";
import {  Hotel ,House,HousePlus,LandPlot   } from 'lucide-react';
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
import { isAdmin, isManager, isMaintenanceOperator, isDocumentOperator } from "../routes";
import {
    ClipboardList,
    DoorOpen,
    HardHat,
    Home,
    LayoutDashboard,
    UserCog,
    UserRound,
    UserRoundPlus,
    ShieldUser,
    ChartPie,
    Newspaper,
    Building2,
    NotebookPen,
    DoorClosed,
    NotepadText,
    ClipboardCheck
} from "lucide-react";
import { setupSmartSessionMonitoring } from "../utils/sessionManager";
import { OrganizationInfoInterface } from "../interfaces/IOrganizationInfo";
import { useNotificationStore } from "../store/notificationStore";
import { useUserStore } from "../store/userStore";

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

export let logoPath = ""

const WindowsLayout: React.FC = (props: any) => {
    const { window } = props;
    const theme = useTheme();

    const router = useToolpadRouter();

    const demoWindow = window ? window() : undefined;

    const { user, setUser } = useUserStore();
    const [organizationInfo, setOrganizationInfo] =
        useState<OrganizationInfoInterface>();
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Role of current user (from localStorage)
    const role = (localStorage.getItem("role") || "Guest") as Role;
    const userId = localStorage.getItem("userId");

    const iconSize = 24;

    const { t } = useTranslation();

    const containerRef = useRef<HTMLDivElement | null>(null);
    const location = useLocation();

    const { notificationCounts, setNotificationCounts } = useNotificationStore();

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [location.pathname]);

    // ตรวจสอบ token หมดอายุแบบฉลาด
    useEffect(() => {
        if (userId) {
            const cleanup = setupSmartSessionMonitoring(userId);
            return cleanup;
        }
    }, [userId]);

    const NAVIGATION: Navigation = [
        {
            kind: "header",
            title: "Main Items",
        },
        {
            segment: "home",
            title: t("home"),
            icon: <Home size={iconSize} />,
        },
        {
            segment: "booking-room",
            title: "Room Booking",
            icon: <DoorOpen size={iconSize} />,
        },
        {
            segment: "maintenance/create-maintenance-request",
            title: t("maintenance"),
            icon: <NotebookPen size={iconSize} />,
        },
        {
            segment: "news",
            title: "News",
            icon: <Newspaper size={iconSize} />,
        },
        {
            segment: "create-service-area-request",  // เปลี่ยนจาก "create-service-area"
            title: "Create Service Area",
            icon: <Building2 size={iconSize} />,
        },
        {
            kind: "header",
            title: "Dashboard",
        },
        {
            segment: "dashboard",
            title: t("dashboard"),
            icon: <LayoutDashboard size={iconSize} />,
        },
        {
            segment: "analytics",
            title: "Analytics",
            icon: <ChartPie />,
        },
        // {
        //     segment: "maintenance",
        //     title: t("maintenance"),
        //     icon: <Wrench size={iconSize} />,
        //     action:
        //         notificationCounts?.UnreadRequests && notificationCounts?.UnreadRequests > 0 && (isAdmin || isManager) ? (
        //             <Chip
        //                 label={notificationCounts.UnreadRequests}
        //                 color="primary"
        //                 size="small"
        //             />
        //         ) : notificationCounts?.UnreadTasks && notificationCounts?.UnreadTasks && isOperator ? (
        //             <Chip
        //                 label={notificationCounts.UnreadTasks}
        //                 color="primary"
        //                 size="small"
        //             />
        //         ) : null,
        //     children: [

        //     ],
        // },
        {
            kind: "header",
            title: "Management",
        },
        {
            segment: "requests",
            title: "Request List",
            icon: <ClipboardList size={iconSize} />,
            action:
                (
                    (notificationCounts?.UnreadRequests && notificationCounts?.UnreadRequests > 0) ||
                    (notificationCounts?.UnreadBookingRoom && notificationCounts?.UnreadBookingRoom > 0)
                ) &&
                    (isAdmin() || isManager()) ? (
                    <Chip
                        label={notificationCounts.UnreadRequests + notificationCounts.UnreadBookingRoom}
                        color="primary"
                        size="small"
                    />
                ) : null,
            children: [
                {
                    segment: "maintenance/all-maintenance-request",
                    title: t("Maintenance"),
                    icon: <ClipboardList size={iconSize} />,
                    action:
                        notificationCounts?.UnreadRequests &&
                            notificationCounts?.UnreadRequests > 0 &&
                            (isAdmin() || isManager()) ? (
                            <Chip
                                label={notificationCounts.UnreadRequests}
                                color="primary"
                                size="small"
                            />
                        ) : null,
                },
                {
                    segment: "all-booking-room",   // 👈 segment ตรงไปตรงมา
                    title: "All Booking Room",
                    icon: < Hotel size={iconSize} />,
                    action:
                        notificationCounts?.UnreadBookingRoom &&
                            notificationCounts?.UnreadBookingRoom > 0 &&
                            (isAdmin() || isManager()) ? (
                            <Chip
                                label={notificationCounts.UnreadBookingRoom}
                                color="primary"
                                size="small"
                            />
                        ) : null,
                },
                {
                    segment: "service-area/service-request-list",
                    title: "Service Area",
                    icon: <LandPlot  size={iconSize} />,
                    action: notificationCounts?.UnreadServiceAreaRequests && notificationCounts?.UnreadServiceAreaRequests > 0 ? (
                        <Chip
                            label={notificationCounts.UnreadServiceAreaRequests}
                            color="primary"
                            size="small"
                        />
                    ) : null,
                },

            ],
        },

        {
            segment: "maintenance/accept-work",
            title: "My Work",
            icon: <HardHat />,
            action:
                notificationCounts?.UnreadTasks &&
                    notificationCounts.UnreadTasks &&
                    isMaintenanceOperator() ? (
                    <Chip
                        label={notificationCounts.UnreadTasks}
                        color="primary"
                        size="small"
                    />
                ) : null,
        },
        {
            segment: "service-area/accept-work-document",
            title: "My Work",
            icon: <ClipboardCheck />,
            action: notificationCounts?.UnreadServiceAreaRequests && notificationCounts?.UnreadServiceAreaRequests > 0 ? (
                <Chip
                    label={notificationCounts.UnreadServiceAreaRequests}
                    color="primary"
                    size="small"
                />
            ) : null,
        },
        {
            segment: "user",
            title: t("user"),
            icon: <UserRound size={iconSize} />,
            children: [
                {
                    segment: "manage-user",
                    title: t("manageUser"),
                    icon: <UserCog size={iconSize} />,
                },
                {
                    segment: "add-user",
                    title: t("addUser"),
                    icon: <UserRoundPlus size={iconSize} />,
                },
                {
                    segment: "add-user-by-csv",
                    title: t("addUserByCsv"),
                    icon: <UserRoundPlus size={iconSize} />,
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
            icon: <DoorOpen size={iconSize} />,
            children: [
                {
                    segment: "manage-room-type",
                    title: t("Manage Room Type"),
                    icon: <HousePlus size={iconSize} />,
                },
                {
                    segment: "manage-room",
                    title: t("manageRoom"),
                    icon: <House size={iconSize} />,
                },
                {
                    segment: "rental-space",
                    title: "Rental Space",
                    icon: <DoorClosed />,
                    action:
                        (notificationCounts?.UnreadInvoice && notificationCounts?.UnreadInvoice > 0)
                            ? (
                                <Chip
                                    label={notificationCounts?.UnreadInvoice}
                                    color="primary"
                                    size="small"
                                />
                            ) : null,
                },
            ],
            action:
                (notificationCounts?.UnreadInvoice && notificationCounts?.UnreadInvoice > 0)
                    ? (
                        <Chip
                            label={"New"}
                            color="primary"
                            size="small"
                        />
                    ) : null,
        },
        {
            kind: "header",
            title: "Personal Information",
        },
        {
            segment: "my-account",
            title: "My Account",
            icon: <ShieldUser />,
            action:
                (notificationCounts?.UnreadInvoice && notificationCounts?.UnreadInvoice > 0 && (!(user?.IsEmployee) && user?.Role?.Name === "User")) ||
                    (notificationCounts?.UnreadRequests && notificationCounts?.UnreadRequests > 0 && !(isAdmin() || isManager())) || 
                        (notificationCounts.UnreadBookingRoom && notificationCounts.UnreadBookingRoom > 0 && !(isAdmin() || isManager()))
                    ? (
                        <Chip
                            label={"New"}
                            color="primary"
                            size="small"
                        />
                    ) : null,
        },
        {
            segment: "organization-info",
            title: "Organization Info",
            icon: <Building2 />,
        },

        // {
        //     segment: "my-booking-room",
        //     title: "My Booking Room",
        //     icon: < Warehouse />,
        // },
    ];

    const accessibleSegments: Record<Role, string[]> = {
        Admin: [
            "home",
            "dashboard",
            "analytics",
            "booking-room",
            "maintenance",
            "maintenance/create-maintenance-request",
            "my-booking-room",
            "room",
            "user",
            "all-booking-room",
            "my-account",
            "news",
            "organization-info",

            "requests",
            "maintenance/all-maintenance-request",
            "manage-room-type",
            "manage-room",
            "manage-user",
            "add-user",
            "add-user-by-csv",
            "rental-space",
            "service-area/service-request-list",
        ],
        Manager: [
            "home",
            "dashboard",
            "booking-room",
            "my-booking-room",
            "maintenance",
            "maintenance/create-maintenance-request",
            "all-booking-room",
            "my-account",
            "news",
            "organization-info",

            "requests",
            "maintenance/all-maintenance-request",
            "rental-space",
            // เพิ่มเงื่อนไขสำหรับ Service Area
            ...(localStorage.getItem('requestType') === 'External' || localStorage.getItem('requestType') === 'Both' ? ["service-area/service-request-list"] : []),
        ],
        'Maintenance Operator': [
            "home",
            "booking-room",
            "my-booking-room",
            "maintenance",
            "maintenance/create-maintenance-request",
            "room",
            "my-account",
            "news",

            "maintenance/accept-work",
            "rental-space",
        ],
        'Document Operator': [
            "home",
            "booking-room",
            "maintenance",
            "maintenance/create-maintenance-request",
            "service-area/accept-work-document",
            "room",
            "my-account",
            "news",

            "document-management",
            "rental-space",
        ],
        User: [
            "home",
            "booking-room",
            "my-booking-room",
            "maintenance/create-maintenance-request",
            "my-account",
            "news",
            "create-service-area-request",
        ],
    };

    function isAllowed(segment: string, role: Role): boolean {
        const allowed = accessibleSegments[role] || [];
        return allowed.includes("*") || allowed.includes(segment);
    }

    function getNavigationByRole(role: Role): Navigation {
        const filteredNavigation = NAVIGATION.filter((item) => {
            if (item.kind === "header" || item.kind === "divider") {
                // สำหรับ header และ divider ให้ตรวจสอบว่ามี item ที่อนุญาตตามมาใน section นี้หรือไม่
                const currentIndex = NAVIGATION.indexOf(item);
                const nextItems = NAVIGATION.slice(currentIndex + 1);

                // หา header หรือ divider ถัดไป
                const nextHeaderIndex = nextItems.findIndex(nextItem =>
                    nextItem.kind === "header" || nextItem.kind === "divider"
                );

                // ตรวจสอบ items ระหว่าง header/divider ปัจจุบันกับ header/divider ถัดไป
                const itemsInSection = nextHeaderIndex === -1
                    ? nextItems
                    : nextItems.slice(0, nextHeaderIndex);

                // ถ้าเป็น header ให้ตรวจสอบว่ามี item ที่อนุญาตใน section นี้หรือไม่
                if (item.kind === "header") {
                    return itemsInSection.some(sectionItem =>
                        hasSegment(sectionItem) && isAllowed(sectionItem.segment || "", role)
                    );
                }

                // ถ้าเป็น divider ให้ตรวจสอบว่ามี item ที่อนุญาตใน section ถัดไปหรือไม่
                if (item.kind === "divider") {
                    return itemsInSection.some(sectionItem =>
                        hasSegment(sectionItem) && isAllowed(sectionItem.segment || "", role)
                    );
                }

                return false;
            }

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

        // ลบ divider ที่อยู่ติดกันหรือ divider ที่อยู่ท้ายสุด
        return filteredNavigation.filter((item, index, array) => {
            if (item.kind === "divider") {
                // ลบ divider ที่อยู่ท้ายสุด
                if (index === array.length - 1) return false;

                // ลบ divider ที่อยู่ติดกัน
                if (index < array.length - 1 && array[index + 1].kind === "divider") return false;

                // ลบ divider ที่อยู่ก่อน header
                if (index < array.length - 1 && array[index + 1].kind === "header") return false;
            }
            return true;
        });
    }

    const [profileImage, setProfileImage] = useState<string | null>(null);

    const convertPathsToBase64 = async (
        images: MaintenaceImagesInterface[]
    ): Promise<string | null> => {
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
            console.error("Error converting image to base64: ", error);
            return null;
        }
    };

    const loadUserAndImage = async () => {
        try {
            const res = await GetUserById(Number(userId));
            if (res) {
                const imagePathArray = [
                    { ID: 0, FilePath: String(res?.ProfilePath) },
                ];
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
            const resCounts = await GetUnreadNotificationCountsByUserID(
                user?.ID
            );
            if (resCounts) {
                setNotificationCounts(resCounts);
            }
        } catch (error) {
            console.error("Error fetching notification counts:", error);
            // ถ้าเป็น error 401 (token หมดอายุ) จะถูกจัดการโดย axios interceptor แล้ว
        }
    };

    const getNewUnreadNotificationCounts = async () => {
        try {
            const resCounts = await GetUnreadNotificationCountsByUserID(
                user?.ID
            );
            if (resCounts) {
                setNotificationCounts(resCounts);
            }
        } catch (error) {
            console.error("Error fetching new notification counts:", error);
            // ถ้าเป็น error 401 (token หมดอายุ) จะถูกจัดการโดย axios interceptor แล้ว
        }
    };

    const getOrganizationInfo = async () => {
        try {
            const res = await GetOrganizationInfo();
            if (res) {
                setOrganizationInfo(res);
                logoPath = `${apiUrl}/${res?.LogoPath}?t=${Date.now()}`
            }
        } catch (error) {
            console.error("Error fetching organization info:", error);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getOrganizationInfo(), loadUserAndImage()]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!user?.ID) return;
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

        socket.on("user_updated", (data) => {
            console.log("📦 Notification updated:", data);
            loadUserAndImage();
        });

        socket.on("maintenance_deleted", (data) => {
            console.log("🔄 Maintenance request deleted:", data);
            getNewUnreadNotificationCounts();
        });

        // Service Area Notifications
        socket.on("service_area_created", (data) => {
            console.log("📦 New service area request:", data);
            getNewUnreadNotificationCounts();
        });

        socket.on("service_area_approved", (data) => {
            console.log("✅ Service area approved:", data);
            getNewUnreadNotificationCounts();
        });

        socket.on("service_area_completed", (data) => {
            console.log("🎉 Service area completed:", data);
            getNewUnreadNotificationCounts();
        });

        // Cancellation Notifications
        socket.on("service_area_cancellation_requested", (data) => {
            console.log("❌ Service area cancellation requested:", data);
            getNewUnreadNotificationCounts();
        });

        socket.on("service_area_cancellation_assigned", (data) => {
            console.log("📋 Cancellation assigned:", data);
            getNewUnreadNotificationCounts();
        });

        socket.on("service_area_cancellation_completed", (data) => {
            console.log("✅ Cancellation completed:", data);
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
                logo: isLoadingData ? (
                    <Skeleton
                        variant="rectangular"
                        height={'100%'}
                        sx={{ borderRadius: 2 }}
                    />
                ) : (
                    <img
                        src={
                            organizationInfo?.LogoPath ?
                                `${apiUrl}/${organizationInfo?.LogoPath}?t=${Date.now()}` :
                                ''
                        }
                        alt=" RSP Northeast 2"
                        style={{
                            backgroundColor: "#fff",
                            padding: "3px 10px",
                            borderRadius: 5,
                        }}
                    />
                ),
                title: "",
                homeUrl: "/home",
            }}
        >
            <DashboardLayout sidebarExpandedWidth={260}>
                {/* Main content area */}
                <Container
                    maxWidth={false}
                    sx={{ p: "0px !important", overflow: "auto" }}
                    className="content-box"
                    ref={containerRef}
                >
                    <Box
                        sx={{
                            minHeight: "95vh",
                            p: { xs: 2.5, md: 4 },
                            mb: 4,
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
