import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Find the file we just created in the root folder
    const filePath = path.join(process.cwd(), 'routes.json');
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Send it to the frontend
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error reading routes.json:", error);
    return NextResponse.json({}, { status: 500 });
  }
}