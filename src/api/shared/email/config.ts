import { Resend } from "resend";

export const DEFAULT_FROM = 'Bawiwi <onboarding@resend.dev>';

export const resend = new Resend(process.env.RESEND_API_KEY);