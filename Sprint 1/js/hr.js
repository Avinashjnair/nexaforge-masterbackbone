/* ============================================================
   NexaForge ERP — HR & Workforce Module
   Covers: Workforce directory · Skills matrix · Welder certifications
           Training records · Shift scheduling · Labour utilisation
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   HR DATA STORE
───────────────────────────────────────────────────────────── */
const HRData = {
  activeTab: 'overview',
  searchTerm: '',

  /* ── Employees ── */
  employees: [
    {
      id: 'E-001', name: 'Khalid Al-Rashid', initials: 'KR',
      role: 'Senior Welder', dept: 'Production', grade: 'Senior', type: 'permanent',
      avatarBg: '#0F6E56', avatarColor: '#9FE1CB', accentColor: '#2dd4a0',
      joined: '2018-03-15', dob: '1985-06-20', nationality: 'UAE',
      email: 'k.alrashid@nexaforge.ae', phone: '+971 50 112 3344',
      projects: ['P-2401'], utilisation: 92, directHours: 168, indirectHours: 12,
      skills: { GTAW: 4, SMAW: 4, FCAW: 2, Rolling: 1, Fitting: 2, NDT: 0, Inspection: 0, CAD: 0 },
      certifications: [
        { code: 'WPQ-GTAW-316L', name: 'WPQ GTAW — 316L SS (ASME IX)', issued: '2023-01-10', expiry: '2025-01-10', status: 'expired' },
        { code: 'WPQ-SMAW-CS', name: 'WPQ SMAW — CS E7018 (ASME IX)', issued: '2023-06-15', expiry: '2025-06-15', status: 'valid' },
        { code: 'SAFETY-H2S', name: 'H2S Safety — Basic', issued: '2024-01-01', expiry: '2026-01-01', status: 'valid' },
      ],
      tags: ['GTAW', 'SMAW', 'ASME IX', 'API 650'],
    },
    {
      id: 'E-002', name: 'Kumar Suresh', initials: 'KS',
      role: 'Lead Welder', dept: 'Production', grade: 'Lead', type: 'permanent',
      avatarBg: '#185FA5', avatarColor: '#85B7EB', accentColor: '#4a9eff',
      joined: '2017-08-01', dob: '1982-11-14', nationality: 'Indian',
      email: 'k.suresh@nexaforge.ae', phone: '+971 52 234 5566',
      projects: ['P-2401', 'P-2403'], utilisation: 95, directHours: 176, indirectHours: 4,
      skills: { GTAW: 4, SMAW: 4, FCAW: 4, Rolling: 2, Fitting: 3, NDT: 1, Inspection: 1, CAD: 0 },
      certifications: [
        { code: 'WPQ-GTAW-316L', name: 'WPQ GTAW — 316L SS (ASME IX)', issued: '2023-04-20', expiry: '2025-04-20', status: 'expiring' },
        { code: 'WPQ-GTAW-CS', name: 'WPQ GTAW — CS (ASME IX)', issued: '2023-04-20', expiry: '2025-04-20', status: 'expiring' },
        { code: 'WPQ-SMAW-316L', name: 'WPQ SMAW — 316L (ASME IX)', issued: '2024-01-15', expiry: '2026-01-15', status: 'valid' },
        { code: 'SAFETY-WELD', name: 'Welding Safety & Fume Awareness', issued: '2024-03-01', expiry: '2027-03-01', status: 'valid' },
        { code: 'SAFETY-H2S', name: 'H2S Safety — Advanced', issued: '2023-11-01', expiry: '2025-11-01', status: 'valid' },
      ],
      tags: ['GTAW', 'SMAW', 'FCAW', 'ASME IX', 'Lead'],
    },
    {
      id: 'E-003', name: 'Tariq Kumar', initials: 'TK',
      role: 'Fitter / Fabricator', dept: 'Production', grade: 'Senior', type: 'permanent',
      avatarBg: '#534AB7', avatarColor: '#AFA9EC', accentColor: '#7F77DD',
      joined: '2020-01-10', dob: '1990-03-08', nationality: 'Pakistani',
      email: 't.kumar@nexaforge.ae', phone: '+971 55 345 6677',
      projects: ['P-2401'], utilisation: 78, directHours: 148, indirectHours: 26,
      skills: { GTAW: 1, SMAW: 2, FCAW: 1, Rolling: 2, Fitting: 4, NDT: 0, Inspection: 1, CAD: 2 },
      certifications: [
        { code: 'SAFETY-BASIC', name: 'Safety Induction — Site & Facility', issued: '2020-01-10', expiry: '2026-01-10', status: 'valid' },
        { code: 'RIGGING', name: 'Rigging & Lifting — Basic', issued: '2022-06-01', expiry: '2025-06-01', status: 'expiring' },
      ],
      tags: ['Fitting', 'Fabrication', 'Nozzle fit-up'],
    },
    {
      id: 'E-004', name: 'Fatima Nair', initials: 'FN',
      role: 'QC Inspector', dept: 'Quality', grade: 'Senior', type: 'permanent',
      avatarBg: '#854F0B', avatarColor: '#FAC775', accentColor: '#f59e0b',
      joined: '2019-07-01', dob: '1988-09-22', nationality: 'Indian',
      email: 'f.nair@nexaforge.ae', phone: '+971 50 456 7788',
      projects: ['P-2401', 'P-2402', 'P-2403'], utilisation: 88, directHours: 160, indirectHours: 20,
      skills: { GTAW: 0, SMAW: 0, FCAW: 0, Rolling: 0, Fitting: 0, NDT: 4, Inspection: 4, CAD: 1 },
      certifications: [
        { code: 'CSWIP-3.1', name: 'CSWIP 3.1 — Welding Inspector', issued: '2020-02-15', expiry: '2026-02-15', status: 'valid' },
        { code: 'PCN-MT', name: 'PCN Level 2 — Magnetic Particle Testing', issued: '2021-05-01', expiry: '2026-05-01', status: 'valid' },
        { code: 'PCN-VT', name: 'PCN Level 2 — Visual Testing', issued: '2021-05-01', expiry: '2026-05-01', status: 'valid' },
        { code: 'ISO9001-LA', name: 'ISO 9001:2015 Lead Auditor', issued: '2022-09-01', expiry: '2025-09-01', status: 'expiring' },
      ],
      tags: ['CSWIP', 'NDT', 'API 650', 'ASME VIII'],
    },
    {
      id: 'E-005', name: 'Ahmed Al-Thomas', initials: 'AT',
      role: 'QC Inspector', dept: 'Quality', grade: 'Junior', type: 'permanent',
      avatarBg: '#3B6D11', avatarColor: '#C0DD97', accentColor: '#2dd4a0',
      joined: '2022-04-01', dob: '1995-12-15', nationality: 'UAE',
      email: 'a.thomas@nexaforge.ae', phone: '+971 54 567 8899',
      projects: ['P-2401'], utilisation: 72, directHours: 136, indirectHours: 38,
      skills: { GTAW: 0, SMAW: 0, FCAW: 0, Rolling: 0, Fitting: 0, NDT: 2, Inspection: 3, CAD: 1 },
      certifications: [
        { code: 'CSWIP-2.1', name: 'CSWIP 2.1 — Welding Inspector Trainee', issued: '2022-06-01', expiry: '2025-06-01', status: 'expiring' },
        { code: 'SAFETY-BASIC', name: 'Safety Induction', issued: '2022-04-01', expiry: '2025-04-01', status: 'expired' },
      ],
      tags: ['Inspection', 'NDT trainee'],
    },
    {
      id: 'E-006', name: 'Sanjay Mathews', initials: 'SM',
      role: 'Project Manager', dept: 'Management', grade: 'Manager', type: 'permanent',
      avatarBg: '#791F1F', avatarColor: '#F09595', accentColor: '#e8622a',
      joined: '2016-11-01', dob: '1980-07-30', nationality: 'Indian',
      email: 's.mathews@nexaforge.ae', phone: '+971 50 678 9900',
      projects: ['P-2402', 'P-2403'], utilisation: 65, directHours: 120, indirectHours: 58,
      skills: { GTAW: 0, SMAW: 1, FCAW: 0, Rolling: 0, Fitting: 0, NDT: 1, Inspection: 2, CAD: 3 },
      certifications: [
        { code: 'PMP', name: 'Project Management Professional (PMP)', issued: '2020-03-01', expiry: '2026-03-01', status: 'valid' },
        { code: 'API-653', name: 'API 653 — Tank Inspector', issued: '2019-06-01', expiry: '2025-12-31', status: 'expiring' },
      ],
      tags: ['PMP', 'API 653', 'Project management'],
    },
    {
      id: 'E-007', name: 'Mohammed Hassan', initials: 'MH',
      role: 'Sales Manager', dept: 'Marketing', grade: 'Manager', type: 'permanent',
      avatarBg: '#185FA5', avatarColor: '#85B7EB', accentColor: '#4a9eff',
      joined: '2015-02-01', dob: '1978-04-12', nationality: 'UAE',
      email: 'm.hassan@nexaforge.ae', phone: '+971 50 789 0011',
      projects: [], utilisation: 55, directHours: 100, indirectHours: 80,
      skills: { GTAW: 0, SMAW: 0, FCAW: 0, Rolling: 0, Fitting: 0, NDT: 0, Inspection: 0, CAD: 0 },
      certifications: [
        { code: 'API-AWARE', name: 'API Standards Awareness Training', issued: '2023-01-01', expiry: '2026-01-01', status: 'valid' },
      ],
      tags: ['Sales', 'Business development', 'CRM'],
    },
    {
      id: 'E-008', name: 'Ali Hassan', initials: 'AH',
      role: 'Welder', dept: 'Production', grade: 'Skilled', type: 'permanent',
      avatarBg: '#0F6E56', avatarColor: '#9FE1CB', accentColor: '#2dd4a0',
      joined: '2021-09-01', dob: '1993-08-05', nationality: 'Yemeni',
      email: 'a.hassan@nexaforge.ae', phone: '+971 55 890 1122',
      projects: [], utilisation: 40, directHours: 72, indirectHours: 30,
      skills: { GTAW: 3, SMAW: 3, FCAW: 2, Rolling: 0, Fitting: 1, NDT: 0, Inspection: 0, CAD: 0 },
      certifications: [
        { code: 'WPQ-GTAW-CS', name: 'WPQ GTAW — CS (ASME IX)', issued: '2021-10-01', expiry: '2023-10-01', status: 'expired' },
        { code: 'WPQ-SMAW-CS', name: 'WPQ SMAW — CS E7018', issued: '2022-03-01', expiry: '2024-03-01', status: 'expired' },
        { code: 'SAFETY-BASIC', name: 'Safety Induction', issued: '2021-09-01', expiry: '2024-09-01', status: 'expired' },
      ],
      tags: ['GTAW', 'SMAW', 'Cert renewal required'],
    },
  ],

  /* ── Skills definitions ── */
  skillDefs: [
    { key: 'GTAW',       label: 'GTAW Welding' },
    { key: 'SMAW',       label: 'SMAW Welding' },
    { key: 'FCAW',       label: 'FCAW Welding' },
    { key: 'Rolling',    label: 'Rolling / Forming' },
    { key: 'Fitting',    label: 'Fitting / Fab' },
    { key: 'NDT',        label: 'NDT Testing' },
    { key: 'Inspection', label: 'QC Inspection' },
    { key: 'CAD',        label: 'CAD / Drawing' },
  ],

  /* ── Weekly shift schedule (this week) ── */
  /* Shift codes: M=Morning, A=Afternoon, N=Night, OFF=Rest, AL=Annual Leave, SL=Sick Leave */
  shiftSchedule: {
    days: ['Mon\n28 Apr', 'Tue\n29 Apr', 'Wed\n30 Apr', 'Thu\n01 May', 'Fri\n02 May', 'Sat\n03 May', 'Sun\n04 May'],
    rows: [
      { empId: 'E-001', shifts: ['M','M','M','M','M','OFF','OFF'] },
      { empId: 'E-002', shifts: ['M','M','A','M','M','M','OFF'] },
      { empId: 'E-003', shifts: ['M','M','M','OFF','M','M','OFF'] },
      { empId: 'E-004', shifts: ['M','M','M','M','AL','OFF','OFF'] },
      { empId: 'E-005', shifts: ['A','A','SL','A','A','OFF','OFF'] },
      { empId: 'E-006', shifts: ['M','M','M','M','M','OFF','OFF'] },
      { empId: 'E-007', shifts: ['M','OFF','M','M','OFF','OFF','OFF'] },
      { empId: 'E-008', shifts: ['M','M','M','OFF','M','OFF','OFF'] },
    ]
  },

  /* ── Training records ── */
  training: [
    {
      id: 'TR-001', title: 'ASME IX Welder Qualification — GTAW 316L Renewal',
      type: 'Certification', date: '2025-05-15', duration: '3 days',
      provider: 'Emirates Welding Academy', status: 'scheduled',
      attendees: ['E-001', 'E-008'],
      mandatory: true, cost: 4200,
    },
    {
      id: 'TR-002', title: 'Safety Refresher — H2S & Confined Space Entry',
      type: 'Safety', date: '2025-05-08', duration: '1 day',
      provider: 'Internal — HSE Dept', status: 'scheduled',
      attendees: ['E-001', 'E-002', 'E-003', 'E-005', 'E-008'],
      mandatory: true, cost: 800,
    },
    {
      id: 'TR-003', title: 'API 650 Tank Inspection — Refresher',
      type: 'Technical', date: '2025-04-10', duration: '2 days',
      provider: 'API Training Centre Dubai', status: 'completed',
      attendees: ['E-004', 'E-006'],
      mandatory: false, cost: 3600,
      results: { 'E-004': 'Pass', 'E-006': 'Pass' },
    },
    {
      id: 'TR-004', title: 'ERP System User Training — NexaForge',
      type: 'Systems', date: '2025-04-22', duration: '0.5 day',
      provider: 'Internal — IT', status: 'completed',
      attendees: ['E-001','E-002','E-003','E-004','E-005','E-006','E-007','E-008'],
      mandatory: true, cost: 0,
      results: { 'E-001':'Pass','E-002':'Pass','E-003':'Pass','E-004':'Pass','E-005':'Pass','E-006':'Pass','E-007':'Pass','E-008':'Pass' },
    },
    {
      id: 'TR-005', title: 'ISO 9001:2015 Internal Auditor Refresher',
      type: 'Quality', date: '2025-06-18', duration: '1 day',
      provider: 'Bureau Veritas', status: 'planned',
      attendees: ['E-004'],
      mandatory: true, cost: 1800,
    },
    {
      id: 'TR-006', title: 'Rigging & Lifting — Recertification',
      type: 'Safety', date: '2025-05-20', duration: '1 day',
      provider: 'Al Futtaim HSE', status: 'planned',
      attendees: ['E-003'],
      mandatory: true, cost: 950,
    },
  ],

  /* ── Attendance Records (this week) ── */
  attendance: [
    { empId:'E-001', date:'2025-05-05', clockIn:'06:02', clockOut:'14:35', status:'present', hoursWorked:8.55, overtime:0.55, location:'Shop Floor' },
    { empId:'E-001', date:'2025-05-04', clockIn:'06:05', clockOut:'14:10', status:'present', hoursWorked:8.08, overtime:0.08, location:'Shop Floor' },
    { empId:'E-002', date:'2025-05-05', clockIn:'05:58', clockOut:'14:45', status:'present', hoursWorked:8.78, overtime:0.78, location:'Shop Floor' },
    { empId:'E-002', date:'2025-05-04', clockIn:'06:00', clockOut:'14:30', status:'present', hoursWorked:8.5, overtime:0.5, location:'Shop Floor' },
    { empId:'E-003', date:'2025-05-05', clockIn:'06:10', clockOut:'14:20', status:'present', hoursWorked:8.17, overtime:0.17, location:'Bay 3' },
    { empId:'E-003', date:'2025-05-04', clockIn:null, clockOut:null, status:'absent', hoursWorked:0, overtime:0, location:null },
    { empId:'E-004', date:'2025-05-05', clockIn:'07:00', clockOut:'15:30', status:'present', hoursWorked:8.5, overtime:0.5, location:'QC Lab' },
    { empId:'E-005', date:'2025-05-05', clockIn:'13:55', clockOut:'22:10', status:'present', hoursWorked:8.25, overtime:0.25, location:'QC Lab' },
    { empId:'E-005', date:'2025-05-04', clockIn:null, clockOut:null, status:'sick', hoursWorked:0, overtime:0, location:null },
    { empId:'E-006', date:'2025-05-05', clockIn:'07:30', clockOut:'16:00', status:'present', hoursWorked:8.5, overtime:0.5, location:'Office' },
    { empId:'E-007', date:'2025-05-05', clockIn:'08:00', clockOut:'17:00', status:'present', hoursWorked:9, overtime:1, location:'Office' },
    { empId:'E-008', date:'2025-05-05', clockIn:'06:15', clockOut:'14:30', status:'present', hoursWorked:8.25, overtime:0.25, location:'Shop Floor' },
    { empId:'E-008', date:'2025-05-04', clockIn:'06:20', clockOut:'14:00', status:'late', hoursWorked:7.67, overtime:0, location:'Shop Floor' },
  ],

  /* ── Leave Balances ── */
  leaveBalances: [
    { empId:'E-001', annual:30, annualUsed:8,  sick:15, sickUsed:2, emergency:5, emergencyUsed:0, unpaid:0 },
    { empId:'E-002', annual:30, annualUsed:4,  sick:15, sickUsed:0, emergency:5, emergencyUsed:1, unpaid:0 },
    { empId:'E-003', annual:25, annualUsed:12, sick:15, sickUsed:5, emergency:5, emergencyUsed:2, unpaid:3 },
    { empId:'E-004', annual:30, annualUsed:6,  sick:15, sickUsed:1, emergency:5, emergencyUsed:0, unpaid:0 },
    { empId:'E-005', annual:25, annualUsed:2,  sick:15, sickUsed:3, emergency:5, emergencyUsed:0, unpaid:0 },
    { empId:'E-006', annual:30, annualUsed:10, sick:15, sickUsed:0, emergency:5, emergencyUsed:0, unpaid:0 },
    { empId:'E-007', annual:30, annualUsed:15, sick:15, sickUsed:1, emergency:5, emergencyUsed:0, unpaid:0 },
    { empId:'E-008', annual:25, annualUsed:3,  sick:15, sickUsed:1, emergency:5, emergencyUsed:0, unpaid:0 },
  ],

  /* ── Leave Requests ── */
  leaveRequests: [
    { id:'LR-001', empId:'E-003', type:'annual', from:'2025-05-12', to:'2025-05-14', days:3, status:'pending', reason:'Family event in India', appliedOn:'2025-05-01', approvedBy:null },
    { id:'LR-002', empId:'E-005', type:'sick', from:'2025-05-04', to:'2025-05-04', days:1, status:'approved', reason:'Unwell — fever', appliedOn:'2025-05-04', approvedBy:'Sanjay Mathews' },
    { id:'LR-003', empId:'E-001', type:'annual', from:'2025-05-19', to:'2025-05-23', days:5, status:'pending', reason:'Annual home visit', appliedOn:'2025-05-03', approvedBy:null },
    { id:'LR-004', empId:'E-007', type:'annual', from:'2025-04-28', to:'2025-04-29', days:2, status:'approved', reason:'Personal', appliedOn:'2025-04-20', approvedBy:'GM' },
    { id:'LR-005', empId:'E-002', type:'emergency', from:'2025-04-15', to:'2025-04-15', days:1, status:'approved', reason:'Family emergency', appliedOn:'2025-04-15', approvedBy:'Sanjay Mathews' },
  ],

  /* ── Expense Reports ── */
  expenses: [
    {
      id: 'EXP-REP-001',
      empId: 'E-006',
      title: 'April 2025 Travel & Client Site Visits',
      month: 'April 2025',
      status: 'approved',
      submittedOn: '2025-04-28',
      approvedBy: 'GM',
      totalAmount: 1470,
      currency: 'AED',
      lines: [
        {
          date: '2025-04-25',
          refNo: 'TAX-8841',
          category: 'Travel',
          reason: 'Site visit travel to Abu Dhabi',
          customerInvolved: 'ADNOC',
          amount: 850,
          description: 'Taxi fares and tolls'
        },
        {
          date: '2025-04-25',
          refNo: 'DIN-4481',
          category: 'Entertainment',
          reason: 'Client dinner discussion',
          customerInvolved: 'ADNOC',
          amount: 620,
          description: 'Dinner at Al Nafoura restaurant'
        }
      ]
    },
    {
      id: 'EXP-REP-002',
      empId: 'E-004',
      title: 'May 2025 Certifications & Tools',
      month: 'May 2025',
      status: 'pending',
      submittedOn: '2025-05-02',
      approvedBy: null,
      totalAmount: 2295,
      currency: 'AED',
      lines: [
        {
          date: '2025-05-02',
          refNo: 'CERT-9901',
          category: 'Training',
          reason: 'CSWIP exam registration fee',
          customerInvolved: '',
          amount: 2200,
          description: 'Registration code and study materials'
        },
        {
          date: '2025-04-20',
          refNo: 'PPE-4421',
          category: 'Tools',
          reason: 'PPE replacement — welding gloves',
          customerInvolved: '',
          amount: 95,
          description: 'Purchase of high-temperature leather welding gloves'
        }
      ]
    },
    {
      id: 'EXP-REP-003',
      empId: 'E-003',
      title: 'May 2025 Warehouse Travel & Supplies',
      month: 'May 2025',
      status: 'rejected',
      submittedOn: '2025-05-03',
      approvedBy: null,
      totalAmount: 45,
      currency: 'AED',
      lines: [
        {
          date: '2025-05-03',
          refNo: 'BUS-0102',
          category: 'Travel',
          reason: 'Bus fare — supplier warehouse visit',
          customerInvolved: '',
          amount: 45,
          description: 'RTA Bus fare to supplier warehouse'
        }
      ]
    }
  ],

  /* ── Payroll Records (Apr 2025) ── */
  payroll: [
    { empId:'E-001', month:'Apr 2025', basicSalary:8500, housingAllowance:2500, transportAllowance:800, overtime:450, deductions:0, netPay:12250, status:'paid', payDate:'2025-04-28' },
    { empId:'E-002', month:'Apr 2025', basicSalary:9200, housingAllowance:2800, transportAllowance:800, overtime:680, deductions:0, netPay:13480, status:'paid', payDate:'2025-04-28' },
    { empId:'E-003', month:'Apr 2025', basicSalary:7500, housingAllowance:2200, transportAllowance:600, overtime:120, deductions:450, netPay:9970, status:'paid', payDate:'2025-04-28' },
    { empId:'E-004', month:'Apr 2025', basicSalary:10000, housingAllowance:3000, transportAllowance:800, overtime:320, deductions:0, netPay:14120, status:'paid', payDate:'2025-04-28' },
    { empId:'E-005', month:'Apr 2025', basicSalary:6500, housingAllowance:2000, transportAllowance:600, overtime:0, deductions:0, netPay:9100, status:'paid', payDate:'2025-04-28' },
    { empId:'E-006', month:'Apr 2025', basicSalary:15000, housingAllowance:4500, transportAllowance:1200, overtime:0, deductions:0, netPay:20700, status:'paid', payDate:'2025-04-28' },
    { empId:'E-007', month:'Apr 2025', basicSalary:13000, housingAllowance:4000, transportAllowance:1000, overtime:0, deductions:0, netPay:18000, status:'paid', payDate:'2025-04-28' },
    { empId:'E-008', month:'Apr 2025', basicSalary:6000, housingAllowance:1800, transportAllowance:500, overtime:0, deductions:200, netPay:8100, status:'paid', payDate:'2025-04-28' },
  ],

  /* ── Onboarding Checklists ── */
  onboarding: [
    { empId:'E-008', startDate:'2021-09-01', status:'complete', steps:[
      { task:'ID badge issued', done:true, date:'2021-09-01' },
      { task:'Safety induction completed', done:true, date:'2021-09-01' },
      { task:'PPE issued (full kit)', done:true, date:'2021-09-02' },
      { task:'ERP system training', done:true, date:'2021-09-05' },
      { task:'Assigned to work centre WC-02', done:true, date:'2021-09-03' },
      { task:'Probation review (90 days)', done:true, date:'2021-12-01' },
    ]},
    { empId:'E-005', startDate:'2022-04-01', status:'complete', steps:[
      { task:'ID badge issued', done:true, date:'2022-04-01' },
      { task:'Safety induction completed', done:true, date:'2022-04-01' },
      { task:'PPE issued (inspection kit)', done:true, date:'2022-04-02' },
      { task:'ERP system training', done:true, date:'2022-04-05' },
      { task:'CSWIP 2.1 enrolled', done:true, date:'2022-06-01' },
      { task:'Probation review (90 days)', done:true, date:'2022-07-01' },
    ]},
  ],

  /* ── HR Documents ── */
  documents: [
    { id:'DOC-001', empId:'E-001', type:'passport', name:'Passport Copy', uploaded:'2024-01-15', expiry:'2028-06-20', status:'valid' },
    { id:'DOC-002', empId:'E-001', type:'visa', name:'Employment Visa', uploaded:'2024-01-15', expiry:'2025-08-10', status:'expiring' },
    { id:'DOC-003', empId:'E-001', type:'labour-card', name:'Labour Card', uploaded:'2024-01-15', expiry:'2025-08-10', status:'expiring' },
    { id:'DOC-004', empId:'E-002', type:'passport', name:'Passport Copy', uploaded:'2023-08-01', expiry:'2029-03-15', status:'valid' },
    { id:'DOC-005', empId:'E-002', type:'visa', name:'Employment Visa', uploaded:'2023-08-01', expiry:'2026-07-01', status:'valid' },
    { id:'DOC-006', empId:'E-003', type:'passport', name:'Passport Copy', uploaded:'2024-03-10', expiry:'2027-12-05', status:'valid' },
    { id:'DOC-007', empId:'E-003', type:'visa', name:'Employment Visa', uploaded:'2024-03-10', expiry:'2025-06-15', status:'expiring' },
    { id:'DOC-008', empId:'E-004', type:'passport', name:'Passport Copy', uploaded:'2023-07-01', expiry:'2030-09-22', status:'valid' },
    { id:'DOC-009', empId:'E-004', type:'medical', name:'Medical Fitness', uploaded:'2024-11-01', expiry:'2025-11-01', status:'valid' },
    { id:'DOC-010', empId:'E-008', type:'passport', name:'Passport Copy', uploaded:'2021-09-01', expiry:'2025-05-15', status:'expired' },
    { id:'DOC-011', empId:'E-008', type:'visa', name:'Employment Visa', uploaded:'2021-09-01', expiry:'2024-09-01', status:'expired' },
  ],

  /* ── Activity Feed ── */
  activityFeed: [
    { type:'cert_expired', empId:'E-001', detail:'WPQ GTAW — 316L SS has expired', date:'2025-05-03', severity:'critical' },
    { type:'cert_expired', empId:'E-008', detail:'3 certifications expired — immediate action required', date:'2025-05-03', severity:'critical' },
    { type:'training_scheduled', empId:null, detail:'ASME IX GTAW Renewal scheduled — 2 attendees (15 May)', date:'2025-05-02', severity:'info' },
    { type:'leave_approved', empId:'E-005', detail:'1 day sick leave approved (4 May)', date:'2025-05-04', severity:'neutral' },
    { type:'leave_request', empId:'E-003', detail:'Requested 3 days annual leave (12–14 May)', date:'2025-05-01', severity:'warning' },
    { type:'leave_request', empId:'E-001', detail:'Requested 5 days annual leave (19–23 May)', date:'2025-05-03', severity:'warning' },
    { type:'expense_approved', empId:'E-006', detail:'Travel expense AED 850 approved', date:'2025-04-29', severity:'neutral' },
    { type:'payroll_complete', empId:null, detail:'April 2025 payroll processed — 8 employees, AED 105,720 total', date:'2025-04-28', severity:'info' },
    { type:'doc_expiring', empId:'E-008', detail:'Passport expires 15 May 2025 — renewal urgent', date:'2025-05-01', severity:'critical' },
    { type:'training_completed', empId:null, detail:'ERP System Training completed — 8/8 passed', date:'2025-04-22', severity:'info' },
  ],
};

