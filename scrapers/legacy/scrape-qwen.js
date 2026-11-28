// Qwen Studio API wrapper — reverse-engineered dari APK Android Qwen Chat v2.5.1
// Base: https://play.google.com/store/apps/details?id=ai.qwenlm.chat.android
// Credit: struktur payload & header dari @Shannz

import axios from "axios"
import crypto from "crypto"
import fs from "fs"
import path from "path"

const BASE = "https://chat.qwen.ai/api/v2"

// ── Thinking mode mapping (web Qwen: Fast / Auto / Think) ──
// fast  → thinking_enabled=false, auto_thinking=false  (langsung jawab)
// auto  → thinking_enabled=true,  auto_thinking=true   (model decide)
// think → thinking_enabled=true,  auto_thinking=false  (thinking mendalam)
function thinkingConfig(mode) {
    switch (mode) {
        case "fast":  return { thinking_enabled: false, auto_thinking: false }
        case "think": return { thinking_enabled: true,  auto_thinking: false }
        default:      return { thinking_enabled: true,  auto_thinking: true  }  // auto
    }
}
const UA = "Dalvik/2.1.0 (Linux; U; Android 15; 25028RN03A Build/AP3A.240905.015.A2) AliApp(QWENCHAT/2.5.1) AppType/Release AplusBridgeLite,Dalvik/2.1.0 (Linux; U; Android 15; 25028RN03A Build/AP3A.240905.015.A2)"

// ── Credentials (override via env) ──
const QWEN_EMAIL = process.env.QWEN_EMAIL || "qwen.discolor071@passinbox.com"
const QWEN_PASSWORD = process.env.QWEN_PASSWORD || "EJx*UKsp^NB7ZQP*Q&@GV^@!wTWFbCS^m"

// ── State ──
let cachedToken = null
let cookieJar = ""

// ── Helpers ──
const sleep = ms => new Promise(r => setTimeout(r, ms))

const uuid = () => crypto.randomUUID()

const hashPassword = pw => crypto.createHash("sha256").update(pw).digest("hex")

const deviceId = () => "ai" + crypto.createHash("md5").update(uuid()).digest("hex")

function getHeaders(token, extra = {}) {
    const h = {
        "User-Agent": UA,
        "Connection": "Keep-Alive",
        "Accept": "application/json",
        "X-Platform": "android",
        "source": "app",
        "Accept-Language": "en-US",
        "Accept-Charset": "UTF-8",
        "Cache-Control": "no-store",
        "app_waf": "Z9Tr56YmQpXcO2K_d_3nAbJvRqMLFW8HTNjvRguWHEowM1xY",
        "x-request-id": uuid(),
        "x-device-id": deviceId(),
        ...extra
    }
    if (token) h["Authorization"] = `Bearer ${token}`
    if (cookieJar) h["Cookie"] = cookieJar
    return h
}

function updateCookies(response) {
    const setCookie = response.headers["set-cookie"]
    if (!setCookie) return
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
    const parsed = cookies.map(c => c.split(";")[0])
    const existing = cookieJar ? cookieJar.split("; ").filter(Boolean) : []
    const all = [...existing]
    for (const p of parsed) {
        const key = p.split("=")[0]
        const idx = all.findIndex(c => c.split("=")[0] === key)
        if (idx >= 0) all[idx] = p
        else all.push(p)
    }
    cookieJar = all.join("; ")
}

function getFileType(filename) {
    const ext = path.extname(filename).toLowerCase()
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return "image"
    if ([".mp4", ".avi", ".mov", ".mkv"].includes(ext)) return "video"
    return "file"
}

function getMimeType(filetype) {
    if (filetype === "image") return "image/jpeg"
    if (filetype === "video") return "video/mp4"
    return "application/octet-stream"
}

// ── Parse SSE (Server-Sent Events) stream ──
function parseSSE(chunk) {
    const lines = chunk.toString().split("\n")
    const events = []
    let current = { event: "message", data: "" }
    for (const line of lines) {
        if (line.startsWith("event:")) {
            if (current.data) events.push({ ...current })
            current = { event: line.substring(6).trim(), data: "" }
        } else if (line.startsWith("data:")) {
            current.data += line.substring(5).trim()
        } else if (line === "" && current.data) {
            events.push({ ...current })
            current = { event: "message", data: "" }
        }
    }
    if (current.data) events.push(current)
    return events
}

