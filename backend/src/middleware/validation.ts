import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

export const schemas = {
  registration: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
    fullName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 100 characters',
      'any.required': 'Full name is required',
    }),
    phoneNo: Joi.string()
      .pattern(/^(?:\+251|251|0)[97]\d{8}$/) // Ethiopian carrier format (Ethio Telecom and Safaricom)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid Ethiopian phone number (e.g., 0911234567, 0711234567, or +251911234567)',
      }),
    address: Joi.string().min(5).max(255).required().messages({
      'string.min': 'Address must be at least 5 characters long',
      'string.max': 'Address must not exceed 255 characters',
      'any.required': 'Address is required',
    }),
    relationshipType: Joi.string()
      .valid('parent', 'legal_guardian')
      .required()
      .messages({
        'any.only': 'Relationship type must be either parent or legal_guardian',
        'any.required': 'Relationship type is required',
      }),
    // Additional fields from frontend registration form
    studentFullName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Student full name must be at least 2 characters long',
      'string.max': 'Student full name must not exceed 100 characters',
      'any.required': 'Student full name is required',
    }),
    studentDob: Joi.date().iso().required().messages({
      'date.format': 'Student date of birth must be a valid date',
      'any.required': 'Student date of birth is required',
    }),
    studentClass: Joi.string().required().messages({
      'any.required': 'Student class is required',
    }),
    emergencyContact: Joi.string()
      .pattern(/^(?:\+251|251|0)[97]\d{8}$/) // Ethiopian carrier format (Ethio Telecom and Safaricom)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid Ethiopian emergency contact number (e.g., 0911234567, 0711234567, or +251911234567)',
      }),
    hasIdDocument: Joi.boolean().required().messages({
      'any.required': 'ID document status is required',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
    role: Joi.string().optional(),
  }),

  message: Joi.object({
    receiverId: Joi.number().integer().positive().required().messages({
      'number.base': 'Receiver ID must be a number',
      'number.integer': 'Receiver ID must be an integer',
      'number.positive': 'Receiver ID must be positive',
      'any.required': 'Receiver ID is required',
    }),
    content: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Message content cannot be empty',
      'string.max': 'Message content must not exceed 1000 characters',
      'any.required': 'Message content is required',
    }),
    messageType: Joi.string()
      .valid('homework', 'general', 'report_card', 'pickup')
      .default('general'),
  }),

  notification: Joi.object({
    title: Joi.string().min(1).max(150).required().messages({
      'string.min': 'Notification title cannot be empty',
      'string.max': 'Notification title must not exceed 150 characters',
      'any.required': 'Notification title is required',
    }),
    content: Joi.string().min(1).required().messages({
      'string.min': 'Notification content cannot be empty',
      'any.required': 'Notification content is required',
    }),
    priority: Joi.string()
      .valid('normal', 'emergency')
      .default('normal'),
    recipientGroup: Joi.string()
      .valid('all_guardians', 'all_teachers', 'specific_class', 'specific_users', 'all')
      .required()
      .messages({
        'any.only': 'Recipient group must be one of: all_guardians, all_teachers, specific_class, specific_users, all',
        'any.required': 'Recipient group is required',
      }),
  }),

  notificationUpdate: Joi.object({
    title: Joi.string().min(1).max(150).optional().messages({
      'string.min': 'Notification title cannot be empty',
      'string.max': 'Notification title must not exceed 150 characters',
    }),
    content: Joi.string().min(1).optional().messages({
      'string.min': 'Notification content cannot be empty',
    }),
    priority: Joi.string()
      .valid('normal', 'emergency')
      .optional(),
    recipientGroup: Joi.string()
      .valid('all_guardians', 'all_teachers', 'specific_class', 'specific_users', 'all')
      .optional()
      .messages({
        'any.only': 'Recipient group must be one of: all_guardians, all_teachers, specific_class, specific_users, all',
      }),
  }),

  homework: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Homework title cannot be empty',
      'string.max': 'Homework title must not exceed 200 characters',
      'any.required': 'Homework title is required',
    }),
    description: Joi.string().min(1).required().messages({
      'string.min': 'Homework description cannot be empty',
      'any.required': 'Homework description is required',
    }),
    subject: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Subject cannot be empty',
      'string.max': 'Subject must not exceed 100 characters',
      'any.required': 'Subject is required',
    }),
    className: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Class name cannot be empty',
      'string.max': 'Class name must not exceed 100 characters',
      'any.required': 'Class name is required',
    }),
    dueDate: Joi.date().required().messages({
      'date.base': 'Due date must be a valid date',
      'any.required': 'Due date is required',
    }),
  }),

  homeworkFeedback: Joi.object({
    feedback: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Feedback cannot be empty',
      'string.max': 'Feedback must not exceed 1000 characters',
      'any.required': 'Feedback is required',
    }),
  }),

  // Teacher homework creation schema (Section 2.6.2.2 - UC-09)
  teacherHomework: Joi.object({
    subject: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Subject cannot be empty',
      'string.max': 'Subject must not exceed 100 characters',
      'any.required': 'Subject is required',
    }),
    instructions: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Instructions must be at least 10 characters',
      'string.max': 'Instructions must not exceed 2000 characters',
      'any.required': 'Instructions are required',
    }),
    dueDate: Joi.date().min('now').required().messages({
      'date.min': 'Due date must be in the future',
      'any.required': 'Due date is required',
    }),
    classId: Joi.number().integer().positive().required().messages({
      'number.base': 'Class ID must be a number',
      'number.integer': 'Class ID must be an integer',
      'number.positive': 'Class ID must be positive',
      'any.required': 'Class ID is required',
    }),
  }),

  event: Joi.object({
    title: Joi.string().min(1).max(150).required().messages({
      'string.min': 'Event title cannot be empty',
      'string.max': 'Event title must not exceed 150 characters',
      'any.required': 'Event title is required',
    }),
    description: Joi.string().min(1).required().messages({
      'string.min': 'Event description cannot be empty',
      'any.required': 'Event description is required',
    }),
    eventDate: Joi.date().iso().required().messages({
      'date.format': 'Event date must be a valid date',
      'any.required': 'Event date is required',
    }),
    eventType: Joi.string()
      .valid('exam', 'meeting', 'holiday', 'activity', 'other')
      .required()
      .messages({
        'any.only': 'Event type must be one of: exam, meeting, holiday, activity, other',
        'any.required': 'Event type is required',
      }),
    location: Joi.string().max(255).optional(),
    targetAudience: Joi.string()
      .valid('all', 'guardians_only', 'teachers_only', 'specific_class')
      .default('all'),
  }),
};
