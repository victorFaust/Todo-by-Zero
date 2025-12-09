export async function POST() {
  const response = Response.json({ success: true })
  response.headers.set("Set-Cookie", "userId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
  return response
}
