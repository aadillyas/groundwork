import { AnalysisState } from './types'

export const DEMO_IDEA = 'Record a voice memo and automatically turn it into a structured PRD'

export const DEMO_RESULT: AnalysisState = {
  phase: 'complete',
  idea: DEMO_IDEA,
  decompose: {
    components: [
      {
        name: 'Audio Recording (Browser)',
        description: 'Capture microphone input in the browser and export to a format suitable for transcription.',
        searchQueries: ['browser audio recording javascript mediarecorder', 'recordrtc web audio capture npm'],
      },
      {
        name: 'Speech-to-Text Transcription',
        description: 'Convert raw audio into accurate text, handling technical jargon, accents, and filler words.',
        searchQueries: ['openai whisper self-hosted transcription python', 'faster-whisper local inference server'],
      },
      {
        name: 'Conversational Text Cleanup',
        description: 'Strip filler words, fix self-corrections, and segment the raw transcript into coherent topics before PRD generation.',
        searchQueries: ['llm transcript cleanup structured extraction prompt', 'voice memo to structured notes nlp'],
      },
      {
        name: 'PRD Generation via LLM',
        description: 'Transform a cleaned transcript into a structured PRD with sections: overview, goals, user stories, success metrics, and open questions.',
        searchQueries: ['prd generator llm structured output open source', 'product requirements document ai generation github'],
      },
      {
        name: 'Structured Output Enforcement',
        description: 'Ensure LLM output reliably conforms to a typed PRD schema — no hallucinated sections, no missing fields.',
        searchQueries: ['pydantic ai structured output llm validation', 'instructor python openai structured extraction'],
      },
    ],
  },
  search: {
    results: [
      {
        component: 'Audio Recording (Browser)',
        repos: [
          {
            name: 'RecordRTC',
            fullName: 'muaz-khan/RecordRTC',
            description: 'WebRTC JavaScript library for audio/video/screen recording across all browsers',
            stars: 6400,
            language: 'JavaScript',
            license: 'MIT',
            lastCommit: '2024-11-02T00:00:00Z',
            url: 'https://github.com/muaz-khan/RecordRTC',
            topics: ['webrtc', 'recording', 'audio', 'video', 'javascript'],
          },
          {
            name: 'Recorderjs',
            fullName: 'mattdiamond/Recorderjs',
            description: 'A plugin for recording/exporting the output of the Web Audio API',
            stars: 3100,
            language: 'JavaScript',
            license: 'MIT',
            lastCommit: '2021-05-10T00:00:00Z',
            url: 'https://github.com/mattdiamond/Recorderjs',
            topics: ['web-audio-api', 'recording', 'wav'],
          },
          {
            name: 'web-audio-recorder-js',
            fullName: 'higuma/web-audio-recorder-js',
            description: 'Records audio input and encodes to WAV, OGG, or MP3 format',
            stars: 890,
            language: 'JavaScript',
            license: 'MIT',
            lastCommit: '2020-03-14T00:00:00Z',
            url: 'https://github.com/higuma/web-audio-recorder-js',
            topics: ['audio', 'recorder', 'mp3', 'ogg', 'wav'],
          },
        ],
      },
      {
        component: 'Speech-to-Text Transcription',
        repos: [
          {
            name: 'whisper',
            fullName: 'openai/whisper',
            description: 'Robust Speech Recognition via Large-Scale Weak Supervision',
            stars: 97100,
            language: 'Python',
            license: 'MIT',
            lastCommit: '2025-06-25T00:00:00Z',
            url: 'https://github.com/openai/whisper',
            topics: ['speech-recognition', 'whisper', 'openai', 'asr', 'multilingual'],
          },
          {
            name: 'faster-whisper',
            fullName: 'SYSTRAN/faster-whisper',
            description: 'Faster Whisper transcription with CTranslate2 — 4x faster, same accuracy',
            stars: 15200,
            language: 'Python',
            license: 'MIT',
            lastCommit: '2025-05-18T00:00:00Z',
            url: 'https://github.com/SYSTRAN/faster-whisper',
            topics: ['whisper', 'speech-recognition', 'ctranslate2', 'asr'],
          },
          {
            name: 'whisper.cpp',
            fullName: 'ggml-org/whisper.cpp',
            description: 'Port of OpenAI Whisper model in C/C++ — runs on CPU, GPU, WASM',
            stars: 48300,
            language: 'C++',
            license: 'MIT',
            lastCommit: '2025-06-20T00:00:00Z',
            url: 'https://github.com/ggml-org/whisper.cpp',
            topics: ['whisper', 'cpp', 'wasm', 'edge', 'inference'],
          },
          {
            name: 'whishper',
            fullName: 'pluja/whishper',
            description: '100% local audio transcription and translation web app, powered by Whisper',
            stars: 2900,
            language: 'Go',
            license: 'AGPL-3.0',
            lastCommit: '2025-01-10T00:00:00Z',
            url: 'https://github.com/pluja/whishper',
            topics: ['whisper', 'self-hosted', 'transcription', 'docker', 'translation'],
          },
        ],
      },
      {
        component: 'Conversational Text Cleanup',
        repos: [
          {
            name: 'langchain',
            fullName: 'langchain-ai/langchain',
            description: 'Build context-aware reasoning applications with LLMs',
            stars: 98400,
            language: 'Python',
            license: 'MIT',
            lastCommit: '2025-06-28T00:00:00Z',
            url: 'https://github.com/langchain-ai/langchain',
            topics: ['llm', 'langchain', 'agents', 'rag', 'openai'],
          },
          {
            name: 'instructor',
            fullName: '567-labs/instructor',
            description: 'Structured outputs for LLMs — lightweight, fast, Pydantic-based',
            stars: 9800,
            language: 'Python',
            license: 'MIT',
            lastCommit: '2025-06-15T00:00:00Z',
            url: 'https://github.com/567-labs/instructor',
            topics: ['llm', 'structured-output', 'pydantic', 'openai', 'extraction'],
          },
        ],
      },
      {
        component: 'PRD Generation via LLM',
        repos: [
          {
            name: 'ai-prd-generator',
            fullName: 'cdeust/ai-prd-generator',
            description: 'Multi-LLM PRD generator — outputs SQL DDL, API specs, JIRA tickets, and test cases',
            stars: 340,
            language: 'Python',
            license: 'MIT',
            lastCommit: '2024-09-12T00:00:00Z',
            url: 'https://github.com/cdeust/ai-prd-generator',
            topics: ['prd', 'llm', 'product-management', 'ai'],
          },
          {
            name: 'PRD_GENERATOR',
            fullName: 'YPS7/PRD_GENERATOR',
            description: 'Next.js + Groq AI web app for converting ideas to structured PRDs',
            stars: 87,
            language: 'TypeScript',
            license: 'MIT',
            lastCommit: '2024-08-03T00:00:00Z',
            url: 'https://github.com/YPS7/PRD_GENERATOR',
            topics: ['prd', 'nextjs', 'groq', 'typescript'],
          },
          {
            name: 'GTPlanner',
            fullName: 'OpenSQZ/GTPlanner',
            description: 'AI-powered PRD generation tool with Claude Code plugin support',
            stars: 210,
            language: 'Python',
            license: 'Apache-2.0',
            lastCommit: '2025-03-22T00:00:00Z',
            url: 'https://github.com/OpenSQZ/GTPlanner',
            topics: ['prd', 'claude', 'product-planning', 'ai-agent'],
          },
        ],
      },
      {
        component: 'Structured Output Enforcement',
        repos: [
          {
            name: 'pydantic-ai',
            fullName: 'pydantic/pydantic-ai',
            description: 'Agent Framework / shim to use Pydantic with LLMs — type-safe AI outputs',
            stars: 16200,
            language: 'Python',
            license: 'MIT',
            lastCommit: '2025-06-26T00:00:00Z',
            url: 'https://github.com/pydantic/pydantic-ai',
            topics: ['pydantic', 'llm', 'agents', 'structured-output', 'type-safe'],
          },
          {
            name: 'outlines',
            fullName: 'dottxt-ai/outlines',
            description: 'Structured text generation — guarantee valid JSON, regex, or grammar output from any LLM',
            stars: 11400,
            language: 'Python',
            license: 'Apache-2.0',
            lastCommit: '2025-06-20T00:00:00Z',
            url: 'https://github.com/dottxt-ai/outlines',
            topics: ['structured-generation', 'llm', 'json-schema', 'constrained-decoding'],
          },
        ],
      },
    ],
  },
  synthesise: {
    existenceCheck: {
      verdict: 'partial',
      summary: 'All five components exist as mature OSS libraries — Whisper alone has 97k stars. But no project combines them end-to-end into a voice → PRD pipeline. The integration layer, voice-specific prompt engineering, and the UX for reviewing a transcript before generating the PRD are genuinely unbuilt.',
    },
    gapAnalysis: 'The transcription layer is solved (Whisper / faster-whisper). Browser recording is solved (RecordRTC + native MediaRecorder). Structured LLM output is solved (Instructor / PydanticAI). What doesn\'t exist: (1) a prompt template designed specifically for voice memos — existing PRD generators expect structured text input, not rambling first-person speech; (2) a transcript review step that lets the user correct transcription errors before PRD generation; (3) a clarification pass where the LLM asks follow-up questions for anything vague ("you mentioned real-time — what latency is acceptable?"); (4) a single deployable stack that wires all three together with a clean UI. The gap is not in any individual piece — it\'s in the orchestration and the voice-specific prompt layer.',
    strategy: {
      recommendation: 'combine-multiple',
      reasoning: 'Use faster-whisper (SYSTRAN/faster-whisper) as your transcription backend — it\'s 4x faster than vanilla Whisper with identical accuracy and trivially self-hostable via Docker. Use the native MediaRecorder API for browser recording (skip RecordRTC — it\'s overkill for a single-mic use case). Use Instructor (567-labs/instructor) for structured PRD output — lighter than LangChain and purpose-built for this. Your differentiation is entirely in the prompt layer: write a two-pass prompt (cleanup pass → PRD generation pass) that treats the transcript as raw conversational input, not a structured brief. Add a transcript review UI between recording and generation — this single UX step will separate your product from every existing tool.',
      repos: [
        'SYSTRAN/faster-whisper',
        '567-labs/instructor',
        'pydantic/pydantic-ai',
        'ggml-org/whisper.cpp',
      ],
    },
    scores: {
      originality: { score: 68, label: 'Novel' },
      reliance: { score: 78, label: 'Mostly OSS' },
      buildability: { score: 71, label: 'Ship in weeks' },
    },
    componentStrategies: [
      {
        name: 'Audio Recording (Browser)',
        action: 'use',
        reason: 'Use the native MediaRecorder API — it ships in every modern browser with zero dependencies and handles single-mic recording cleanly.',
      },
      {
        name: 'Speech-to-Text Transcription',
        action: 'use',
        reason: 'Use SYSTRAN/faster-whisper — it is 4x faster than vanilla Whisper with identical accuracy and runs self-hosted via Docker in minutes.',
      },
      {
        name: 'Conversational Text Cleanup',
        action: 'build',
        reason: 'No OSS library handles voice-memo-specific cleanup — stripping filler words, resolving self-corrections, and segmenting by topic requires a custom prompt layer.',
        suggestedPath: 'src/prompts/cleanup.py',
      },
      {
        name: 'PRD Generation via LLM',
        action: 'build',
        reason: 'Existing PRD generators expect structured text input — none handle raw voice transcripts. The two-pass prompt (cleanup → PRD) is your core IP.',
        suggestedPath: 'src/prompts/prd_generator.py',
      },
      {
        name: 'Structured Output Enforcement',
        action: 'use',
        reason: 'Use 567-labs/instructor — it is the lightest, fastest library for enforcing typed LLM output and integrates directly with your existing OpenAI/Anthropic client.',
      },
    ],
    exportMarkdown: `---
idea: Record a voice memo and automatically turn it into a structured PRD
strategy: combine-multiple
date: ${new Date().toISOString().slice(0, 10)}
---

## Agent Instructions

You are a senior engineer bootstrapping a new project based on a Groundwork analysis. Read this file carefully before writing any code. Clone the repositories listed below into a \`vendor/\` directory. Create the scaffold structure exactly as shown. For components marked BUILD, implement them from scratch following the build instructions — do not look for alternatives. For components marked USE, integrate the cloned repo rather than reimplementing. Begin with the scaffold, then work through BUILD components in order.

## Clone These Repos

\`\`\`bash
git clone https://github.com/SYSTRAN/faster-whisper vendor/faster-whisper
git clone https://github.com/567-labs/instructor vendor/instructor
git clone https://github.com/pydantic/pydantic-ai vendor/pydantic-ai
git clone https://github.com/ggml-org/whisper.cpp vendor/whisper-cpp
\`\`\`

## Project Scaffold

\`\`\`
project/
├── vendor/
│   ├── faster-whisper/     ← USE: transcription backend
│   ├── instructor/         ← USE: structured LLM output
│   ├── pydantic-ai/        ← USE: type-safe agent framework
│   └── whisper-cpp/        ← USE: WASM fallback for browser
├── src/
│   ├── recording/          ← USE: native MediaRecorder API (no library)
│   ├── transcription/      ← USE: wraps faster-whisper
│   ├── prompts/
│   │   ├── cleanup.py      ← BUILD: voice cleanup prompt
│   │   └── prd_generator.py ← BUILD: two-pass PRD generation
│   ├── api/                ← BUILD: FastAPI or Express server
│   └── ui/                 ← BUILD: recording + review + PRD display
└── GROUNDWORK.md           ← this file
\`\`\`

## Components: Use vs Build

| Component | Action | Reason |
|---|---|---|
| Audio Recording (Browser) | **USE** | Native MediaRecorder API — zero deps, ships in every browser |
| Speech-to-Text Transcription | **USE** | SYSTRAN/faster-whisper — 4x faster than Whisper, Docker-ready |
| Conversational Text Cleanup | **BUILD** | No OSS equivalent for voice-memo-specific cleanup |
| PRD Generation via LLM | **BUILD** | Your core IP — two-pass prompt is the product differentiator |
| Structured Output Enforcement | **USE** | 567-labs/instructor — purpose-built for typed LLM output |

## Build Instructions

### Conversational Text Cleanup — \`src/prompts/cleanup.py\`

**Input:** Raw transcript string from faster-whisper (includes filler words, self-corrections, run-on sentences)
**Output:** Cleaned string segmented into coherent topic blocks, ready for PRD generation
**Key implementation notes:**
- Strip filler words: "um", "uh", "like", "you know", "sort of"
- Resolve self-corrections: "we should — actually no, we shouldn't" → remove the abandoned thought
- Segment by topic: insert \`---\` between topic shifts
- Preserve all concrete details (numbers, names, features) — never summarise at this stage

### PRD Generation via LLM — \`src/prompts/prd_generator.py\`

**Input:** Cleaned transcript string from the cleanup pass
**Output:** Structured PRD JSON with sections: overview, goals, user_stories, success_metrics, open_questions
**Key implementation notes:**
- Two-pass approach: cleanup pass first, PRD pass second (do not combine)
- Tell the LLM explicitly: "This input is a cleaned voice memo transcript. Treat it as raw requirements, not a structured brief."
- Use instructor to enforce the PRD schema — never parse free-form LLM output
- After generation, run a clarification pass: ask 3-5 follow-up questions for anything vague

## Open Questions

1. **Self-host vs API for transcription?** Self-hosting faster-whisper gives privacy + zero per-call cost but requires a GPU instance. The OpenAI Whisper API is simpler but charges per minute and sends audio to OpenAI.
2. **Which LLM for PRD generation?** GPT-4o is fastest. Claude 3.5 Sonnet produces better structured prose. DeepSeek V3 is cheapest. Pick based on your latency and cost requirements.
3. **Transcript review step?** Adding a UI step where the user edits the transcript before PRD generation is the single biggest trust builder — but it adds friction. Decide before building the UI flow.
4. **Target PRD format?** Match your users' existing workflow. Notion export needs different formatting than Linear tickets or a Confluence page.
5. **Clarification pass — sync or async?** The LLM can ask follow-up questions (sync, adds latency) or generate a draft PRD and flag assumptions inline (async, faster). Choose before building the prompt layer.
`,
  },
}
