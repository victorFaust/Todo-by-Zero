"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Edit2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Todo {
  id: string
  title: string
  body: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const initializeUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      setUser(user)
      fetchTodos(supabase)
    }

    initializeUser()
  }, [router])

  const fetchTodos = async (supabaseClient?: any) => {
    try {
      const supabase = supabaseClient || createClient()
      const { data, error: fetchError } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setTodos(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos")
    } finally {
      setLoading(false)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      const supabase = createClient()
      const { data, error: insertError } = await supabase
        .from("todos")
        .insert([
          {
            title: title.trim(),
            body: body.trim(),
          },
        ])
        .select()

      if (insertError) throw insertError

      if (data) {
        setTodos([data[0], ...todos])
        setTitle("")
        setBody("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo")
    }
  }

  const handleUpdateTodo = async (id: string) => {
    try {
      const supabase = createClient()
      const { data, error: updateError } = await supabase
        .from("todos")
        .update({
          title: editTitle.trim(),
          body: editBody.trim(),
        })
        .eq("id", id)
        .select()

      if (updateError) throw updateError

      if (data) {
        setTodos(todos.map((t) => (t.id === id ? data[0] : t)))
        setEditingId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo")
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from("todos").delete().eq("id", id)

      if (deleteError) throw deleteError

      setTodos(todos.filter((t) => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo")
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditBody(todo.body)
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Todo by Zero</h1>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Add Todo Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTodo} className="space-y-4">
              <Input placeholder="Task title..." value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea
                placeholder="Task description (optional)..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
              <Button type="submit" className="w-full">
                Add Task
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todos List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Tasks</h2>
          {error && <p className="text-destructive text-sm">{error}</p>}

          {loading ? (
            <p className="text-muted-foreground">Loading tasks...</p>
          ) : todos.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No tasks yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            todos.map((todo) => (
              <Card key={todo.id}>
                <CardContent className="pt-6">
                  {editingId === todo.id ? (
                    <div className="space-y-4">
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateTodo(todo.id)} className="flex-1">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">{todo.title}</h3>
                      {todo.body && <p className="text-sm text-muted-foreground">{todo.body}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(todo.created_at).toLocaleDateString()}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(todo)}>
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteTodo(todo.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
