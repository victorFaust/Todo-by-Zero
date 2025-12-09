import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

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

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 })
    }

    await ensureDbFile()
    const data = await fs.readFile(DB_FILE, "utf-8")
    const users: User[] = JSON.parse(data)

    if (users.some((u) => u.email === email)) {
      return Response.json({ error: "User already exists" }, { status: 400 })
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashPassword(password),
    }

    users.push(newUser)
    await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2))

    // Set session cookie
    const response = Response.json({ success: true })
    response.headers.set("Set-Cookie", `userId=${newUser.id}; Path=/; HttpOnly; SameSite=Lax`)
    return response
  } catch (error) {
    return Response.json({ error: "Registration failed" }, { status: 500 })
  }
}
