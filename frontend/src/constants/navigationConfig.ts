// Define possible user roles in the system
export type Role = 'Manager' | 'Outsider' | 'Admin' | 'SuperAdmin' | 'Operator';

// Type definition for navigation items in the drawer
type NavItem = {
    path: string; // Path for the navigation item
    name: string; // Name of the navigation item
    roles: Role[]; // Roles that can access this item
};

// Main sections of the app with key, path, and display name
export const SECTIONS = [
    { key: 'home', path: '/', name: 'หน้าหลัก' },
    { key: 'booking', path: '/booking-room', name: 'จองห้อง' },
    { key: 'maintenance', path: '/dashboard', name: 'แจ้งซ่อม' },
];

// Drawer items categorized by section and filtered by user roles
const DRAWER_ITEMS: Record<string, NavItem[]> = {
    home: [], // No drawer items for 'home'
    booking: [
        { 
            path: '/booking-room', 
            name: 'ระบบจองห้อง', 
            roles: ['Outsider', 'Admin', 'SuperAdmin'] 
        },
    ],
    maintenance: [
        { 
            path: '/dashboard', 
            name: 'แดชบอร์ด', 
            roles: ['Outsider', 'Admin', 'SuperAdmin'] 
        },
        { 
            path: '/maintenance-request', 
            name: 'รายการแจ้งซ่อม', 
            roles: [ 'Outsider', 'Admin', 'Manager', 'Operator', 'SuperAdmin'] 
        },
        { 
            path: '/assign-work', 
            name: 'มอบหมายงานซ่อม', 
            roles: ['Admin', 'Manager'] 
        },
        { 
            path: '/accept-work', 
            name: 'งานของฉัน', 
            roles: ['Operator'] 
        },
        { 
            path: '/manage-user', 
            name: 'จัดการผู้ใช้งาน', 
            roles: ['Admin', 'SuperAdmin'] 
        },
        { 
            path: '/add-user', 
            name: 'เพิ่มผู้ใช้', 
            roles: ['SuperAdmin'] 
        },
        { 
            path: '/outsider-maintenance-request', 
            name: 'แจ้งซ่อมภายนอก', 
            roles: ['Outsider'] 
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
        '/maintenance-request': 'maintenance',
        '/assign-work': 'maintenance',
        '/accept-work': 'maintenance',
        '/check-requests': 'maintenance',
        '/manage-user': 'maintenance',
        '/add-user': 'maintenance',
        '/outsider-maintenance-request': 'maintenance',
        '/test-popup': 'maintenance',

        // Booking
        '/booking-room': 'booking',
    };

    return map[Object.keys(map).find(key => pathname.startsWith(key)) || ''] || 'home'; // Return the section key
};