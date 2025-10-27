// API Configuration and Utilities

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.dental-op.com/api';

/**
 * Get file type from URL or filename
 * @param fileUrl - The file URL or filename
 * @returns 'image' | 'pdf' | 'unknown'
 */
export const getFileType = (fileUrl: string): 'image' | 'pdf' | 'unknown' => {
  const lowerUrl = fileUrl.toLowerCase();
  if (lowerUrl.includes('.pdf')) return 'pdf';
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
  return 'unknown';
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    department?: string;
    position?: string;
    created_at: string;
    updated_at: string;
  };
}

// API Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get stored token based on user type
export const getStoredToken = (userType: 'admin' | 'staff'): string | null => {
  return localStorage.getItem(`${userType}_token`);
};

// Get stored user data
export const getStoredUser = (userType: 'admin' | 'staff') => {
  const userData = localStorage.getItem(`${userType}_user`);
  return userData ? JSON.parse(userData) : null;
};

// Clear stored auth data - ENHANCED VERSION WITH DEBUGGING
export const clearAuthData = (userType: 'admin' | 'staff') => {
  console.log(`🔍 BEFORE clearAuthData for ${userType}:`);
  console.log(`Token exists: ${!!localStorage.getItem(`${userType}_token`)}`);
  console.log(`User exists: ${!!localStorage.getItem(`${userType}_user`)}`);
  console.log(`Token value: ${localStorage.getItem(`${userType}_token`)?.substring(0, 20)}...`);
  
  // Clear the data
  localStorage.removeItem(`${userType}_token`);
  localStorage.removeItem(`${userType}_user`);
  
  // Verify it's actually cleared
  console.log(`🔍 AFTER clearAuthData for ${userType}:`);
  console.log(`Token exists: ${!!localStorage.getItem(`${userType}_token`)}`);
  console.log(`User exists: ${!!localStorage.getItem(`${userType}_user`)}`);
  
  // Optional: Clear any other related cached data
  // localStorage.removeItem('cached_facilities');
  // localStorage.removeItem('cached_dashboard');
  
  console.log(`✅ Cleared ${userType} authentication data`);
};

// Helper function to determine current user type
const getCurrentUserType = (): 'admin' | 'staff' => {
  const adminToken = getStoredToken('admin');
  const staffToken = getStoredToken('staff');
  
  if (adminToken) return 'admin';
  if (staffToken) return 'staff';
  return 'staff'; // fallback
};

// Generic API call function - ENHANCED WITH TOKEN EXPIRATION HANDLING
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = false,
  userType?: 'admin' | 'staff'
): Promise<T> => {
  // Determine userType if not provided
  const actualUserType = userType || getCurrentUserType();
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add authentication header if required
  if (requiresAuth) {
    const token = getStoredToken(actualUserType);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle unauthorized responses (token expired/invalid)
    if (response.status === 401) {
      console.warn('Token expired or invalid, clearing auth data');
      clearAuthData(actualUserType);
      
      // Optionally redirect to login (uncomment if needed)
      // window.location.href = '/login';
      
      throw new ApiError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 401);
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || 'حدث خطأ غير متوقع',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
  }
};

// API call with FormData for file uploads
export const apiCallWithFiles = async <T = any>(
  endpoint: string,
  formData: FormData,
  requiresAuth = true,
  userType?: 'admin' | 'staff'
): Promise<T> => {
  const actualUserType = userType || getCurrentUserType();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  // Note: Don't set Content-Type for FormData, browser will set it with boundary

  if (requiresAuth) {
    const token = getStoredToken(actualUserType);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (response.status === 401) {
      console.warn('Token expired or invalid, clearing auth data');
      clearAuthData(actualUserType);
      throw new ApiError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 401);
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || 'حدث خطأ غير متوقع',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
  }
};