/* ─────────────────────────────────────────────────────────────
   MAIN RENDERER — delegates to sidebar module
───────────────────────────────────────────────────────────── */
async function renderHR() {
  // Load live data if available
  const [empRes] = await Promise.allSettled([
    HrAPI.employees({ limit: 100 })
  ]);

  if (empRes.status === 'fulfilled') {
    const rawEmp = empRes.value.employees || empRes.value || [];
    HRData.employees = rawEmp.map(e => ({
      id: e.id,
      name: e.full_name || '—',
      initials: (e.full_name || 'E').split(' ').map(n=>n[0]).join('').toUpperCase(),
      role: e.designation || '—',
      dept: e.department || '—',
      grade: e.grade || '—',
      type: e.employment_type || 'permanent',
      avatarBg: '#185FA5', avatarColor: '#85B7EB', accentColor: '#4a9eff',
      joined: e.date_of_joining || '—',
      email: e.email || '—',
      phone: e.phone_number || '—',
      utilisation: e.utilisation || 0,
      skills: e.skills || {},
      certifications: e.certifications || [],
      tags: e.tags || []
    }));
  }

  // Sidebar-driven navigation is handled by enterHRModule() in app.js
  // This function is kept for backward compatibility with API data loading
}


function switchHRTab(tab) {
  HRData.activeTab = tab;
  document.querySelectorAll('.hr-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.htab === tab));
  const map = {
    overview:    renderHROverview,
    workforce:   renderHRWorkforce,
    skills:      renderHRSkills,
    certs:       renderHRCerts,
    training:    renderHRTraining,
    schedule:    renderHRSchedule,
    utilisation: renderHRUtilisation,
  };
  if (map[tab]) map[tab]();
}

function closeHRModal() { 
  const modal = document.getElementById('hrModal');
  if (modal) modal.style.display = 'none'; 
}
function openHRModal(html) {
  let modal = document.getElementById('hrModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'hrModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:200;backdrop-filter:blur(5px)';
    modal.onclick = closeHRModal;
    
    const content = document.createElement('div');
    content.id = 'hrModalContent';
    content.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,94vw)';
    content.onclick = e => e.stopPropagation();
    
    modal.appendChild(content);
    document.body.appendChild(modal);
  }
  document.getElementById('hrModalContent').innerHTML = html;
  modal.style.display = 'block';
}