// ── API Methods ──
export async function login(email, password) {
    const hashed = hashPassword(password)
    const res = await axios.post(`${BASE}/auths/signin`, {
        email, password: hashed
    }, { headers: getHeaders(null) })
    updateCookies(res)
    if (!res.data.success) throw new Error("Login gagal: " + JSON.stringify(res.data.data))
    return { token: res.data.data.token, user: res.data.data }
}

export async function signup(email, password, name) {
    const hashed = hashPassword(password)
    const res = await axios.post(`${BASE}/auths/signup`, {
        email, password: hashed, name
    }, { headers: getHeaders(null) })
    updateCookies(res)
    if (!res.data.success) throw new Error("Signup gagal: " + JSON.stringify(res.data.data))
    return { token: res.data.data.token, user: res.data.data }
}

// Token caching + auto-relogin
export async function getToken() {
    if (cachedToken) return cachedToken
    const { token } = await login(QWEN_EMAIL, QWEN_PASSWORD)
    cachedToken = token
    return token
}

export function expireToken() {
    cachedToken = null
}

export async function createSession(token) {
    const res = await axios.post(`${BASE}/chats/new`, {
        chat_mode: "normal", project_id: ""
    }, { headers: getHeaders(token) })
    updateCookies(res)
    if (!res.data.success) throw new Error("Gagal buat session: " + JSON.stringify(res.data.data))
    return res.data.data.id
}

export async function deleteSession(token, chatId) {
    try {
        await axios.delete(`${BASE}/chats/${chatId}`, { headers: getHeaders(token) })
        return true
    } catch { return false }
}

export async function getModels(token) {
    try {
        const res = await axios.get(`${BASE}/models/`, { headers: getHeaders(token) })
        if (!res.data.success) return []
        const raw = res.data.data.data || []
        return raw.map(m => {
            const meta = m.info?.meta || {}
            return {
                id: m.id,
                name: m.name,
                description: meta.description || "",
                max_context: meta.max_context_length || 0,
                thinking: meta.abilities?.thinking || 0,
                vision: !!meta.capabilities?.vision,
                search: !!meta.capabilities?.search,
                document: !!meta.capabilities?.document,
                video: !!meta.capabilities?.video,
                audio: !!meta.capabilities?.audio,
                chat_types: meta.chat_type || [],
                modality: meta.modality || []
            }
        })
    } catch { return [] }
}

// Download file dari URL → simpan ke tmp → return { path, name, type, size }
export async function downloadFile(url) {
    // Pakai fetch native (bukan axios) agar tidak tercampur Accept default axios
    const fetchRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KaminoaBot/1.0)" },
        redirect: "follow"
    })
    if (!fetchRes.ok) throw new Error(`Download gagal: HTTP ${fetchRes.status}`)
    const buf = Buffer.from(await fetchRes.arrayBuffer())
    const contentType = (fetchRes.headers.get("content-type") || "application/octet-stream").split(";")[0].trim()
    let ext = ".bin"
    if (contentType.startsWith("image/")) ext = ".jpg"
    else if (contentType.startsWith("video/")) ext = ".mp4"
    else if (contentType.includes("pdf")) ext = ".pdf"
    else if (contentType.includes("text")) ext = ".txt"

    let name = "file" + ext
    try { name = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || name) } catch {}
    if (!name.includes(".")) name += ext

    const tmpPath = path.join("/tmp", `qwen_${Date.now()}_${name}`)
    fs.writeFileSync(tmpPath, buf)
    const type = getFileType(name)
    return { path: tmpPath, name, type, size: buf.length }
}

