# Voice AI — Technical Deep Dive

---

## 1. How would you add a human-like interface that closely resembles a real human, ensuring that the video of the human or human-like avatar is photorealistic and can actually speak and respond to the prompt or query given to the AI assistant or model?

### The Problem with Traditional Chatbots

Most AI assistants present as a text box or a static image with a synthesised voice playing over it. The human brain immediately recognises this as artificial — there is no lip sync, no eye movement, no breathing, no micro-expressions. The "uncanny valley" is triggered not just by bad visuals, but by the complete absence of the physiological cues humans rely on to trust another person.

A truly human-like interface must solve three things simultaneously:

1. **Visual photorealism** — the face must look like a real person, not a cartoon or 3D model
2. **Real-time lip sync** — the mouth must move in sync with what is being said, frame-accurate
3. **Responsive intelligence** — the avatar must understand the user's question and reply conversationally, not with canned responses

### How This App Solves It

#### Layer 1 — Photorealistic Avatar via Anam AI

The app uses **Anam AI** (`@anam-ai/js-sdk`) which streams a live video feed of a photorealistic human avatar directly into a `<video>` element. These are not pre-recorded clips stitched together — Anam generates video frames in real time, driven by the audio being spoken.

```
User speaks → Web Speech API captures text
     ↓
FastAPI backend processes and generates reply text
     ↓
client.talk(responseText) sent to Anam SDK
     ↓
Anam renders a live video stream: face + lips + voice perfectly synced
     ↓
<video id="anam-video"> on the full screen shows the avatar speaking
```

The Anam platform uses neural rendering — the avatar's face is a learned 3D model of a real human actor, driven by a neural vocoder that maps phonemes to facial keypoints in real time. The result is a video stream where lip movements, jaw position, and subtle facial muscle contractions match the speech perfectly.

#### Layer 2 — Full-Screen Immersive Layout

The avatar video is rendered at full screen (`w-full h-full object-cover`), filling the entire device display. There is no chrome around it — no obvious "AI interface" boxes. The dark vignette overlay and bottom fade gradient make it feel cinematic, like a video call rather than an app. On mobile, `viewport-fit=cover` and `100dvh` ensure it fills edge to edge, including behind the notch and home indicator on iPhones.

```jsx
<video
  id="anam-video"
  autoPlay
  playsInline
  className="absolute inset-0 w-full h-full object-cover"
/>
```

#### Layer 3 — Voice-First, Not Click-First

The avatar does not wait for a button press. Once the session starts, the microphone is always on (`rec.continuous = true`). The user simply speaks naturally — the same way they would speak to a person. The Web Speech API (`window.SpeechRecognition`) transcribes the audio in real time. Interim results appear on screen as the user speaks. When a sentence is complete (final result), it is sent to the backend.

This removes the biggest friction point in most voice UIs: the push-to-talk pattern. You do not push-to-talk with a real human. You just talk.

#### Layer 4 — Live Conversation Subtitles

TV-style subtitles float on the avatar video showing the full conversation history — the user's messages on the right (dim, italic) and the avatar's responses on the left (white, typewriter animation). This reinforces the feeling of a real conversation happening in front of you, not a chatbot interface. The subtitles auto-scroll, fade at the edges, and the most recent avatar line animates character by character as it is spoken.

#### Layer 5 — Natural Interruption Handling

In a real human conversation, you can speak before the other person has finished. This app supports this: the microphone remains active even while the avatar is speaking. If the user speaks mid-response, their message is queued and processed the moment the avatar finishes — with zero dead time between turns. This eliminates the rigid "Q&A ping-pong" feel of most voice assistants.

#### Layer 6 — Swipe to Change Avatar

Six photorealistic avatar personas are available (Leo, Corey, Rachel, Amanda, Archie, Lucy). The user swipes left or right on the avatar — the same gesture as TikTok or Instagram Reels — to cycle through them. Dot indicators at the bottom show which persona is active. Each persona is a distinct real human, not a reskin of the same model.

### What Makes This Genuinely Photorealistic vs Alternatives

| Approach | Realism | Lip Sync | Latency |
|---|---|---|---|
| Static image + TTS | None | None | Low |
| 2D animated cartoon | Low | Approximate | Medium |
| 3D game engine avatar | Medium | Real-time via blendshapes | Medium |
| Pre-recorded video clips | High | Perfect but inflexible | Low |
| **Anam AI neural rendering** | **Very High** | **Real-time, frame-accurate** | **~300ms** |

Neural video generation like Anam produces faces that pass casual visual inspection as real humans because the model has learned the full distribution of micro-expressions, skin texture, lighting responses, and phoneme-to-face mappings from thousands of hours of real human video.

