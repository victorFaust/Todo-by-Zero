import { promises as fs } from "fs"
import path from "path"
import { cookies } from "next/headers"

interface Todo {
  id: string
  userId: string
  title: string
  body: string
  createdAt: string
}

const DB_FILE = path.join(process.cwd(), "data", "todos.json")

async function getUserId() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  return userId
}

async function ensureDbFile() {
  try {
    await fs.access(DB_FILE)
  } catch {
    const dir = path.dirname(DB_FILE)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify([]))
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { title, body } = await req.json()

    await ensureDbFile()
    const data = await fs.readFile(DB_FILE, "utf-8")
    const todos: Todo[] = JSON.parse(data)

    const todoIndex = todos.findIndex((t) => t.id === id && t.userId === userId)
    if (todoIndex === -1) {
      return Response.json({ error: "Todo not found" }, { status: 404 })
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      title: title || todos[todoIndex].title,
      body: body ?? todos[todoIndex].body,
    }
    await fs.writeFile(DB_FILE, JSON.stringify(todos, null, 2))

    return Response.json({ todo: todos[todoIndex] })
  } catch (error) {
    return Response.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await ensureDbFile()
    const data = await fs.readFile(DB_FILE, "utf-8")
    const todos: Todo[] = JSON.parse(data)

    const todoIndex = todos.findIndex((t) => t.id === id && t.userId === userId)
    if (todoIndex === -1) {
      return Response.json({ error: "Todo not found" }, { status: 404 })
    }

    todos.splice(todoIndex, 1)
    await fs.writeFile(DB_FILE, JSON.stringify(todos, null, 2))

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}
