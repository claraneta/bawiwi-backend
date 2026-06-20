import { Resend } from "resend";

export const DEFAULT_FROM = 'Bawiwi <noreply@bawiwi.ewi>';

export const resend = new Resend(process.env.RESEND_API_KEY);