export type Role = 'Manager' | 'Outsider' | 'Admin' | 'SuperAdmin';

type NavItem = {
    path: string;
    name: string;
    roles: Role[];
};

export const SECTIONS = [
    { key: 'home', path: '/', name: 'หน้าหลัก' },
    { key: 'booking', path: '/booking-room', name: 'จองห้อง' },
    { key: 'maintenance', path: '/dashboard', name: 'แจ้งซ่อม' },
] as { key: string; path: string; name: string }[];

const DRAWER_ITEMS: Record<string, NavItem[]> = {
    home: [],
    booking: [
        { path: '/booking-room', name: 'ระบบจองห้อง', roles: ['Outsider', 'Admin', 'SuperAdmin'] },
    ],
    maintenance: [
        { path: '/dashboard', name: 'แดชบอร์ด', roles: ['Outsider', 'Admin', 'SuperAdmin'] },
        { path: '/maintenance-request', name: 'รายการแจ้งซ่อม', roles: ['Admin'] },
        { path: '/assign-work', name: 'มอบหมายงานซ่อม', roles: ['Admin'] },
        { path: '/manage-user', name: 'จัดการผู้ใช้งาน', roles: ['Admin', 'SuperAdmin'] },
        { path: '/add-user', name: 'เพิ่มผู้ใช้', roles: ['SuperAdmin'] },
        { path: '/outsider-maintenance-request', name: 'แจ้งซ่อมภายนอก', roles: ['Outsider'] },
    ]
};

export const getDrawerItemsBySection = (sectionKey: string, role: Role): NavItem[] => {
    const items = DRAWER_ITEMS[sectionKey] || [];
    return items.filter(item => item.roles.includes(role));
};

export const getCurrentSectionKey = (pathname: string): string => {
    const map: Record<string, string> = {
        '/dashboard': 'maintenance',
        '/booking-room': 'booking',
        '/maintenance-request': 'maintenance',
        '/assign-work': 'maintenance',
        '/check-requests': 'maintenance',
        '/manage-user': 'maintenance',
        '/add-user': 'maintenance',
        '/outsider-maintenance-request': 'maintenance',
        '/test-popup': 'maintenance',
    };

    return map[Object.keys(map).find(key => pathname.startsWith(key)) || ''] || 'home';
};