// Authentication API calls - UPDATED WITH PROPER LOGOUT HANDLING
export const authApi = {
  // Admin login
  adminLogin: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
    return apiCall<LoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Staff login
  staffLogin: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
    return apiCall<LoginResponse>('/staff/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Admin logout - FIXED VERSION WITH ENHANCED DEBUGGING
  adminLogout: async (): Promise<ApiResponse> => {
    console.log('🚪 Starting admin logout process...');
    
    try {
      console.log('📡 Calling admin logout API...');
      
      // Call the logout API
      const response = await apiCall<ApiResponse>('/admin/logout', {
        method: 'POST',
      }, true, 'admin');
      
      console.log('✅ Admin logout API successful:', response);
      console.log('🧹 About to clear stored data...');
      
      // Clear stored data after successful logout
      clearAuthData('admin');
      
      console.log('🏁 Admin logout process completed successfully');
      return response;
    } catch (error) {
      console.error('❌ Admin logout API failed:', error);
      console.log('🧹 Clearing local data anyway...');
      
      // Even if the API call fails, clear local data
      // (in case token is invalid/expired)
      clearAuthData('admin');
      
      console.log('🏁 Admin logout process completed (with API error)');
      
      // Re-throw the error so the calling component can handle it
      throw error;
    }
  },

  // Staff logout - FIXED VERSION WITH ENHANCED DEBUGGING
  staffLogout: async (): Promise<ApiResponse> => {
    console.log('🚪 Starting staff logout process...');
    
    try {
      console.log('📡 Calling staff logout API...');
      
      // Call the logout API
      const response = await apiCall<ApiResponse>('/staff/logout', {
        method: 'POST',
      }, true, 'staff');
      
      console.log('✅ Staff logout API successful:', response);
      console.log('🧹 About to clear stored data...');
      
      // Clear stored data after successful logout
      clearAuthData('staff');
      
      console.log('🏁 Staff logout process completed successfully');
      return response;
    } catch (error) {
      console.error('❌ Staff logout API failed:', error);
      console.log('🧹 Clearing local data anyway...');
      
      // Even if the API call fails, clear local data
      // (in case token is invalid/expired)
      clearAuthData('staff');
      
      console.log('🏁 Staff logout process completed (with API error)');
      
      // Re-throw the error so the calling component can handle it
      throw error;
    }
  },

  // Verify authentication status
  verifyAuth: async (): Promise<ApiResponse> => {
    return apiCall<ApiResponse>('/auth/verify', {
      method: 'GET',
    }, true);
  },
};

// Alternative unified logout function - ENHANCED WITH DEBUGGING
export const logout = async (userType: 'admin' | 'staff'): Promise<void> => {
  console.log(`🚪 Starting unified ${userType} logout...`);
  
  try {
    console.log(`📡 Calling ${userType} logout API...`);
    
    // Determine the correct logout endpoint
    const endpoint = userType === 'admin' ? '/admin/logout' : '/staff/logout';
    
    // Call the logout API
    await apiCall<ApiResponse>(endpoint, {
      method: 'POST',
    }, true, userType);
    
    console.log(`✅ ${userType} logout API successful, clearing stored data...`);
    
    // Clear stored data after successful logout
    clearAuthData(userType);
  } catch (error) {
    console.warn(`❌ ${userType} logout API failed, but clearing local data anyway:`, error);
    
    // Even if the API call fails, clear local data
    // This handles cases where the token is already invalid/expired
    clearAuthData(userType);
  }
  
  console.log(`🏁 Unified ${userType} logout completed`);
};

// DEBUGGING UTILITY FUNCTIONS
export const debugAuthState = () => {
  console.log('🔍 CURRENT AUTH STATE:');
  console.log('Admin token:', localStorage.getItem('admin_token')?.substring(0, 20) + '...' || 'null');
  console.log('Staff token:', localStorage.getItem('staff_token')?.substring(0, 20) + '...' || 'null');
  console.log('Admin user:', !!localStorage.getItem('admin_user'));
  console.log('Staff user:', !!localStorage.getItem('staff_user'));
  console.log('isAuthenticated(admin):', isAuthenticated('admin'));
  console.log('isAuthenticated(staff):', isAuthenticated('staff'));
  console.log('getCurrentUserType():', getCurrentUserType());
  
  // Show all localStorage keys that might be related
  const allKeys = Object.keys(localStorage);
  const authKeys = allKeys.filter(key => key.includes('token') || key.includes('user') || key.includes('admin') || key.includes('staff'));
  console.log('All auth-related localStorage keys:', authKeys);
};

// Force clear all auth data (nuclear option)
export const forceLogoutAll = () => {
  console.log('☢️  FORCE CLEARING ALL AUTH DATA');
  
  const allKeys = Object.keys(localStorage);
  const authKeys = allKeys.filter(key => 
    key.includes('token') || 
    key.includes('user') || 
    key.includes('admin') || 
    key.includes('staff')
  );
  
  console.log('Removing keys:', authKeys);
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  });
  
  console.log('✅ Force logout completed');
  debugAuthState();
};

