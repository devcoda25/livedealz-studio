import { z } from 'zod';

export const c2sJoinStudioSchema = z.object({
  studioId: z.string(),
});

export const c2sSendChatSchema = z.object({
  body: z.string().min(1).max(500),
});

export const c2sSetModeSchema = z.object({
  mode: z.enum(['lobby', 'live']),
});

export const c2sStartFlashDealSchema = z.object({
  durationSeconds: z.number().int().min(1),
  discountPercent: z.number().int().min(1).max(100),
});

export const c2sStopFlashDealSchema = z.object({});

export const c2sMarkMomentSchema = z.object({
  label: z.string().optional(),
});