// Upload file ke Qwen OSS
export async function uploadFile(token, filePath) {
    const stats = fs.statSync(filePath)
    const filename = path.basename(filePath)
    const filetype = getFileType(filename)
    const mimeType = getMimeType(filetype, filename)
    const fileBuffer = fs.readFileSync(filePath)

    // 1. Dapatkan STS token
    const stsRes = await axios.post(`${BASE}/files/getstsToken`, {
        filename, filetype, filesize: stats.size.toString()
    }, { headers: getHeaders(token) })
    updateCookies(stsRes)
    if (!stsRes.data.success) throw new Error("Gagal dapat STS token: " + JSON.stringify(stsRes.data.data))

    const sts = stsRes.data.data
    const fileId = sts.file_id
    const dateStr = new Date().toUTCString()
    const stringToSign = `PUT\n\n${mimeType}\n${dateStr}\nx-oss-security-token:${sts.security_token}\n/${sts.bucketname}/${sts.file_path}`
    const signature = crypto.createHmac("sha1", sts.access_key_secret).update(stringToSign).digest("base64")
    const putUrl = `https://${sts.bucketname}.${sts.region}.aliyuncs.com/${sts.file_path}`

    // 2. Upload ke Alibaba OSS
    await axios.put(putUrl, fileBuffer, {
        headers: {
            "User-Agent": "aliyun-sdk-android/2.9.21",
            "Authorization": `OSS ${sts.access_key_id}:${signature}`,
            "x-oss-security-token": sts.security_token,
            "Date": dateStr,
            "Content-Type": mimeType
        },
        maxBodyLength: Infinity
    })

    // 3. Parse file (non-image/video)
    if (filetype !== "image" && filetype !== "video") {
        const parseRes = await axios.post(`${BASE}/files/parse`, { file_id: fileId }, { headers: getHeaders(token) })
        if (!parseRes.data.success) throw new Error("Parse init gagal")

        let attempts = 0
        while (attempts < 30) {
            await sleep(3000)
            const statusRes = await axios.post(`${BASE}/files/parse/status`, {
                file_id_list: [fileId]
            }, { headers: getHeaders(token) })
            if (statusRes.data.success && statusRes.data.data.length > 0) {
                const s = statusRes.data.data[0]
                if (s.status === "success") break
                if (s.status === "failed") throw new Error("Parse file gagal: " + (s.error_code || ""))
            }
            attempts++
        }
        if (attempts >= 30) throw new Error("Parse file timeout")
    }

    return { id: fileId, type: filetype, name: filename, size: stats.size, url: sts.file_url }
}

// Buat file attachment payload untuk message
function buildFileAttachment(file) {
    const att = {
        type: file.type,
        file: {
            data: {},
            filename: file.name,
            meta: {
                name: file.name,
                size: file.size,
                content_type: file.type === "image" ? "" : file.type
            }
        },
        url: file.url,
        name: file.name,
        file_type: file.type === "image" ? undefined : file.name.split(".").pop()
    }
    if (file.type === "image") {
        att.image_width = 1000
        att.image_height = 1000
    }
    return att
}

// ── NON-STREAMING chat (mengumpulkan SSE lalu return) ──
export async function chatNonStream(token, chatId, prompt, options = {}) {
    const model = options.model || "qwen3.7-plus"
    const thinkCfg = thinkingConfig(options.thinking || "auto")
    const search = options.search !== false

    let fileAttachment = []
    if (options.file) {
        fileAttachment = [buildFileAttachment(options.file)]
    }

    const payload = {
        stream: true,
        incremental_output: true,
        chat_id: chatId,
        chat_mode: "normal",
        model,
        version: "2.1",
        messages: [{
            chat_type: "t2t",
            content: prompt,
            role: "user",
            feature_config: {
                output_schema: "phase",
                thinking_enabled: thinkCfg.thinking_enabled,
                thinking_format: "summary",
                auto_thinking: thinkCfg.auto_thinking,
                auto_search: search
            },
            timestamp: Math.floor(Date.now() / 1000),
            sub_chat_type: "t2t",
            models: [model],
            user_action: "chat",
            extra: { meta: { subChatType: "t2t" } },
            ...(fileAttachment.length > 0 && { files: fileAttachment })
        }],
        timestamp: Math.floor(Date.now() / 1000),
        share_id: "",
        origin_branch_message_id: ""
    }

    const res = await axios.post(`${BASE}/chat/completions?chat_id=${chatId}`, payload, {
        headers: getHeaders(token, {
            "Accept": "*/*,text/event-stream",
            "Content-Type": "application/json; charset=UTF-8"
        }),
        responseType: "stream",
        maxBodyLength: Infinity
    })

    return new Promise((resolve, reject) => {
        let fullText = "", thoughtText = "", searchResults = []
        let buffer = "", printedThoughts = 0, searchPrinted = false
        const timeout = setTimeout(() => resolve({ answer: fullText || "No response", thinking: thoughtText.trim(), searchResults }), 120000)

        res.data.on("data", chunk => {
            buffer += chunk.toString()
            const parts = buffer.split("\n\n")
            buffer = parts.pop() || ""

            for (const part of parts) {
                const events = parseSSE(part + "\n\n")
                for (const ev of events) {
                    if (!ev.data || ev.data === ":") continue
                    try {
                        const parsed = JSON.parse(ev.data)
                        if (parsed["response.created"]) continue
                        if (!parsed.choices?.length) continue
                        const delta = parsed.choices[0].delta
                        if (!delta) continue

                        if (delta.phase === "thinking_summary") {
                            const thoughts = delta.extra?.summary_thought?.content || []
                            for (let i = printedThoughts; i < thoughts.length; i++) {
                                thoughtText += thoughts[i] + "\n"
                            }
                            printedThoughts = thoughts.length
                        }
                        if ((delta.phase === "search" || delta.phase === "image_search") && !searchPrinted) {
                            if (delta.extra?.search_result) {
                                searchResults = delta.extra.search_result
                                searchPrinted = true
                            }
                        }
                        if (delta.phase === "answer" && delta.content) {
                            fullText += delta.content
                        }
                    } catch {}
                }
            }
        })

        res.data.on("end", () => {
            clearTimeout(timeout)
            resolve({ answer: fullText.trim(), thinking: thoughtText.trim(), searchResults })
        })
        res.data.on("error", err => {
            clearTimeout(timeout)
            reject(err)
        })
    })
}

