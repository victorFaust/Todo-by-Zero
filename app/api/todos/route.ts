import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { cookies } from "next/headers"

interface Todo {
  id: string
  userId: string
  title: string
  body: string
  createdAt: string
}

const DB_FILE = path.join(process.cwd(), "data", "todos.json")

async function ensureDbFile() {
  try {
    await fs.access(DB_FILE)
  } catch {
    const dir = path.dirname(DB_FILE)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify([]))
  }
}

async function getUserId() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  return userId
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureDbFile()
    const data = await fs.readFile(DB_FILE, "utf-8")
    const todos: Todo[] = JSON.parse(data)
    const userTodos = todos.filter((t) => t.userId === userId)

    return Response.json({ todos: userTodos })
  } catch (error) {
    return Response.json({ error: "Failed to fetch todos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, body } = await req.json()

    if (!title) {
      return Response.json({ error: "Title required" }, { status: 400 })
    }

    await ensureDbFile()
    const data = await fs.readFile(DB_FILE, "utf-8")
    const todos: Todo[] = JSON.parse(data)

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      userId,
      title,
      body: body || "",
      createdAt: new Date().toISOString(),
    }

    todos.push(newTodo)
    await fs.writeFile(DB_FILE, JSON.stringify(todos, null, 2))

    return Response.json({ todo: newTodo })
  } catch (error) {
    return Response.json({ error: "Failed to create todo" }, { status: 500 })
  }
}
