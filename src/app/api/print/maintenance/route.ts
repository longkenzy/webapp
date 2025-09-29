import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const data = await request.json();
    
    // Validate required fields
    if (!data.partnerName || !data.maintenancePersonName || !data.formattedDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Read template file
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'maintenance-report.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 404 });
    }

    const templateBuffer = fs.readFileSync(templatePath);
    const zip = new PizZip(templateBuffer);
    
    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Set template variables
    doc.setData({
      // Partner info (bên nhận bảo trì)
      partnerName: data.partnerName || '',
      partnerAddress: data.partnerAddress || '',
      receivingPerson: data.receivingPerson || '',
      
      // Employee info (bên bảo trì)
      maintenanceCompanyName: data.maintenanceCompanyName || 'CÔNG TY TNHH CÔNG NGHỆ - DỊCH VỤ SMART SERVICES',
      maintenanceCompanyAddress: data.maintenanceCompanyAddress || 'Tòa nhà MIOS, 121 Hoàng Hoa Thám, Phường Gia Định, TP. Hồ Chí Minh',
      maintenancePersonName: data.maintenancePersonName || '',
      maintenancePersonPosition: data.maintenancePersonPosition || '',
      maintenancePersonPhone: data.maintenancePersonPhone || '',
      
        // Maintenance details
        formattedDate: data.formattedDate || '',
      
      // Equipment info (có thể thêm sau)
      equipmentName: data.equipmentName || 'Thiết bị IT',
      equipmentCode: data.equipmentCode || 'N/A',
      location: data.location || 'Văn phòng'
    });

    // Generate document
    doc.render();
    
    // Get generated buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 4,
      },
    });

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', `attachment; filename="bien-ban-bao-tri-${new Date().toISOString().split('T')[0]}.docx"`);
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer as any, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error generating maintenance document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
