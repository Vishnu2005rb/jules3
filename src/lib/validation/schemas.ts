import { z } from 'zod';

export const submissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  eventId: z.string(), // Allow flexible ID format for now (e.g. seed data)
  reviewImageUrl: z.string().min(100, 'Invalid image data'), // Simple check for base64
  reviewLink: z.string().url('Invalid review link').optional().or(z.literal('')),
  socialLinks: z.record(z.any(), z.any()).optional(),
  dynamicFields: z.record(z.any(), z.any()).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export const eventSchema = z.object({
  name: z.string().min(3),
  eventCode: z.string().min(3),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  formTemplateId: z.string().optional(),
  certificateTemplateId: z.string().optional(),
});