// Reports API calls
export const reportsApi = {
  // Get all facilities for dropdown
  getFacilities: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/facilities', {
      method: 'GET',
    }, true);
  },

  // Create new report
  createReport: async (reportData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }, true);
  },

  // Get all reports
  getReports: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/reports', {
      method: 'GET',
    }, true);
  },

  // Update report
  updateReport: async (reportId: string, reportData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    }, true);
  },

  // Delete report
  deleteReport: async (reportId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/reports/${reportId}`, {
      method: 'DELETE',
    }, true);
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/reports/dashboard', {
      method: 'GET',
    }, true);
  },

  // Get serial number by facility and device name
  getSerialNumber: async (facilityId: string, deviceName: string): Promise<ApiResponse<{ serial_number: string }>> => {
    return apiCall<ApiResponse<{ serial_number: string }>>('/get-serial-number', {
      method: 'POST',
      body: JSON.stringify({
        facility_id: facilityId,
        device_name: deviceName
      }),
    }, true);
  },
};

// Warehouse API calls
export const warehouseApi = {
  // Get all inventory items
  getInventory: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/warehouse/inventory', {
      method: 'GET',
    }, true);
  },

  // Add new inventory item
  addInventoryItem: async (itemData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    Object.keys(itemData).forEach(key => {
      if (itemData[key] !== null && itemData[key] !== undefined) {
        if (itemData[key] instanceof File) {
          formData.append(key, itemData[key]);
        } else {
          formData.append(key, itemData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>('/warehouse/inventory', formData, true);
  },

  // Update inventory item
  updateInventoryItem: async (itemId: string, itemData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.keys(itemData).forEach(key => {
      if (itemData[key] !== null && itemData[key] !== undefined) {
        if (itemData[key] instanceof File) {
          formData.append(key, itemData[key]);
        } else {
          formData.append(key, itemData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>(`/warehouse/inventory/${itemId}`, formData, true);
  },

  // Delete inventory item
  deleteInventoryItem: async (itemId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/warehouse/inventory/${itemId}`, {
      method: 'DELETE',
    }, true);
  },

  // Create withdrawal order
  createWithdrawalOrder: async (orderData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    Object.keys(orderData).forEach(key => {
      if (orderData[key] !== null && orderData[key] !== undefined) {
        if (orderData[key] instanceof File) {
          formData.append(key, orderData[key]);
        } else {
          formData.append(key, orderData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>('/warehouse/withdrawal-orders', formData, true);
  },

  // Update withdrawal order
  updateWithdrawalOrder: async (orderId: string, orderData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.keys(orderData).forEach(key => {
      if (orderData[key] !== null && orderData[key] !== undefined) {
        if (orderData[key] instanceof File) {
          formData.append(key, orderData[key]);
        } else {
          formData.append(key, orderData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>(`/warehouse/withdrawal-orders/${orderId}`, formData, true);
  },

  // Delete withdrawal order
  deleteWithdrawalOrder: async (orderId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/warehouse/withdrawal-orders/${orderId}`, {
      method: 'DELETE',
    }, true);
  },

  // Get warehouse dashboard data
  getDashboardData: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/warehouse/dashboard', {
      method: 'GET',
    }, true);
  },

  // Get top suppliers
  getTopSuppliers: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/warehouse/top-suppliers', {
      method: 'GET',
    }, true);
  },

  // Get dispensing data
  getDispensingData: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/warehouse/dispensing', {
      method: 'GET',
    }, true);
  },

  // Get dispensing operations
  getDispensingOperations: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/warehouse/dispensing/operations', {
      method: 'GET',
    }, true);
  },

  // Search items by number or name
  searchItems: async (query: string, facility?: string): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams({ query });
    if (facility) {
      params.append('facility', facility);
    }
    return apiCall<ApiResponse<any>>(`/warehouse/search-items?${params.toString()}`, {
      method: 'GET',
    }, true);
  },
};

// Check if user is authenticated
export const isAuthenticated = (userType: 'admin' | 'staff'): boolean => {
  const token = getStoredToken(userType);
  const user = getStoredUser(userType);
  return !!(token && user);
};

// Get current user
export const getCurrentUser = (userType: 'admin' | 'staff') => {
  return getStoredUser(userType);
};

// Direct Purchase API calls
export const directPurchaseApi = {
  // Create new direct purchase order
  createOrder: (orderData: any) => apiCall('/direct-purchase/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  }, true),
  
  updateOrderStatus: (orderId: string, statusData: { status: string }) => apiCall(`/direct-purchase/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statusData)
  }, true),
  
  // Get all direct purchase orders
  getOrders: () => apiCall('/direct-purchase/orders', {}, true),

  // Get specific direct purchase order
  getOrder: (id: string) => apiCall(`/direct-purchase/orders/${id}`, {}, true),

  // Update direct purchase order
  updateOrder: (id: string, orderData: any) => apiCall(`/direct-purchase/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  }, true),

  // Delete direct purchase order
  deleteOrder: (id: string) => apiCall(`/direct-purchase/orders/${id}`, {
    method: 'DELETE'
  }, true),

  // Get direct purchase reports
  getReports: (params?: { type?: string; status?: string; facility?: string; supplier?: string; item?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const queryString = searchParams.toString();
    return apiCall(`/direct-purchase/reports${queryString ? `?${queryString}` : ''}`, {}, true);
  },

  // Get direct purchase dashboard data
  getDashboardData: (params?: { facility?: string; item?: string; supplier?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const queryString = searchParams.toString();
    return apiCall(`/direct-purchase/dashboard${queryString ? `?${queryString}` : ''}`, {}, true);
  },
updateOrderFull: async (id: string, orderData: any): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  Object.keys(orderData).forEach(key => {
    if (orderData[key] !== null && orderData[key] !== undefined) {
      if (orderData[key] instanceof File) {
        formData.append(key, orderData[key]);
      } else {
        formData.append(key, orderData[key].toString());
      }
    }
  });
  return apiCallWithFiles<ApiResponse>(`/direct-purchase/orders/${id}/full-update`, formData, true);
},



  // Submit purchase order
  submitPurchaseOrder: async (orderData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    Object.keys(orderData).forEach(key => {
      if (orderData[key] !== null && orderData[key] !== undefined) {
        if (orderData[key] instanceof File) {
          formData.append(key, orderData[key]);
        } else {
          formData.append(key, orderData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>('/direct-purchase/submit', formData, true);
  },
};

// Dental Assets API calls
export const dentalAssetsApi = {
  // Create new dental asset
  createAsset: async (assetData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    Object.keys(assetData).forEach(key => {
      if (assetData[key] !== null && assetData[key] !== undefined) {
        if (assetData[key] instanceof File) {
          formData.append(key, assetData[key]);
        } else {
          formData.append(key, assetData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>('/dental/assets', formData, true);
  },

  // Get all dental assets
  getAssets: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/dental/assets', {
      method: 'GET',
    }, true);
  },

  // Get specific dental asset
  getAsset: async (assetId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/dental/assets/${assetId}`, {
      method: 'GET',
    }, true);
  },

  // Update dental asset
  updateAsset: async (assetId: string, assetData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.keys(assetData).forEach(key => {
      if (assetData[key] !== null && assetData[key] !== undefined) {
        if (assetData[key] instanceof File) {
          formData.append(key, assetData[key]);
        } else {
          formData.append(key, assetData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>(`/dental/assets/${assetId}`, formData, true);
  },

  // Delete dental asset
  deleteAsset: async (assetId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/dental/assets/${assetId}`, {
      method: 'DELETE',
    }, true);
  },

  // Get dental assets dashboard data
  getDashboardData: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/dental/assets/dashboard', {
      method: 'GET',
    }, true);
  },
};

// Dental Contracts API calls
export const dentalContractsApi = {
  // Create new dental contract
  createContract: async (contractData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    Object.keys(contractData).forEach(key => {
      if (contractData[key] !== null && contractData[key] !== undefined) {
        if (contractData[key] instanceof File) {
          formData.append(key, contractData[key]);
        } else {
          formData.append(key, contractData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>('/dental/contracts', formData, true);
  },
  updateContract: async (contractId: string, contractData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.keys(contractData).forEach(key => {
      if (contractData[key] !== null && contractData[key] !== undefined) {
        if (contractData[key] instanceof File) {
          formData.append(key, contractData[key]);
        } else {
          formData.append(key, contractData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>(`/dental/contracts/${contractId}`, formData, true);
  },

  // Delete dental contract
  deleteContract: async (contractId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/dental/contracts/${contractId}`, {
      method: 'DELETE',
    }, true);
  },
  
updateContractStatus: async (contractId: string, statusData: {
  newStatus: string;
  statusNote?: string;
  statusDate?: string;
}): Promise<ApiResponse> => {
  return apiCall<ApiResponse>(`/dental/contracts/${contractId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
  }, true);
},

// Get contract status history
getContractStatusHistory: async (contractId: string): Promise<ApiResponse<any[]>> => {
  return apiCall<ApiResponse<any[]>>(`/dental/contracts/${contractId}/status-history`, {
    method: 'GET',
  }, true);
},

// Bulk update multiple contracts status
bulkUpdateContractsStatus: async (contractIds: string[], statusData: {
  newStatus: string;
  statusNote?: string;
}): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('/dental/contracts/bulk-status-update', {
    method: 'PATCH',
    body: JSON.stringify({
      contract_ids: contractIds,
      ...statusData
    }),
  }, true);
},
  // Get all dental contracts
  getContracts: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/dental/contracts', {
      method: 'GET',
    }, true);
  },

  // Get specific dental contract
  getContract: async (contractId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/dental/contracts/${contractId}`, {
      method: 'GET',
    }, true);
  },

  // Get dental contracts dashboard data
  getDashboardData: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/dental/contracts/dashboard', {
      method: 'GET',
    }, true);
  },

  // Get dental contracts reports data
  getReportsData: async (reportType?: string): Promise<ApiResponse<any[]>> => {
    const params = reportType ? `?type=${encodeURIComponent(reportType)}` : '';
    return apiCall<ApiResponse<any[]>>(`/dental/contracts/reports${params}`, {
      method: 'GET',
    }, true);
  },

  // Get top suppliers for dental contracts
  getTopSuppliers: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/dental/contracts/top-suppliers', {
      method: 'GET',
    }, true);
  },

  // Get top clinics for dental contracts
  getTopClinics: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/dental/contracts/top-clinics', {
      method: 'GET',
    }, true);
  },
};

// Dashboard API endpoints
export const dashboardApi = {
  // Get main dashboard data
  getDashboardData: () => apiCall('/dashboard', {}, true),
  
  // Get facilities list
  getFacilities: () => apiCall('/facilities', {}, true),
  
  // Register new facility
  registerFacility: (data: any) => apiCall('/facilities', {
    method: 'POST',
    body: JSON.stringify(data)
  }, true),
  
  // Get recent reports
  getRecentReports: () => apiCall('/dashboard/recent-reports', {}, true)
};

// Items API for item number management
export const itemsApi = {
  getItems: (): Promise<ApiResponse> => apiCall('/items', { method: 'GET' }, true),
  getItemByNumber: (itemNumber: string): Promise<ApiResponse> => apiCall(`/items/${itemNumber}`, { method: 'GET' }, true),
};

// Facilities API calls
export const facilitiesApi = {
  // Get all facilities
  getFacilities: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/facilities', {
      method: 'GET',
    }, true);
  },

  // Create new facility
  createFacility: async (facilityData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>('/facilities', {
      method: 'POST',
      body: JSON.stringify(facilityData),
    }, true);
  },

  // Update facility
  updateFacility: async (facilityId: string, facilityData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/facilities/${facilityId}`, {
      method: 'PUT',
      body: JSON.stringify(facilityData),
    }, true);
  },

  // Toggle facility active status
  toggleFacilityStatus: async (facilityId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/facilities/${facilityId}/toggle-status`, {
      method: 'PATCH',
    }, true);
  },

  // Get facility statistics
  getFacilityStats: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/facilities/statistics', {
      method: 'GET',
    }, true);
  },

  // Delete facility
  deleteFacility: async (facilityId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/facilities/${facilityId}`, {
      method: 'DELETE',
    }, true);
  },
};

// Suppliers API calls
export const suppliersApi = {
  // Get all suppliers
  getSuppliers: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/suppliers', {
      method: 'GET',
    }, true);
  },

  // Get specific supplier
  getSupplier: async (supplierId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/suppliers/${supplierId}`, {
      method: 'GET',
    }, true);
  },

  // Create new supplier
  createSupplier: async (supplierData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    }, true);
  },

  // Update supplier
  updateSupplier: async (supplierId: string, supplierData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    }, true);
  },

  // Delete supplier
  deleteSupplier: async (supplierId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/suppliers/${supplierId}`, {
      method: 'DELETE',
    }, true);
  }
};

// Transactions API calls
export const transactionsApi = {
  // Create new transaction
  createTransaction: async (transactionData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    Object.keys(transactionData).forEach(key => {
      if (transactionData[key] !== null && transactionData[key] !== undefined) {
        if (transactionData[key] instanceof File) {
          formData.append(key, transactionData[key]);
        } else {
          formData.append(key, transactionData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>('/transactions', formData, true);
  },

  // Get all transactions
  getTransactions: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/transactions', {
      method: 'GET',
    }, true);
  },

  // Get specific transaction
  getTransaction: async (transactionId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/transactions/${transactionId}`, {
      method: 'GET',
    }, true);
  },

  // Update transaction
  updateTransaction: async (transactionId: string, transactionData: any): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.keys(transactionData).forEach(key => {
      if (transactionData[key] !== null && transactionData[key] !== undefined) {
        if (transactionData[key] instanceof File) {
          formData.append(key, transactionData[key]);
        } else {
          formData.append(key, transactionData[key].toString());
        }
      }
    });
    return apiCallWithFiles<ApiResponse>(`/transactions/${transactionId}`, formData, true);
  },

  // Delete transaction
  deleteTransaction: async (transactionId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/transactions/${transactionId}`, {
      method: 'DELETE',
    }, true);
  },

  // Get transaction transfer history
  getTransactionHistory: async (transactionId: string): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>(`/transactions/${transactionId}/history`, {
      method: 'GET',
    }, true);
  },

  // Get transaction types
  getTransactionTypes: async (): Promise<ApiResponse<string[]>> => {
    return apiCall<ApiResponse<string[]>>('/transactions/types', {
      method: 'GET',
    }, true);
  },

  // Get transaction statuses
  getTransactionStatuses: async (): Promise<ApiResponse<string[]>> => {
    return apiCall<ApiResponse<string[]>>('/transactions/statuses', {
      method: 'GET',
    }, true);
  },
updateTransactionStatus: async (transactionId: string, statusData: {
  newStatus: string;
  statusNote?: string;
}): Promise<ApiResponse> => {
  return apiCall<ApiResponse>(`/transactions/${transactionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
  }, true);
},

