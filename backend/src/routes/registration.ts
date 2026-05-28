import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, checkRole } from '../middleware/auth';
import { UserRole } from '../types';
import {
  validateRegistration,
  verifyOTP,
  completeRegistration,
  resendOTP,
  getRegistrationStatus,
  updateRegistration
} from '../controllers/guardianRegistrationController';
import {
  getPendingRegistrations,
  getRegistrationDetails,
  approveRegistration,
  rejectRegistration,
  getRegistrationStats,
  searchStudents,
  importStudentsCSV
} from '../controllers/registrarController';
import { getAuditLogs } from '../controllers/directorController';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

// Separate multer instance for CSV imports (memory storage, CSV-only)
const csvFileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'];
  const isCSV = allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv');
  if (isCSV) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
  }
};

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for CSV
  fileFilter: csvFileFilter
});

// Public routes - no authentication required
router.post('/validate', validateRegistration);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/status', getRegistrationStatus);

// Document upload route
router.post(
  '/complete',
  upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 }
  ]),
  completeRegistration
);

// Correction route - update documents
router.put(
  '/:registrationId/correct',
  upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 }
  ]),
  updateRegistration
);

// Registrar routes - authentication required
router.get(
  '/registrar/pending',
  authenticateToken,
  checkRole([UserRole.REGISTRAR, UserRole.DIRECTOR]),
  getPendingRegistrations
);

router.get(
  '/registrar/stats',
  authenticateToken,
  checkRole([UserRole.REGISTRAR, UserRole.DIRECTOR]),
  getRegistrationStats
);

router.get(
  '/registrar/students/search',
  authenticateToken,
  checkRole([UserRole.REGISTRAR]),
  searchStudents
);

router.post(
  '/registrar/students/import',
  authenticateToken,
  checkRole([UserRole.REGISTRAR]),
  csvUpload.single('file'),
  importStudentsCSV
);

router.get(
  '/registrar/audit-logs',
  authenticateToken,
  checkRole([UserRole.REGISTRAR, UserRole.DIRECTOR]),
  getAuditLogs
);

router.get(
  '/registrar/:registrationId',
  authenticateToken,
  checkRole([UserRole.REGISTRAR, UserRole.DIRECTOR]),
  getRegistrationDetails
);

router.post(
  '/registrar/:registrationId/approve',
  authenticateToken,
  checkRole([UserRole.REGISTRAR]),
  approveRegistration
);

router.post(
  '/registrar/:registrationId/reject',
  authenticateToken,
  checkRole([UserRole.REGISTRAR]),
  rejectRegistration
);

export default router;