/* ── Small helpers ── */
function hrEmp(id) { return HRData.employees.find(e => e.id === id); }
function certDaysLeft(expiryStr) {
  return Math.ceil((new Date(expiryStr) - new Date()) / 86400000);
}
function certStatusColor(status) {
  return { valid:'var(--green)', expiring:'var(--amber)', expired:'var(--red)' }[status] || 'var(--text-muted)';
}
function certStatusBadge(status) {
  const cls = { valid:'badge-green', expiring:'badge-amber', expired:'badge-red' }[status] || 'badge-muted';
  const lbl = { valid:'Valid', expiring:'Expiring', expired:'Expired' }[status] || status;
  return `<span class="badge ${cls}" style="font-size:10px">${lbl}</span>`;
}
function trTypeBadge(type) {
  const map = {
    Certification:'var(--brand)',Safety:'var(--red)',Technical:'var(--blue)',
    Systems:'var(--text-muted)',Quality:'var(--amber)',
  };
  const col = map[type]||'var(--text-muted)';
  return `<span class="tr-type" style="background:${col}22;color:${col};border:1px solid ${col}44">${type}</span>`;
}
function trStatusBadge(status) {
  const map = {scheduled:'badge-blue',completed:'badge-green',planned:'badge-muted',cancelled:'badge-red'};
  return `<span class="badge ${map[status]||'badge-muted'}" style="font-size:10px">${status}</span>`;
}

