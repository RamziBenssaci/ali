import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToExcel = (data: any[], filename: string = 'البلاغات') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet format
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'البلاغات');
    
    // Write the file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('فشل في تصدير البيانات إلى Excel');
  }
};

export const exportToPDF = (data: any[], filename: string = 'البلاغات', reportType: 'reports' | 'direct-purchase' | 'warehouse' = 'reports') => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add Arabic font support (basic)
    doc.setFont('helvetica');
    
    let title = 'تقرير البلاغات';
    let headers: string[] = [];
    let tableData: any[][] = [];
    
    if (reportType === 'direct-purchase') {
      title = 'تقرير الشراء المباشر';
      headers = ['رقم الطلب', 'رقم الصنف', 'اسم الصنف', 'الجهة المستفيدة', 'المورد', 'الحالة', 'التكلفة', 'التاريخ'];
      tableData = data.map(item => [
        item.id || '',
        item.itemNumber || '',
        item.deviceType || item.itemName || '',
        item.facilityName || '',
        item.supplier || '',
        item.status || '',
        item.totalCost ? `${item.totalCost.toLocaleString()} ريال` : '',
        item.reportDate || ''
      ]);
    } else if (reportType === 'warehouse') {
      title = 'قائمة المستودع';
      headers = ['رقم الصنف', 'اسم الصنف', 'الكمية المتاحة', 'الحد الأدنى', 'قيمة الشراء', 'الشركة الموردة'];
      tableData = data.map(item => [
        item.itemNumber || '',
        item.itemName || '',
        item.availableQty?.toString() || '0',
        item.minQuantity?.toString() || '0',
        item.purchaseValue ? `${parseFloat(item.purchaseValue).toLocaleString()} ريال` : '',
        item.supplierName || ''
      ]);
    } else {
      // Default reports format
      headers = ['رقم البلاغ', 'المنشأة', 'الفئة', 'نوع الجهاز', 'الحالة', 'التاريخ'];
      tableData = data.map(item => [
        item.id || '',
        item.facilityName || '',
        item.category || '',
        item.deviceType || '',
        item.status || '',
        item.reportDate || ''
      ]);
    }
    
    // Set document direction to RTL
    doc.text(title, 105, 20, { align: 'center' });
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, 105, 30, { align: 'center' });
    
    // Create table
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        font: 'helvetica',
        fontSize: reportType === 'direct-purchase' ? 7 : 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: reportType === 'direct-purchase' ? [102, 51, 153] : reportType === 'warehouse' ? [34, 139, 34] : [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: 50,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 40, right: 14, bottom: 20, left: 14 },
      columnStyles: reportType === 'direct-purchase' ? {
        0: { cellWidth: 20 }, // رقم الطلب
        1: { cellWidth: 20 }, // رقم الصنف
        2: { cellWidth: 30 }, // اسم الصنف
        3: { cellWidth: 25 }, // الجهة المستفيدة
        4: { cellWidth: 25 }, // المورد
        5: { cellWidth: 20 }, // الحالة
        6: { cellWidth: 25 }, // التكلفة
        7: { cellWidth: 20 }  // التاريخ
      } : reportType === 'warehouse' ? {
        0: { cellWidth: 25 }, // رقم الصنف
        1: { cellWidth: 40 }, // اسم الصنف
        2: { cellWidth: 25 }, // الكمية المتاحة
        3: { cellWidth: 25 }, // الحد الأدنى
        4: { cellWidth: 25 }, // قيمة الشراء
        5: { cellWidth: 40 }  // الشركة الموردة
      } : {}
    });
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('فشل في تصدير البيانات إلى PDF');
  }
};