// ── STREAMING chat (SSE → res.write) ──
export async function chatStream(token, chatId, prompt, res, options = {}) {
    const model = options.model || "qwen3.7-plus"
    const thinkCfg = thinkingConfig(options.thinking || "auto")
    const search = options.search !== false

    let fileAttachment = []
    if (options.file) {
        fileAttachment = [buildFileAttachment(options.file)]
    }

    const payload = {
        stream: true,
        incremental_output: true,
        chat_id: chatId,
        chat_mode: "normal",
        model,
        version: "2.1",
        messages: [{
            chat_type: "t2t",
            content: prompt,
            role: "user",
            feature_config: {
                output_schema: "phase",
                thinking_enabled: thinkCfg.thinking_enabled,
                thinking_format: "summary",
                auto_thinking: thinkCfg.auto_thinking,
                auto_search: search
            },
            timestamp: Math.floor(Date.now() / 1000),
            sub_chat_type: "t2t",
            models: [model],
            user_action: "chat",
            extra: { meta: { subChatType: "t2t" } },
            ...(fileAttachment.length > 0 && { files: fileAttachment })
        }],
        timestamp: Math.floor(Date.now() / 1000),
        share_id: "",
        origin_branch_message_id: ""
    }

    const apiRes = await axios.post(`${BASE}/chat/completions?chat_id=${chatId}`, payload, {
        headers: getHeaders(token, {
            "Accept": "*/*,text/event-stream",
            "Content-Type": "application/json; charset=UTF-8"
        }),
        responseType: "stream",
        maxBodyLength: Infinity
    })

    return new Promise((resolve, reject) => {
        let thinkingStarted = false, searchingStarted = false
        let printedThoughts = 0, searchPrinted = false
        let fullText = "", thoughtText = ""
        let buffer = ""
        let chunksSent = 0

        const send = (data) => {
            if (chunksSent === 0) {
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                })
            }
            chunksSent++
            res.write(`data: ${JSON.stringify(data)}\n\n`)
        }

        const timeout = setTimeout(() => {
            send({ phase: "done", answer: fullText.trim(), thinking: thoughtText.trim() })
            resolve()
        }, 120000)

        apiRes.data.on("data", chunk => {
            buffer += chunk.toString()
            const parts = buffer.split("\n\n")
            buffer = parts.pop() || ""

            for (const part of parts) {
                const events = parseSSE(part + "\n\n")
                for (const ev of events) {
                    if (!ev.data || ev.data === ":") continue
                    try {
                        const parsed = JSON.parse(ev.data)
                        if (parsed["response.created"]) continue
                        if (!parsed.choices?.length) continue
                        const delta = parsed.choices[0].delta
                        if (!delta) continue

                        if (delta.phase === "thinking_summary") {
                            if (!thinkingStarted) {
                                send({ phase: "thinking_start" })
                                thinkingStarted = true
                            }
                            const thoughts = delta.extra?.summary_thought?.content || []
                            for (let i = printedThoughts; i < thoughts.length; i++) {
                                thoughtText += thoughts[i] + "\n"
                                send({ phase: "thinking", content: thoughts[i] })
                            }
                            printedThoughts = thoughts.length
                        }
                        if ((delta.phase === "search" || delta.phase === "image_search")) {
                            if (!searchingStarted) {
                                send({ phase: "search_start" })
                                searchingStarted = true
                            }
                            if (delta.extra?.search_result && !searchPrinted) {
                                send({ phase: "search_results", content: delta.extra.search_result })
                                searchPrinted = true
                            }
                        }
                        if (delta.phase === "answer" && delta.content) {
                            fullText += delta.content
                            send({ phase: "answer", content: delta.content })
                        }
                    } catch {}
                }
            }
        })

        apiRes.data.on("end", () => {
            clearTimeout(timeout)
            send({ phase: "done", answer: fullText.trim(), thinking: thoughtText.trim() })
            resolve()
        })
        apiRes.data.on("error", err => {
            clearTimeout(timeout)
            send({ phase: "error", message: err.message })
            resolve()
        })
    })
}

