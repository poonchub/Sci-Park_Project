// Define possible user roles in the system
export type Role = 'User' | 'Maintenance Operator' | 'Document Operator' | 'Manager' | 'Admin';

// Type definition for navigation items in the drawer
type NavItem = {
    path: string; // Path for the navigation item
    name: string; // Name of the navigation item
    roles: Role[]; // Roles that can access this item
};


const DEFAULT_PATHS_BY_ROLE: Record<Role, Record<string, string>> = {
    User: {
        maintenance: '/my-maintenance-request',
        booking: '/booking-room',
        manageuser: '',
    },
    'Maintenance Operator': {
        maintenance: '/my-maintenance-request',
        booking: '/booking-room',
        manageuser: '',
    },
    'Document Operator': {
        maintenance: '/my-maintenance-request',
        booking: '/booking-room',
        manageuser: '',
    },
    Manager: {
        maintenance: '/dashboard',
        booking: '/booking-room',
        manageuser: '/manage-user',
    },
    Admin: {
        maintenance: '/dashboard',
        booking: '/booking-room',
        manageuser: '/manage-user',
        manageroom: '/manage-room',
    },
};

const getDefaultPathForSection = (sectionKey: string, role: Role): string => {
    return DEFAULT_PATHS_BY_ROLE[role]?.[sectionKey] || '/';
};

// Main sections of the app with key, path, and display name
const getRoleFromStorage = (): Role => {
    const raw = localStorage.getItem("role");
    const validRoles: Role[] = ['User', 'Maintenance Operator', 'Document Operator', 'Manager', 'Admin'];
    return validRoles.includes(raw as Role) ? (raw as Role) : 'User';
};
const role = getRoleFromStorage();
export const SECTIONS = [
    { key: 'home', path: '/', name: 'หน้าหลัก' },
    { key: 'booking', path: getDefaultPathForSection('booking', role), name: 'จองห้อง' },
    { key: 'maintenance', path: getDefaultPathForSection('maintenance', role), name: 'แจ้งซ่อม' },
    { key: 'manageuser', path: getDefaultPathForSection('manageuser', role), name: 'จัดการผู้ใช้' },
    { key: 'manageroom', path: getDefaultPathForSection('manageroom', role), name: 'จัดการห้อง' },

];

// Drawer items categorized by section and filtered by user roles
const DRAWER_ITEMS: Record<string, NavItem[]> = {
    home: [], // No drawer items for 'home'
    booking: [
        {
            path: '/booking-room',
            name: 'ระบบจองห้อง',
            roles: ['User', 'Maintenance Operator', 'Document Operator', 'Manager', 'Admin']
        },
    ],
    maintenance: [
        {
            path: '/dashboard',
            name: 'แดชบอร์ด',
            roles: ['Manager', 'Admin']
        },
        {
            path: '/all-maintenance-request',
            name: 'จัดการแจ้งซ่อม',
            roles: ['Manager', 'Admin']
        },
        {
            path: '/my-maintenance-request',
            name: 'การแจ้งซ่อมของฉัน',
            roles: ['User', 'Maintenance Operator', 'Document Operator', 'Manager', 'Admin']
        },
        {
            path: '/accept-work',
            name: 'งานของฉัน',
            roles: ['Maintenance Operator']
        },
        {
            path: '/document-management',
            name: 'จัดการเอกสาร',
            roles: ['Document Operator']
        },
    ],
    manageuser: [
        {
            path: '/manage-user',
            name: 'จัดการผู้ใช้งาน',
            roles: ['Manager', 'Admin']
        },
        {
            path: '/add-user',
            name: 'เพิ่มผู้ใช้',
            roles: ['Admin']
        },
        {
            path: '/add-user-by-csv',
            name: 'เพิ่มผู้ใช้ด้วย CSV',
            roles: ['Admin']
        },
    ],
    manageroom: [
        {
            path: '/manage-room',
            name: 'จัดการห้อง',
            roles: ['Admin']
        },
        {
            path: '/add-room',
            name: 'เพิ่มห้อง',
            roles: ['Admin']
        },
        
    ]
};

// Get drawer items based on the current section and user role
export const getDrawerItemsBySection = (sectionKey: string, role: Role): NavItem[] => {
    const items = DRAWER_ITEMS[sectionKey] || []; // Get items for the section
    return items.filter(item => item.roles.includes(role)); // Filter by user role
};

// Map the current URL to the appropriate section key
export const getCurrentSectionKey = (pathname: string): string => {
    const map: Record<string, string> = {
        // Maintenance
        '/dashboard': 'maintenance',
        '/create-maintenance-request': 'maintenance',
        '/all-maintenance-request': 'maintenance',
        '/my-maintenance-request': 'maintenance',
        '/assign-work': 'maintenance',
        '/accept-work': 'maintenance',
        '/document-management': 'maintenance',
        '/check-requests': 'maintenance',
        '/outsider-maintenance-request': 'maintenance',
        '/test-popup': 'maintenance',

        // Booking
        '/booking-room': 'booking',

        // User Management
        '/manage-user': 'manageuser',
        '/user/add-user': 'manageuser',
        '/user/add-user-by-csv': 'manageuser',

        // Room Management
        '/manage-room': 'manageroom',
        '/add-room': 'manageroom',


    };

    return map[Object.keys(map).find(key => pathname.startsWith(key)) || ''] || 'home'; // Return the section key
};