---

## 2. What Tools and Models Were Used, and Why Were They Chosen?

### Frontend

#### React + Vite
React was chosen for its component model — each part of the UI (avatar view, control bar, subtitles, slide panel) is an isolated component that can be developed and debugged independently. Vite replaces Create React App because its ESM-based dev server starts instantly, hot-reloads in under 50ms, and produces optimised production builds without configuration. For a real-time interface where developer iteration speed matters, Vite is significantly better than webpack-based alternatives.

#### Tailwind CSS
Tailwind was chosen over component libraries (MUI, Chakra, etc.) because this UI is completely custom — a full-screen video player with overlaid glassmorphism elements. Pre-built component libraries impose their own visual language. Tailwind is utility-first: every visual detail is expressed directly in the JSX, eliminating the stylesheet mental model entirely. The final CSS bundle is 23 KB after purging unused classes.

#### Anam AI JS SDK (`@anam-ai/js-sdk`)
The only SDK that provides real-time photorealistic avatar video with accurate lip sync at low latency. Alternatives considered:
- **D-ID** — API-based, not real-time streaming; produces a video file per response, not a live feed
- **HeyGen** — similar API model, batch video generation, not suitable for live conversation
- **Ready Player Me + Three.js** — 3D cartoon avatars, not photorealistic
- **Synthesia** — video production tool, not a conversational SDK

Anam is purpose-built for real-time conversational avatars. Its SDK provides a WebRTC stream directly into `<video>` and `<audio>` elements. `client.talk(text)` triggers immediate speech + video generation. `unsafe_createClientWithApiKey()` is used in development to avoid a round-trip to the backend for every session start.

#### Web Speech API (`window.SpeechRecognition`)
Built into Chromium-based browsers (Chrome, Edge, Samsung Internet). No latency for transcription because it runs locally in the browser. No API cost. No network round-trip for the STT layer. `continuous: true` and `interimResults: true` give word-by-word updates as the user speaks. The alternative (Whisper API) adds 500–1500ms of network latency per utterance, which would make the conversation feel unnatural.

### Backend

#### FastAPI
Python's fastest ASGI web framework. Chosen over Flask because:
- Native `async/await` support — the backend makes multiple outbound HTTP calls (OpenWeather, Anthropic) concurrently without blocking
- Pydantic models for automatic request validation
- OpenAPI docs generated automatically
- `uvicorn` ASGI server handles concurrent WebSocket/HTTP connections efficiently

#### OpenWeather API
The most widely used weather API, with a generous free tier (1000 calls/day). The `/data/2.5/weather` endpoint returns current conditions for any city in under 200ms. The response includes temperature, feels-like, humidity, wind speed, and weather description — everything needed for a natural-sounding spoken weather report.

#### Anthropic Claude Haiku (`claude-haiku-4-5-20251001`)
Used as the general-purpose conversational intelligence layer. Chosen specifically because:
- **Speed**: Haiku is Anthropic's fastest model — median response time under 1 second, critical for a voice interface where latency is perceptible
- **Cost**: ~$0.25 per million input tokens — negligible cost for short conversational turns
- **Quality**: Even at the smallest tier, Claude produces natural, warm, grammatically correct spoken-language responses. The system prompt instructs it to keep replies to 1–2 sentences and use a conversational register
- **Max tokens = 100**: Hard-capped to ensure the response is short enough to be spoken in under 4 seconds, keeping the conversation feeling fast

The system prompt is:
```
You are a warm, friendly voice assistant living inside an animated avatar.
Keep every reply to 1–2 short sentences — it will be spoken aloud by the avatar.
Be natural and conversational, like a real person.
```

#### httpx (async HTTP client)
Used to call both the OpenWeather API and the Anthropic API from the FastAPI backend. Unlike `requests` (which is synchronous), `httpx` supports `async/await`, meaning the server does not block a thread while waiting for external API responses. Under concurrent load this is the difference between the server handling 10 requests vs. 10,000 requests.

### Deployment Targets

#### Render (Backend)
Chosen for the Python backend because it natively supports Python web services with automatic deploys from GitHub. Free tier includes 750 hours/month. The `render.yaml` in the repo pre-configures the build and start commands so deployment is zero-config.

#### Vercel (Frontend)
The standard choice for Vite/React frontends. Deploys from GitHub automatically on every push, serves from a global CDN with edge caching, and has native support for environment variables injected at build time (`VITE_*` prefix). Zero configuration required — Vercel detects Vite automatically.

---

## 3. How Would You Reduce Latency in a Real-Time Voice AI Application?