// ── Image generation ──
export async function generateImage(token, chatId, prompt, options = {}) {
    const model = options.model || "qwen3.7-plus"
    const size = options.size || "1:1"

    let fileAttachment = []
    if (options.file) {
        fileAttachment = [{
            type: options.file.type,
            file: { data: {}, filename: options.file.name, id: options.file.id, meta: { name: options.file.name } },
            id: options.file.id,
            url: options.file.url,
            name: options.file.name,
            image_width: 1000,
            image_height: 1000,
        }]
    }

    const payload = {
        stream: true,
        incremental_output: true,
        chat_id: chatId,
        chat_mode: "normal",
        model,
        messages: [{
            chat_type: "t2i",
            content: prompt,
            role: "user",
            feature_config: {
                output_schema: "phase",
                thinking_enabled: false,
                thinking_format: "summary",
                auto_thinking: false,
                auto_search: true,
            },
            timestamp: Math.floor(Date.now() / 1000),
            sub_chat_type: "t2i",
            models: [model],
            user_action: "chat",
            extra: { meta: { subChatType: "t2i" } },
            ...(fileAttachment.length > 0 && { files: fileAttachment })
        }],
        timestamp: Math.floor(Date.now() / 1000),
        size,
        share_id: "",
        version: "2.1",
        origin_branch_message_id: ""
    }

    const res = await axios.post(`${BASE}/chat/completions?chat_id=${chatId}`, payload, {
        headers: getHeaders(token, {
            "Accept": "*/*,text/event-stream",
            "Content-Type": "application/json; charset=UTF-8"
        }),
        responseType: "stream",
        maxBodyLength: Infinity,
        validateStatus: () => true
    })

    if (res.status === 429 || res.headers["x-actual-status-code"] === "429") {
        const retryAfter = parseInt(res.headers["retry-after"] || "0")
        const mins = Math.ceil(retryAfter / 60)
        throw new Error(`Rate limited! Coba lagi dalam ${mins} menit`)
    }
    if (res.status !== 200) {
        let errBody = ""
        res.data.on("data", c => errBody += c.toString())
        await new Promise(r => res.data.on("end", r))
        throw new Error(`Image gen HTTP ${res.status}: ${errBody.slice(0, 200)}`)
    }

    return new Promise((resolve, reject) => {
        let imageUrl = "", imageWidth = 0, imageHeight = 0
        let buffer = ""
        const timeout = setTimeout(() => resolve(null), 120000)

        res.data.on("data", chunk => {
            buffer += chunk.toString()
            const parts = buffer.split("\n\n")
            buffer = parts.pop() || ""

            for (const part of parts) {
                const events = parseSSE(part + "\n\n")
                for (const ev of events) {
                    if (!ev.data || ev.data === ":") continue
                    try {
                        const parsed = JSON.parse(ev.data)
                        if (parsed["response.created"] || parsed["response.info"]) continue
                        if (!parsed.choices?.length) continue
                        const delta = parsed.choices[0].delta
                        if (!delta) continue

                        if (delta.phase === "image_gen" && delta.content?.startsWith("http")) {
                            imageUrl = delta.content
                            imageWidth = parsed.usage?.width || delta.extra?.output_image_hw?.[0]?.[0] || 0
                            imageHeight = parsed.usage?.height || delta.extra?.output_image_hw?.[0]?.[1] || 0
                        }
                    } catch {}
                }
            }
        })

        res.data.on("end", () => {
            clearTimeout(timeout)
            resolve(imageUrl ? { url: imageUrl, width: imageWidth, height: imageHeight } : null)
        })
        res.data.on("error", err => {
            clearTimeout(timeout)
            reject(err)
        })
    })
}

