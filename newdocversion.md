# Warehouse Dashboard - Search Item API Documentation

## Endpoint: Search Single Item by Number or Name

### Request

**Method:** `GET`

**URL:** `/api/warehouse/search-items`

**Query Parameters:**
- `query` (required): Item number or name to search for (رقم أو اسم الصنف)
- `facility` (optional): Facility name to filter results by specific facility

**Example Request:**
```
GET /api/warehouse/search-items?query=12345
GET /api/warehouse/search-items?query=صنف%20اختبار
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Response

**Success Response (200 OK):**

Returns data for a single matched item with complete details.

```json
{
  "success": true,
  "message": "Item found successfully",
  "data": {
    "itemNumber": "12345",
    "itemName": "صنف اختبار",
    "receivedQty": 200,
    "issuedQty": 50,
    "availableQty": 150,
    "minQuantity": 20,
    "purchaseValue": 15000.00,
    "deliveryDate": "2025-01-10T00:00:00Z",
    "supplierName": "شركة التوريد الأولى",
    "facility_id": "facility_001",
    "facilityName": "المنشأة الرئيسية",
    "notes": "صنف عالي الجودة",
    "image": "https://example.com/images/item12345.jpg",
    "invoiceNumber": "INV-2025-001",
    "invoiceDate": "2025-01-05T00:00:00Z",
    "supplierContact": "+966 50 123 4567",
    "withdrawalOrdersCount": 15,
    "refusedOrders": 2,
    "withdrawalOrders": [
      {
        "id": 101,
        "orderNumber": "WO-001",
        "facility_id": 5,
        "facilityName": "مستشفى الملك فهد",
        "requestStatus": "موافق",
        "withdrawQty": 10,
        "withdrawDate": "2025-01-15T00:00:00.000Z",
        "recipientName": "أحمد محمد",
        "recipientContact": "+966 50 123 4567",
        "notes": "طلب عاجل",
        "created_at": "2025-01-10T10:30:00.000Z"
      },
      {
        "id": 102,
        "orderNumber": "WO-002",
        "facility_id": 7,
        "facilityName": "مركز الرعاية الصحية",
        "requestStatus": "تم التسليم",
        "withdrawQty": 5,
        "withdrawDate": "2025-01-16T00:00:00.000Z",
        "recipientName": "سارة علي",
        "recipientContact": "+966 55 987 6543",
        "notes": null,
        "created_at": "2025-01-11T14:20:00.000Z"
      }
    ]
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Item not found",
  "errors": ["No item matches the search criteria"]
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Search query is required",
  "errors": ["query parameter is missing"]
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Authentication required",
  "errors": ["Invalid or missing token"]
}
```

---

### Response Fields Description

| Field | Type | Description |
|-------|------|-------------|
| `itemNumber` | string | Unique item identification number (رقم الصنف) |
| `itemName` | string | Name of the item (اسم الصنف) |
| `receivedQty` | number | Total quantity received (الكمية المستلمة) |
| `issuedQty` | number | Total quantity issued/dispensed (الكمية المصروفة) |
| `availableQty` | number | Available quantity in stock (الكمية المتاحة) |
| `minQuantity` | number | Minimum stock level threshold (الحد الأدنى) |
| `purchaseValue` | number | Total purchase value (القيمة الشرائية) |
| `deliveryDate` | string (ISO 8601) | Date of delivery (تاريخ التسليم) |
| `supplierName` | string | Name of the supplier (اسم المورد) |
| `facility_id` | string | Facility identifier (معرف المنشأة) |
| `facilityName` | string | Name of the facility (اسم المنشأة) |
| `notes` | string | Additional notes (ملاحظات) |
| `image` | string (URL) | Item image URL (صورة الصنف) |
| `invoiceNumber` | string | Invoice number (رقم الفاتورة) |
| `invoiceDate` | string (ISO 8601) | Invoice date (تاريخ الفاتورة) |
| `supplierContact` | string | Supplier contact information (جهة الاتصال بالمورد) |
| `withdrawalOrdersCount` | number | Total count of completed/issued withdrawal orders for this item (عدد الطلبات المصروفة) |
| `refusedOrders` | number | Count of refused withdrawal orders for this item (عدد الطلبات المرفوضة) |
| `withdrawalOrders` | array | Array of all withdrawal orders for this item with full details (طلبات الصرف) |

---

### Notes

1. The search returns data for **ONE single item only**
2. The search should be case-insensitive for Arabic and English text
3. The search should match exact or partial item numbers and names
4. If multiple items match, return the first/best match
5. If `facility` parameter is provided, filter results to that specific facility only
6. All date/time values should be in ISO 8601 format
7. Arabic text should be properly encoded in UTF-8
8. Numeric values should use proper decimal formatting for currency/quantities
9. **`withdrawalOrdersCount`**: Total count of completed/issued withdrawal orders for this item
10. **`refusedOrders`**: Count of refused withdrawal orders for this item
11. **`withdrawalOrders`**: Array containing all withdrawal orders with details including:
    - `id`: Order ID
    - `orderNumber`: Order number (e.g., "WO-001")
    - `facility_id`: Facility ID
    - `facilityName`: Name of facility requesting the withdrawal
    - `requestStatus`: Status of the request (e.g., "موافق", "تم التسليم", "مرفوض")
    - `withdrawQty`: Quantity withdrawn
    - `withdrawDate`: Date of withdrawal
    - `recipientName`: Name of recipient
    - `recipientContact`: Contact of recipient
    - `notes`: Additional notes (can be null)
    - `created_at`: Order creation timestamp

---

### Implementation Priority

This API is needed for the warehouse dashboard search functionality (رقم او اسم صنف input field) to display single item details.