/* ── HR API loader — populates HRData from backend (no-op in demo mode) ── */
async function _loadHRFromAPI() {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) return;
  try {
    const [empRes, leaveRes, attendRes, trainingRes] = await Promise.allSettled([
      HrAPI.employees({ limit: 200 }),
      HrAPI.leaveRequests({ limit: 300 }),
      HrAPI.attendance({ limit: 500 }),
      HrAPI.training({ limit: 200 }),
    ]);

    if (empRes.status === 'fulfilled') {
      const raw = empRes.value.employees || empRes.value || [];
      if (raw.length) {
        const initials = name => (name || '??').split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase();
        HRData.employees = raw.map(e => ({
          id: e.employee_no || e.id,
          _dbId: e.id,
          name: e.full_name || '',
          initials: initials(e.full_name),
          role: e.job_title || '',
          dept: e.department || '',
          grade: e.grade || '',
          type: e.employment_type || 'permanent',
          avatarBg: e.avatar_bg || '#0F6E56',
          avatarColor: '#9FE1CB',
          accentColor: '#2dd4a0',
          joined: (e.date_joined || '').slice(0, 10),
          dob: (e.date_of_birth || '').slice(0, 10),
          nationality: e.nationality || '',
          email: e.system_email || e.email || '',
          phone: e.phone || '',
          projects: [],
          utilisation: e.utilisation_pct || 0,
          directHours: 0, indirectHours: 0,
          skills: {},
          certifications: [],
          tags: [],
        }));
      }
    }

    if (leaveRes.status === 'fulfilled') {
      const raw = leaveRes.value.requests || leaveRes.value || [];
      if (raw.length) {
        HRData.leaveRequests = raw.map(r => ({
          id: r.id,
          empId: r.employee_no || r.employee_id,
          empName: r.employee_name || '',
          type: r.leave_type || 'annual',
          from: (r.start_date || '').slice(0, 10),
          to: (r.end_date || '').slice(0, 10),
          days: r.days_requested || 0,
          reason: r.reason || '',
          status: r.status || 'pending',
          approvedBy: r.approved_by_name || '',
        }));
      }
    }

    if (attendRes.status === 'fulfilled') {
      const raw = attendRes.value.records || attendRes.value || [];
      if (raw.length) {
        HRData.attendance = raw.map(a => ({
          empId: a.employee_no || a.employee_id,
          empName: a.employee_name || '',
          date: (a.work_date || a.date || '').slice(0, 10),
          clockIn: a.clock_in || '',
          clockOut: a.clock_out || '',
          status: a.status || 'present',
          hoursWorked: a.hours_worked || 0,
        }));
      }
    }

    if (trainingRes.status === 'fulfilled') {
      const raw = trainingRes.value.records || trainingRes.value || [];
      if (raw.length) {
        HRData.training = raw.map(t => ({
          id: t.id,
          empId: t.employee_no || t.employee_id,
          empName: t.employee_name || '',
          course: t.course_name || '',
          provider: t.provider || '',
          date: (t.training_date || '').slice(0, 10),
          expiry: (t.expiry_date || '').slice(0, 10) || null,
          status: t.status || 'completed',
          type: t.training_type || 'Technical',
          certRef: t.certificate_ref || '',
          score: t.score || null,
        }));
      }
    }
  } catch (e) {
    // Silent — seed data remains
  }
}
