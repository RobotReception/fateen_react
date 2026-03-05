/**
 * ws-test.mjs — اختبار WebSocket للإشعارات
 * التشغيل: node ws-test.mjs
 */

import http from "http"
import crypto from "crypto"

async function login() {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            email: "pridea2025@gmail.com",
            password: "Moshebly@2002",
            tenant_id: "prideidea",
        })
        const req = http.request({
            hostname: "161.97.117.77",
            port: 4488,
            path: "/api/backend/v2/auth/login",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "tenant-id": "prideidea",
                "Content-Length": Buffer.byteLength(body),
            },
        }, (res) => {
            let data = ""
            res.on("data", (c) => (data += c))
            res.on("end", () => {
                try { resolve(JSON.parse(data)?.data?.token) }
                catch (e) { reject(new Error("Login parse error: " + data)) }
            })
        })
        req.on("error", reject)
        req.write(body)
        req.end()
    })
}

async function testWS(token) {
    return new Promise((resolve) => {
        const key = crypto.randomBytes(16).toString("base64")
        const path = `/api/backend/v2/notifications/ws?token=${token}`
        console.log("🔌 Connecting WS...")

        const req = http.request({
            hostname: "161.97.117.77",
            port: 4488,
            path,
            method: "GET",
            headers: {
                "Connection": "Upgrade",
                "Upgrade": "websocket",
                "Sec-WebSocket-Key": key,
                "Sec-WebSocket-Version": "13",
            },
        })

        req.on("upgrade", (res, socket) => {
            console.log("✅ CONNECTED!")

            let timer = setTimeout(() => {
                console.log("⏱️ No count message in 8s")
                socket.destroy()
                resolve(false)
            }, 8000)

            socket.on("data", (buf) => {
                const opcode = buf[0] & 0x0f
                if (opcode === 0x1) {
                    const masked = (buf[1] & 0x80) !== 0
                    let len = buf[1] & 0x7f
                    let offset = 2
                    if (len === 126) { len = buf.readUInt16BE(2); offset = 4 }
                    const text = buf.slice(offset, offset + len).toString("utf8")
                    try {
                        const msg = JSON.parse(text)
                        if (msg.type === "count") {
                            console.log(`📨 count → unread=${msg.unread} | total=${msg.total}`)
                            console.log("🎉 WebSocket يعمل!")
                            clearTimeout(timer)
                            socket.destroy()
                            resolve(true)
                        }
                    } catch { }
                } else if (opcode === 0x8) {
                    const code = buf.length > 3 ? buf.readUInt16BE(2) : 1000
                    console.log("🔌 Server closed. Code:", code)
                    if (code === 4001) console.log("❌ Invalid token!")
                    clearTimeout(timer)
                    socket.destroy()
                    resolve(false)
                }
            })

            socket.on("error", (e) => {
                console.error("❌ Socket error:", e.message)
                clearTimeout(timer)
                resolve(false)
            })
        })

        req.on("error", (e) => {
            console.error("❌ Connection error:", e.message)
            resolve(false)
        })

        req.end()
    })
}

console.log("=== WebSocket Test ===\n")
const token = await login()
if (!token) { console.error("❌ Login failed"); process.exit(1) }
console.log("🔑 Token:", token.substring(0, 40) + "...\n")
await testWS(token)
