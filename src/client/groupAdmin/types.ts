export interface GroupMember {
    id: string;
    user_id: string;
    name?: string;
    email?: string;
    is_group_admin?: number;
    is_billing_admin?: number;
    is_developer?: number;
    valid_from?: number;
    valid_to?: number;
}

export interface Assignment {
    id: number;
    user_id: string;
    user_name?: string;
    service_id: string;
    service_name?: string;
    facility_id?: string;
    structure_no?: string;
    building_use?: string;
    role_name?: string;
    user_email?: string;
    valid_from?: number;
    valid_to?: number;
}

export interface Grant {
    id: number;
    service_id: string;
    service_name?: string;
    contract_id?: string;
    seat_limit?: number | null;
    valid_from?: number;
    valid_to?: number;
}

export interface Facility {
    id: string;
    structure_no?: string;
    building_use?: string;
    managing_group_id?: string;
    group_name?: string;
}

export interface GroupAdminPermission {
    id?: number | string;
    source?: string;
    app_name?: string;
    user_email?: string;
    valid_from?: number;
    valid_to?: number;
}

export interface Service {
    id: string;
    name: string;
    status: string;
    reason?: string;
    apps?: any[];
}

export interface AppInfo {
    id: string;
    name: string;
    status: string;
    reason?: string;
    base_url?: string;
    redirect_uris?: string;
    has_secret?: number;
}

export interface TagInfo {
    id: string;
    name: string;
}

export interface ServiceTag {
    service_id: string;
    tag_id: string;
    tag_name: string;
    status: string;
}

declare global {
    interface Window {
        // グローバル状態
        membersByGroup: Record<string, GroupMember[]> | null;
        assignsByGroup: Record<string, Assignment[]> | null;
        permsByGroup: Record<string, any[]> | null;
        grantsByGroup: Record<string, any[]> | null;
        facilities: Facility[] | null;
        rolesByService: Record<string, any[]> | null;
        grantsDetailByGroup: Record<string, Grant[]> | null;
        availableContracts: any[] | null;
        childrenByGroup: Record<string, any[]> | null;
        servicesByGroup: Record<string, Service[]> | null;
        appsByGroup: Record<string, AppInfo[]> | null;
        approvedAppsByGroup: Record<string, AppInfo[]> | null;
        serviceTagsByGroup: Record<string, ServiceTag[]> | null;
        customTagsByGroup: Record<string, any[]> | null;
        availableTags: TagInfo[];
        
        currentTab: string;
        currentGroupId: string;
        isBillingAdmin: boolean;
        
        // i18n
        i18n: any;
        __isBillingAdmin: boolean;

        // ライブラリ
        tsCtrl: any;
        TomSelect?: any;
        showAlert: (msg: string) => void;
        closeRemoveMemberModal: () => void;
        
        // 関数群（各モジュールで実装・アサインする）
        switchTab: (tab: string) => void;
        switchGroup: () => void;
        showConfirm: (message: string, callback: () => void) => void;
        closeConfirmModal: () => void;
        renderAll: () => void;
        loadRoleApprovals?: () => void;
        renderPerms: (list?: any) => void;
        // 共通ユーティリティ
        escapeHtml: (v: any) => string;
        fmt: (unixSec: any) => string;
        fillSelect: (el: any, items: any[], valueKey: string, textKey: string, placeholder: string) => void;
        childDistributedSeats: (groupId: string, serviceId: string) => number;
        
        // Member
        // Member
        renderMembers: (list?: any) => void;
        openAddModal: () => void;
        addMember: () => void;
        openCreateChildGroupModal: () => void;
        createChildGroup: () => void;
        removeMember: (userId: string) => void;
        closeRemoveModal: () => void;
        executeRemove: () => void;
        
        // Assignments
        renderAssignments: () => void;
        refreshAssignRoles: () => void;
        openAssignModal: () => void;
        addAssignment: () => void;
        removeAssignment: (aid: any) => void;
        closeRemoveAssignModal: () => void;
        executeRemoveAssignment: () => void;

        // Grants
        renderGrants: (list?: any) => void;
        openGrantModal: () => void;
        onGrantTargetChange: () => void;
        addGrant: () => void;
        removeGrant: (gid: any) => void;
        closeRemoveGrantModal: () => void;
        executeRemoveGrant: () => void;
        
        // Facilities
        renderFacilities: (list?: any) => void;
        addFacility: () => void;
        moveFacility: () => void;
        removeFacility: (fid: any) => void;
        loadAllFacilitiesForMove: (groupIdToExclude?: string) => void;

        // Developer / Apps / Services
        renderDeveloperUI?: () => void;
        applyDeveloper?: () => void;
        renderServices: () => void;
        openServiceModal: () => void;
        addService: () => void;
        removeService: (id: string) => void;
        reapplyService: (id: string) => void;
        
        manageServiceApps: (serviceId: string, serviceNameEnc: string) => void;
        removeServiceApp: (serviceId: any, appId: any) => void;
        openServiceAppsModal: (enc: any, availableApps: any, appsDataId?: string) => void;
        
        manageRoles: (serviceId: string, serviceNameEnc: string) => void;
        addRole: () => void;
        removeRole: (id: number) => void;
        
        openServiceTagsModal: (serviceId: string, serviceName: string) => void;
        applyServiceTag: () => void;
        removeServiceTag: (serviceId: string, tagId: string) => void;
        requestCustomTag: () => void;

        renderApps: () => void;
        openAppModal: () => void;
        addApp: () => void;
        openAppEditModal: (enc: string) => void;
        updateApp: () => void;
        removeApp: (id: string) => void;
        appSecretActionGa: (action: string) => void;

    }
}

export {};
