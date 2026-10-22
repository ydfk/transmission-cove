export interface ReleaseInfo { tag: string; version: string; url: string; notes: string; installable: boolean }
export const releaseApi: string
export const releasesPage: string
export function parseVersion(value: unknown): { numbers: bigint[]; pre: string[] } | null
export function newerVersion(candidate: string, current: string): boolean
export function releaseInfo(value: unknown): ReleaseInfo
