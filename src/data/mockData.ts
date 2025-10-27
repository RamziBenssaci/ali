// Mock data for the management system

export const mockFacilities = [
  { id: '1', name: 'مركز الملك عبدالله الصحي', contact: '0112345678', manager: 'د. أحمد محمد', medicalManager: 'د. فاطمة علي' },
  { id: '2', name: 'مستشفى الرياض العام', contact: '0112345679', manager: 'د. محمد عبدالله', medicalManager: 'د. سارة أحمد' },
  { id: '3', name: 'مركز صحي النخيل', contact: '0112345680', manager: 'د. عبدالرحمن سالم', medicalManager: 'د. نورا محمد' },
  { id: '4', name: 'مستشفى الملك سلمان', contact: '0112345681', manager: 'د. خالد علي', medicalManager: 'د. منى عبدالله' }
];

export const reportCategories = [
  'صيانة طبية',
  'صيانة عامة', 
  'تموين',
  'أمن وسلامة',
  'تقنية المعلومات',
  'أخرى'
];

export const reportStatuses = [
  'مفتوح',
  'مغلق',
  'مكهن'
];

export const mockReports = [
  {
    id: 'R001',
    facilityName: 'مستشفى الرياض العام',
    category: 'صيانة طبية',
    deviceType: 'جهاز أشعة',
    description: 'عطل في نظام التصوير',
    serialNumber: 'XR-2023-001',
    warrantyStatus: 'تحت الضمان',
    supplierName: 'شركة الأجهزة الطبية المتقدمة',
    supplierContact: '0112345600',
    reporterName: 'أحمد محمد',
    reporterContact: '0501234567',
    reporterEmail: 'ahmed@hospital.sa',
    responsibleDept: 'قسم الصيانة الطبية',
    deptContact: '0112345601',
    deptEmail: 'maintenance@hospital.sa',
    reportDate: '2024-01-15',
    status: 'مفتوح',
    downtime: 3
  },
  {
    id: 'R002',
    facilityName: 'مركز الملك عبدالله الصحي',
    category: 'تقنية المعلومات',
    deviceType: 'خادم البيانات',
    description: 'بطء في الشبكة',
    serialNumber: 'SRV-2023-002',
    warrantyStatus: 'خارج الضمان',
    supplierName: 'شركة التقنية المتطورة',
    supplierContact: '0112345602',
    reporterName: 'فاطمة علي',
    reporterContact: '0501234568',
    reporterEmail: 'fatima@health.sa',
    responsibleDept: 'قسم تقنية المعلومات',
    deptContact: '0112345603',
    deptEmail: 'it@health.sa',
    reportDate: '2024-01-14',
    status: 'مغلق',
    downtime: 1
  }
];

export const mockInventoryItems = [
  {
    id: 'INV001',
    itemNumber: 'MED-001',
    itemName: 'قفازات طبية',
    receivedQty: 1000,
    issuedQty: 300,
    availableQty: 700,
    minQuantity: 100,
    purchaseValue: 500,
    deliveryDate: '2024-01-10',
    supplierName: 'شركة المستلزمات الطبية',
    beneficiaryFacility: 'مستشفى الرياض العام',
    notes: 'جودة ممتازة'
  },
  {
    id: 'INV002',
    itemNumber: 'MED-002',
    itemName: 'شاش طبي',
    receivedQty: 500,
    issuedQty: 200,
    availableQty: 300,
    minQuantity: 50,
    purchaseValue: 300,
    deliveryDate: '2024-01-12',
    supplierName: 'شركة الأدوات الطبية',
    beneficiaryFacility: 'مركز الملك عبدالله الصحي',
    notes: 'معقم'
  }
];

export const purchaseOrderStatuses = [
  'جديد',
  'موافق عليه',
  'تم التعاقد',
  'تم التسليم',
  'مرفوض'
];

export const mockPurchaseOrders = [
  {
    id: 'PO001',
    orderDate: '2024-01-15',
    itemNumber: 'MED-003',
    itemName: 'أدوية مسكنة',
    quantity: 100,
    beneficiaryFacility: 'مستشفى الرياض العام',
    financialApprovalNumber: 'FA-2024-001',
    approvalDate: '2024-01-16',
    totalCost: 5000,
    supplierName: 'شركة الأدوية المتقدمة',
    supplierContact: '0112345700',
    status: 'موافق عليه',
    deliveryDate: '2024-01-25',
    notes: 'عاجل'
  }
];

export const mockAssets = [
  {
    id: 'AST001',
    deviceName: 'جهاز أشعة سينية',
    serialNumber: 'XR-2023-001',
    facilityName: 'مستشفى الرياض العام',
    supplierName: 'شركة الأجهزة الطبية المتقدمة',
    supplierContact: '0112345600',
    supplierEmail: 'info@medical-devices.sa',
    deviceModel: 'XR-Pro-2023',
    deliveryDate: '2023-06-15',
    installationDate: '2023-06-20',
    warrantyPeriod: 2,
    warrantyStatus: 'تحت الضمان',
    deviceStatus: 'يعمل',
    notes: 'جهاز حديث',
    malfunctionCount: 1,
    outOfWarrantyDays: 0
  }
];

export const transactionTypes = [
  'خطاب',
  'ايميل',
  'أخرى'
];

export const transactionStatuses = [
  'مفتوح تحت الاجراء',
  'منجز',
  'مرفوض'
];

export const mockTransactions = [
  {
    id: 'TR001',
    transactionNumber: 'T-2024-001',
    receiveDate: '2024-01-15',
    subject: 'طلب تحديث الأجهزة الطبية',
    type: 'خطاب',
    senderEntity: 'وزارة الصحة',
    transferredTo: 'قسم الصيانة الطبية',
    status: 'مفتوح تحت الاجراء',
    notes: 'يتطلب متابعة عاجلة'
  }
];

export const dentalClinicsData = {
  riyadhInside: {
    eastRiyadh: { total: 25, inactive: 1, outOfOrder: 4, working: 20, facilities: 22 },
    northRiyadh: { total: 22, inactive: 0, outOfOrder: 3, working: 19, facilities: 16 },
    specializedCenters: { total: 88, inactive: 0, outOfOrder: 0, working: 88, facilities: 3 },
    hospitals: { total: 60, inactive: 0, outOfOrder: 1, working: 59, facilities: 3 }
  },
  riyadhOutside: {
    healthCenters: { total: 37, inactive: 3, outOfOrder: 5, working: 29, facilities: 36 },
    hospitals: { total: 22, inactive: 0, outOfOrder: 1, working: 21, facilities: 7 }
  }
};