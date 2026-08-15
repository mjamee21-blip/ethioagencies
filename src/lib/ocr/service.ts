export interface PassportDetails {
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  passportNumber: string;
  dateOfBirth: string; // ISO format YYYY-MM-DD
  nationality: string;
  issueDate: string; // ISO format YYYY-MM-DD
  expiryDate: string; // ISO format YYYY-MM-DD
  gender: string; // "male", "female", "other"
}

export interface OCRResult {
  success: boolean;
  confidence: number;
  data?: PassportDetails;
  rawText?: string;
  error?: string;
}

export interface DocumentOCRService {
  extractPassport(fileBufferOrUrl: string): Promise<OCRResult>;
}

export class MockPassportOCRService implements DocumentOCRService {
  async extractPassport(fileUrlOrData: string): Promise<OCRResult> {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock extraction based on file name or default mock data
    if (fileUrlOrData.includes("invalid") || fileUrlOrData.includes("bad")) {
      return {
        success: false,
        confidence: 0.1,
        error: "Could not detect valid passport Machine Readable Zone (MRZ) or text.",
      };
    }

    // Return realistic mock extracted passport details
    return {
      success: true,
      confidence: 0.96,
      rawText: "P<ETHABBED<<ALEMAYEHU<<<<<<<<<<<<<<<<<<<<<<<\nEP1234567<3ETH8801014M2801015<<<<<<<<<<<<<<06",
      data: {
        fullName: "Alemayehu Abebe Kebede",
        firstName: "Alemayehu",
        lastName: "Kebede",
        middleName: "Abebe",
        passportNumber: "EP1234567",
        dateOfBirth: "1988-01-01",
        nationality: "Ethiopian",
        issueDate: "2018-01-01",
        expiryDate: "2028-01-01",
        gender: "male",
      },
    };
  }
}

export const ocrService: DocumentOCRService = new MockPassportOCRService();