// ── Video generation ──
export async function generateVideo(token, chatId, prompt, options = {}) {
    const model = options.model || "qwen3.7-plus"
    const size = options.size || "16:9"

    const payload = {
        stream: false,
        incremental_output: false,
        chat_id: chatId,
        chat_mode: "normal",
        model,
        messages: [{
            chat_type: "t2v",
            content: prompt,
            role: "user",
            feature_config: {
                output_schema: "phase",
                thinking_enabled: false,
                thinking_format: "summary",
                auto_thinking: false,
                auto_search: true,
            },
            timestamp: Math.floor(Date.now() / 1000),
            sub_chat_type: "t2v",
            models: [model],
            user_action: "chat",
            extra: { meta: { subChatType: "t2v" } }
        }],
        timestamp: Math.floor(Date.now() / 1000),
        size,
        share_id: "",
        version: "2.1",
        origin_branch_message_id: ""
    }

    const res = await axios.post(`${BASE}/chat/completions?chat_id=${chatId}`, payload, {
        headers: getHeaders(token, {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=UTF-8"
        }),
        maxBodyLength: Infinity,
        validateStatus: () => true
    })

    if (res.status === 429 || res.data?.data?.code === "RateLimited") {
        const details = res.data?.data?.details || ""
        const match = details.match(/(\d+)\s*hour/)
        const hours = match ? parseInt(match[1]) : "unknown"
        throw new Error(`Rate limited! Coba lagi dalam ${hours} jam`)
    }
    if (!res.data.success) {
        throw new Error("Video gen init gagal: " + JSON.stringify(res.data))
    }

    const taskId = res.data.data.messages?.[0]?.extra?.wanx?.task_id
    if (!taskId) throw new Error("No task_id in response")

    // Poll status
    let videoUrl = null
    for (let i = 0; i < 60; i++) {
        await sleep(5000)
        try {
            const statusRes = await axios.get(`${BASE.replace("/v2", "/v1")}/tasks/status/${taskId}`, {
                headers: getHeaders(token, { "Accept": "application/json" })
            })
            if (statusRes.data.task_status === "success") {
                videoUrl = statusRes.data.content
                break
            } else if (statusRes.data.task_status === "failed") {
                throw new Error("Video generation gagal: " + (statusRes.data.message || ""))
            }
        } catch (e) {
            if (e.message.includes("Video generation gagal")) throw e
        }
    }

    if (!videoUrl) throw new Error("Timeout menunggu video")
    return { url: videoUrl, task_id: taskId }
}

// ── High-level: chat dengan auto session + auto relogin ──
export async function ask(prompt, options = {}) {
    const { model, thinking, search, fileUrls, stream, res } = options
    let token
    try { token = await getToken() } catch (e) { throw new Error("Auth gagal: " + e.message) }

    // Upload file jika ada
    let uploaded = null
    let tmpPaths = []
    if (fileUrls?.length) {
        const firstUrl = fileUrls[0]
        try {
            const dl = await downloadFile(firstUrl)
            tmpPaths.push(dl.path)
            uploaded = await uploadFile(token, dl.path)
        } catch (e) {
            throw new Error("Gagal upload file: " + e.message)
        } finally {
            for (const p of tmpPaths) {
                try { fs.unlinkSync(p) } catch {}
            }
        }
    }

    // Buat session baru tiap request (one-shot)
    let chatId
    try { chatId = await createSession(token) } catch (e) { throw new Error("Gagal buat session: " + e.message) }

    try {
        if (options.mode === "t2i") {
            const result = await generateImage(token, chatId, prompt, { model, size: options.size, file: uploaded })
            return { type: "image", ...result }
        }
        if (options.mode === "t2v") {
            const result = await generateVideo(token, chatId, prompt, { model, size: options.size })
            return { type: "video", ...result }
        }

        // t2t (chat)
        if (stream && res) {
            await chatStream(token, chatId, prompt, res, { model, thinking, search, file: uploaded })
            return { type: "stream_done" }
        }

        const result = await chatNonStream(token, chatId, prompt, { model, thinking, search, file: uploaded })
        return { type: "chat", ...result }
    } finally {
        deleteSession(token, chatId)
    }
}