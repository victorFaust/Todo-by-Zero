import { promises as fs } from "fs"
import path from "path"

interface User {
  id: string
  email: string
  passwordHash: string
}

const DB_FILE = path.join(process.cwd(), "data", "users.json")

async function ensureDbFile() {
  try {
    await fs.access(DB_FILE)
  } catch {
    const dir = path.dirname(DB_FILE)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify([]))
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return Response.json({ error: "Email required" }, { status: 400 })
    }

    await ensureDbFile()
    const data = await fs.readFile(DB_FILE, "utf-8")
    const users: User[] = JSON.parse(data)

    // In a real app, you'd send an email here
    // For now, just check if user exists
    const userExists = users.some((u) => u.email === email)

    if (!userExists) {
      // For security, always return success even if user doesn't exist
      return Response.json({ success: true })
    }

    // TODO: Send password reset email
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Request failed" }, { status: 500 })
  }
}
