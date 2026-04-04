import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

function enabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.GROUNDWORK_TRACE === '1'
}

export async function writeTraceArtifact(stage: string, payload: unknown): Promise<void> {
  if (!enabled()) return

  try {
    const traceDir = path.join(process.cwd(), '.groundwork-traces')
    await mkdir(traceDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(traceDir, `${stamp}-${stage}.json`)
    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
  } catch (error) {
    console.warn('trace write failed', error)
  }
}
