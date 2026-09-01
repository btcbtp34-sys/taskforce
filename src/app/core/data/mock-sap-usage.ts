import { SapUsageRecord } from '../models/sap-data.model';

export const INITIAL_SAP_USAGE_RECORDS: SapUsageRecord[] = [
  { id: 'usr-1', userName: 'Ahmet Yılmaz', department: 'Finance', sapModule: 'FI', licenseType: 'Professional', monthlyTransactions: 2500, annualLicenseCost: 5000, manualWorkHours: 120, usageFrequency: 'High', status: 'Normal' },
  { id: 'usr-2', userName: 'Selin Arslan', department: 'Finance', sapModule: 'FI-CO', licenseType: 'Professional', monthlyTransactions: 45, annualLicenseCost: 5000, manualWorkHours: 180, usageFrequency: 'Low', status: 'Overlicensed' },
  { id: 'usr-3', userName: 'Burak Kaya', department: 'Finance', sapModule: 'FI', licenseType: 'Professional', monthlyTransactions: 30, annualLicenseCost: 5000, manualWorkHours: 210, usageFrequency: 'Low', status: 'Automation Candidate' },
  { id: 'usr-4', userName: 'Deniz Şahin', department: 'Human Resources', sapModule: 'HCM', licenseType: 'Employee', monthlyTransactions: 1200, annualLicenseCost: 1200, manualWorkHours: 40, usageFrequency: 'High', status: 'Normal' },
  { id: 'usr-5', userName: 'Merve Ozturk', department: 'Procurement', sapModule: 'MM', licenseType: 'Professional', monthlyTransactions: 3100, annualLicenseCost: 5000, manualWorkHours: 95, usageFrequency: 'High', status: 'Normal' },
  { id: 'usr-6', userName: 'Emre Celik', department: 'Procurement', sapModule: 'MM', licenseType: 'Professional', monthlyTransactions: 80, annualLicenseCost: 5000, manualWorkHours: 240, usageFrequency: 'Low', status: 'Automation Candidate' },
  { id: 'usr-7', userName: 'Zeynep Aksoy', department: 'Sales & Distribution', sapModule: 'SD', licenseType: 'Professional', monthlyTransactions: 4200, annualLicenseCost: 5000, manualWorkHours: 60, usageFrequency: 'High', status: 'Normal' },
  { id: 'usr-8', userName: 'Kerem Yildiz', department: 'Sales & Distribution', sapModule: 'SD', licenseType: 'Professional', monthlyTransactions: 55, annualLicenseCost: 5000, manualWorkHours: 190, usageFrequency: 'Low', status: 'Overlicensed' },
  { id: 'usr-9', userName: 'Elif Kaplan', department: 'IT', sapModule: 'BASIS', licenseType: 'Developer', monthlyTransactions: 1800, annualLicenseCost: 6500, manualWorkHours: 85, usageFrequency: 'High', status: 'Normal' },
  { id: 'usr-10', userName: 'Omer Eren', department: 'Supply Chain', sapModule: 'PP', licenseType: 'Professional', monthlyTransactions: 90, annualLicenseCost: 5000, manualWorkHours: 220, usageFrequency: 'Low', status: 'Automation Candidate' },
  { id: 'usr-11', userName: 'Gamze Tekin', department: 'Finance', sapModule: 'FI', licenseType: 'Professional', monthlyTransactions: 40, annualLicenseCost: 5000, manualWorkHours: 160, usageFrequency: 'Low', status: 'Overlicensed' },
  { id: 'usr-12', userName: 'Tolga Aydin', department: 'Procurement', sapModule: 'MM-SRM', licenseType: 'Professional', monthlyTransactions: 60, annualLicenseCost: 5000, manualWorkHours: 175, usageFrequency: 'Low', status: 'Overlicensed' }
];