// Create transfer history for transaction
createTransferHistory: async (transferData: {
  transaction_id: string;
  date: string;
  from: string;
  to: string;
  notes?: string;
  transferredBy: string;
  imagebase64?: File;
  pdfbase64?: File;
}): Promise<ApiResponse> => {
  const formData = new FormData();
  Object.keys(transferData).forEach(key => {
    const value = (transferData as any)[key];
    if (value !== null && value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  return apiCallWithFiles<ApiResponse>('/transactions/transfer-history', formData, true);
},

// Get transfer history for specific transaction
getTransferHistory: async (transactionId: string): Promise<ApiResponse<any[]>> => {
  return apiCall<ApiResponse<any[]>>(`/transactions/${transactionId}/transfer-history`, {
    method: 'GET',
  }, true);
},

// Get all transfer histories (admin view)
getAllTransferHistories: async (): Promise<ApiResponse<any[]>> => {
  return apiCall<ApiResponse<any[]>>('/transactions/transfer-histories', {
    method: 'GET',
  }, true);
},
  // Get transactions dashboard data
  getDashboardData: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/transactions/dashboard', {
      method: 'GET',
    }, true);
  }
};

// Staff Management API calls
export const staffApi = {
  // Create new staff member
  createStaff: async (staffData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    }, true, 'admin');
  },

  // Get all staff members
  getStaff: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<ApiResponse<any[]>>('/admin/staff', {
      method: 'GET',
    }, true, 'admin');
  },

  // Get specific staff member
  getStaffMember: async (staffId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/admin/staff/${staffId}`, {
      method: 'GET',
    }, true, 'admin');
  },

  // Update staff member
  updateStaff: async (staffId: string, staffData: any): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/admin/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    }, true, 'admin');
  },

  // Delete staff member
  deleteStaff: async (staffId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/admin/staff/${staffId}`, {
      method: 'DELETE',
    }, true, 'admin');
  },

  // Get staff statistics
  getStaffStats: async (): Promise<ApiResponse<any>> => {
    return apiCall<ApiResponse<any>>('/admin/staff/statistics', {
      method: 'GET',
    }, true, 'admin');
  },

  // Toggle staff active status
  toggleStaffStatus: async (staffId: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/admin/staff/${staffId}/toggle-status`, {
      method: 'PATCH',
    }, true, 'admin');
  },

  // Reset staff password
  resetStaffPassword: async (staffId: string, newPassword: string): Promise<ApiResponse> => {
    return apiCall<ApiResponse>(`/admin/staff/${staffId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    }, true, 'admin');
  }
};
