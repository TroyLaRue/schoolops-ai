export type GmailConnectionStatus = 'not_connected' | 'oauth_pending' | 'connected';
export type GmailActionType = 'draft_created' | 'draft_approved' | 'email_sent';

export interface GmailActionLogEntry {
  id: string;
  type: GmailActionType;
  message: string;
  timestamp: string;
}

const STATUS_KEY = 'schoolops.gmail.status';
const LOG_KEY = 'schoolops.gmail.action-log';
export const GMAIL_STATE_EVENT = 'schoolops:gmail-state-change';

const isBrowser = () => typeof window !== 'undefined';

export function getGmailStatus(): GmailConnectionStatus {
  if (!isBrowser()) return 'not_connected';
  const status = window.localStorage.getItem(STATUS_KEY);
  return status === 'oauth_pending' || status === 'connected' ? status : 'not_connected';
}

export function setGmailStatus(status: GmailConnectionStatus) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STATUS_KEY, status);
  window.dispatchEvent(new Event(GMAIL_STATE_EVENT));
}

export function getGmailActionLog(): GmailActionLogEntry[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOG_KEY) ?? '[]') as GmailActionLogEntry[];
  } catch {
    return [];
  }
}

export function addGmailActionLog(type: GmailActionType, message: string) {
  if (!isBrowser()) return;
  const entry: GmailActionLogEntry = {
    id: `${Date.now()}-${type}`,
    type,
    message,
    timestamp: new Date().toISOString(),
  };
  window.localStorage.setItem(LOG_KEY, JSON.stringify([entry, ...getGmailActionLog()].slice(0, 30)));
  window.dispatchEvent(new Event(GMAIL_STATE_EVENT));
}

export function canSendWithGmail() {
  return getGmailStatus() === 'connected';
}