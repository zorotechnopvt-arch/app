import { Category, CategoryId } from '../models/vault.models';

/** Keywords are matched case-insensitively on whole words. Multi-word keywords count double. */
export const CATEGORIES: Category[] = [
  {
    id: 'identity', label: 'Identity', hint: 'Aadhaar, PAN, passport, licence',
    icon: 'id-card-outline', color: '#3b82f6', bg: '#e8f0ff',
    keywords: ['aadhaar', 'aadhar', 'unique identification', 'pan card', 'permanent account number', 'income tax department',
      'passport', 'republic of india', 'driving licence', 'driving license', 'driver license', 'voter id', 'election commission',
      'identity card', 'date of birth', 'dob'],
  },
  {
    id: 'education', label: 'Education', hint: 'Certificates, marksheets',
    icon: 'school-outline', color: '#8b5cf6', bg: '#f1eaff',
    keywords: ['marksheet', 'mark sheet', 'university', 'college', 'school', 'transcript', 'semester', 'degree',
      'bachelor', 'master of', 'diploma', 'board of', 'examination', 'grade card', 'convocation', 'cgpa'],
  },
  {
    id: 'health', label: 'Health', hint: 'Reports, prescriptions',
    icon: 'medkit-outline', color: '#ef4444', bg: '#ffebeb',
    keywords: ['prescription', 'diagnosis', 'diagnostic', 'hospital', 'patient', 'lab report', 'laboratory', 'blood test',
      'pathology', 'medical', 'clinic', 'discharge summary', 'radiology', 'mri', 'ecg', 'vaccination', 'doctor', 'dr'],
  },
  {
    id: 'vehicle', label: 'Vehicles', hint: 'RC, PUC, service records',
    icon: 'car-sport-outline', color: '#0ea5e9', bg: '#e3f4fd',
    keywords: ['registration certificate', 'vehicle', 'chassis', 'engine no', 'pollution under control', 'puc',
      'rc book', 'motor vehicle', 'two wheeler', 'four wheeler', 'service history', 'registration no', 'car', 'bike'],
  },
  {
    id: 'rental', label: 'Rentals', hint: 'Agreements, rent receipts',
    icon: 'home-outline', color: '#14b8a6', bg: '#e0f7f4',
    keywords: ['rent agreement', 'rental agreement', 'lease', 'tenant', 'landlord', 'licensor', 'licensee',
      'monthly rent', 'security deposit', 'rent receipt', 'tenancy'],
  },
  {
    id: 'finance', label: 'Finance', hint: 'Bank, tax, payslips',
    icon: 'wallet-outline', color: '#22c55e', bg: '#e4f8ea',
    keywords: ['bank statement', 'account number', 'ifsc', 'income tax return', 'itr', 'form 16', 'salary slip', 'payslip',
      'invoice', 'gst', 'transaction', 'debit', 'credit', 'balance', 'statement of account'],
  },
  {
    id: 'insurance', label: 'Insurance', hint: 'Policies, claims',
    icon: 'shield-checkmark-outline', color: '#f59e0b', bg: '#fff3dc',
    keywords: ['insurance', 'policy number', 'policy no', 'insured', 'premium', 'sum insured', 'nominee', 'claim',
      'policyholder', 'policy'],
  },
  {
    id: 'work', label: 'Work', hint: 'Offer letters, experience',
    icon: 'briefcase-outline', color: '#6366f1', bg: '#ebebff',
    keywords: ['offer letter', 'appointment letter', 'employment', 'experience letter', 'relieving letter',
      'employee', 'employer', 'designation', 'joining date', 'ctc', 'resignation'],
  },
  {
    id: 'other', label: 'Other', hint: 'Everything else',
    icon: 'folder-open-outline', color: '#6b7280', bg: '#f0f1f3',
    keywords: [],
  },
];

export function getCategory(id: CategoryId | string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