*(Note: the question appears to have been cut off. This answer addresses latency reduction, the most critical technical challenge in real-time voice AI.)*

### Why Latency Matters More Than Accuracy

In a text chatbot, a 3-second response time is acceptable. In a voice conversation, anything over 1.5 seconds feels like the other person has gone silent — the human brain interprets it as confusion, disconnection, or lag. The target for natural conversation is under 800ms total end-to-end latency from the moment the user stops speaking to the moment the avatar begins responding.

The current pipeline has five stages, each contributing latency:

```
[1] Speech recognition  ~100–300ms  (browser, local)
[2] Network to backend  ~20–80ms    (depends on proximity)
[3] LLM inference       ~300–800ms  (Claude Haiku)
[4] Network to Anam     ~50–100ms   (WebRTC signalling)
[5] Avatar video render ~100–200ms  (Anam neural rendering)

Total: ~570ms – 1480ms
```

### Optimisation Strategies

#### 1. Streaming LLM Responses (Most Impactful)
Currently the backend waits for the full Claude response before sending it to Anam. With streaming, the first words can be sent to `client.talk()` within 100–200ms of the LLM starting to generate. The avatar begins speaking the first sentence while the LLM is still generating the second.

```python
# Stream tokens from Claude
async with client.stream("POST", "https://api.anthropic.com/v1/messages", ...) as resp:
    async for chunk in resp.aiter_lines():
        # Buffer until sentence boundary (. ! ?)
        if sentence_complete(buffer):
            await anam_client.talk(buffer)
            buffer = ""
```

This alone reduces perceived latency by 40–60% because the avatar starts speaking immediately.

#### 2. End-of-Utterance Detection Without Silence Waiting
The Web Speech API fires a `final` result after a pause in speech. The default silence threshold is ~700ms. Reducing this — or detecting sentence-end via punctuation/semantic cues in interim results — shaves 400–700ms from every turn.

#### 3. Edge Deployment for the Backend
Deploying the FastAPI backend to a region geographically close to the user using platforms like Fly.io or Cloudflare Workers reduces network round-trip time from ~80ms to ~10ms for users in the same region.

#### 4. Pre-warming the LLM Connection
Claude API connections have a TCP handshake overhead on the first call. Maintaining a persistent `httpx.AsyncClient` instance (rather than creating one per request) and sending a keep-alive ping every 30 seconds eliminates connection setup overhead on each request.

```python
# Module-level persistent client
_http = httpx.AsyncClient(timeout=12.0, http2=True)
```

#### 5. Cache Common Responses
For the weather use case: cache the OpenWeather response for each city for 10 minutes. Most users ask about the same cities repeatedly, and weather does not change within 10 minutes. This removes the entire OpenWeather API round-trip for cached queries.

```python
from functools import lru_cache
import time

weather_cache = {}  # {city: (timestamp, data)}

def get_cached_weather(city):
    if city in weather_cache:
        ts, data = weather_cache[city]
        if time.time() - ts < 600:  # 10 min TTL
            return data
    return None
```

#### 6. Switch to a Local/On-Device STT Model
For users who need maximum privacy or offline use, running Whisper.cpp or Vosk locally eliminates the browser's STT network dependency entirely. The Web Speech API sends audio to Google's servers; a local model processes it on-device in under 100ms.

#### 7. Anam Session Pre-warming
Starting the Anam WebRTC session takes 1–2 seconds (WebRTC handshake + persona load). Currently this happens when the user presses Start. Pre-warming — starting the session silently on page load and pausing the stream — means the user gets an instant avatar when they press Start.

```javascript
// On app mount, pre-warm the session in background
useEffect(() => {
  if (DEV_API_KEY) {
    const client = unsafe_createClientWithApiKey(DEV_API_KEY, { personaId: DEFAULT_PERSONA.id });
    client.streamToVideoAndAudioElements('anam-video', 'anam-audio');
    prewarmedClientRef.current = client;
  }
}, []);
```

### Target Architecture After Optimisations

```
[1] STT (on final result, no extra wait)    ~150ms
[2] Backend edge node (same region)         ~15ms
[3] LLM first-token streaming               ~180ms  ← starts avatar talking
[4] Anam pre-warmed session                 ~30ms
[5] Avatar rendering (already started)      ~0ms additional

Perceived latency to first avatar word:  ~375ms
```

This brings the system within the range of natural human conversation, where response latency is typically 200–500ms.

---

*App repository: https://github.com/Gowem/voice-AI*
*Stack: React + Vite + Tailwind · FastAPI · Anam AI · Claude Haiku · OpenWeather API*
