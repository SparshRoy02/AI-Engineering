# Day 5 – Open Source AI Models (Hugging Face)

A complete study guide covering formats, model types, hands-on installs, and the concepts you need to reason about running open models yourself.

## Part 1: Hugging Face — What It Actually Is

Hugging Face is the "GitHub of AI models." It hosts three things you'll use constantly:

- **Model Hub** (`huggingface.co/models`) — pretrained weights for almost every open model that exists
- **Datasets Hub** — training/eval datasets
- **Spaces** — hosted demos (usually Gradio or Streamlit apps) where you can try a model in the browser before installing anything

Every model has a model card (a `README.md` on its page) — more on this in Part 3.

### Install the core library:

```bash
pip install transformers huggingface_hub torch
```

---

## Part 2: File Formats & Model Categories

### GGUF Models

GGUF (GPT-Generated Unified Format) is a single-file binary format built for running LLMs efficiently on CPUs and consumer GPUs, used by `llama.cpp` and tools built on it (Ollama, LM Studio, koboldcpp).

**Key traits:**
- Bundles weights + tokenizer + metadata (architecture, context length, etc.) in one `.gguf` file — no separate config files needed.
- Almost always quantized (`Q4_K_M`, `Q5_K_M`, `Q8_0`, etc.) — see Quantization below.
- Optimized for CPU inference via memory-mapping, so you can run a 7B–13B model on a laptop with no GPU, just slower.
- Successor to the older GGML format.

*When you'd use it:* running an LLM locally on your own laptop for a portfolio demo/chatbot without needing a GPU.

*Example naming:* `mistral-7b-instruct.Q4_K_M.gguf` → 7B params, K-quant, medium variant.

### Safetensors

Safetensors is a file format (by Hugging Face) for storing tensors (model weights) — the modern replacement for PyTorch's `.bin`/pickle files.

**Why it exists:**
- Python's pickle (used by `.bin`) can execute arbitrary code on load — a real security risk when downloading random weights off the internet.
- `.safetensors` stores only raw tensor data + a JSON header, so it cannot execute code — safe by design.
- Faster to load (uses memory-mapping, zero-copy).
- Now the default format on Hugging Face; most model repos ship both `.bin` and `.safetensors`, but you should always prefer `.safetensors`.

> **GGUF vs Safetensors — don't confuse them:** safetensors is a storage format used across the whole ecosystem (LLMs, vision, audio, diffusion models) for full-precision or lightly quantized weights loaded via transformers/diffusers; GGUF is a deployment format, specifically for `llama.cpp`-style CPU/edge inference of LLMs.

### Embedding Models

An embedding model converts text (or images) into a fixed-length vector of numbers that captures semantic meaning — similar meaning → vectors close together in space (measured by cosine similarity).

**Used for:**
- Semantic search
- RAG (Retrieval-Augmented Generation) pipelines
- Clustering/deduplication of text
- Recommendation systems

Output is typically a vector of 384, 768, or 1024 dimensions. Stored in a vector database (FAISS, Chroma, Pinecone, Qdrant) for fast similarity lookup.

### Reranking Models

A reranker takes a query + a list of candidate documents (usually retrieved by an embedding-model search) and re-scores them for relevance — more accurate than embedding similarity alone, but slower, so it's used as a second-stage filter.

**Typical RAG pipeline:**
1. Embed the query → search vector DB → get top 50 candidates (fast, approximate)
2. Rerank those 50 with a cross-encoder reranker → keep top 3–5 (slow, precise)
3. Feed the top few into the LLM prompt

*Example models:* `BAAI/bge-reranker-base`, `cohere-rerank`, `mixedbread-ai/mxbai-rerank`.

### Vision Models

Models that process images — covers a wide range:
- **Image classification:** ResNet, ViT (Vision Transformer)
- **Image generation:** Stable Diffusion, Flux (text → image)
- **Vision-language models (VLMs):** LLaVA, Qwen-VL, GPT-4V-style — take image + text, output text (e.g., "describe this chart")
- **Object detection/segmentation:** YOLO, SAM (Segment Anything)

For a data analyst, the most relevant vision use case is a VLM reading a chart/screenshot, or OCR-style extraction from scanned documents/invoices.

### Audio Models

Models that process or generate sound (non-speech-specific), e.g., music generation (MusicGen), sound classification, audio event detection. Overlaps with Speech Models below but "audio" is the broader category.

### Speech Models

Two directions:
- **Speech-to-Text (ASR):** Whisper — audio in, transcript out
- **Text-to-Speech (TTS):** Kokoro, Bark, XTTS — text in, audio out

---

## Part 3: Understand — Model Cards, Licenses, Quantization, Hardware

### Model Cards

The README on a Hugging Face model page. A good model card tells you:
- Architecture & parameter count (e.g., 7B, 82M)
- Intended use & limitations (what it's good/bad at)
- Training data (what it was trained on — important for bias/licensing questions)
- Evaluation benchmarks (accuracy on standard tests, so you can compare models objectively)
- License
- How to load it (code snippet using transformers or diffusers)

Always read the model card before using a model in a project — it's the difference between "this looks impressive in a demo" and "this actually works for my use case."

### Licenses

Common licenses you'll see on Hugging Face, roughly from most to least permissive:

| License | Commercial use? | Notes |
| :--- | :--- | :--- |
| **Apache 2.0** | Yes | Very permissive, patent grant included. Kokoro, BGE, many embedding models use this. |
| **MIT** | Yes | Very permissive, minimal restrictions. |
| **OpenRAIL / CreativeML OpenRAIL-M** | Yes, with use restrictions | Stable Diffusion's license — allows commercial use but bans certain harmful applications. |
| **Llama license (Meta)** | Yes, with conditions | Free unless you have 700M+ monthly active users; some redistribution rules. |
| **Non-commercial / research-only** | No | Some Flux variants (FLUX.1 [dev]) are non-commercial only; FLUX.1 [schnell] is Apache 2.0. |
| **CC-BY-NC** | No | Creative Commons, non-commercial. |

Always check the license before using a model in anything you plan to monetize or use in a client/employer project — this matters a lot for a data analyst portfolio you might show to recruiters, since using a non-commercial model in a "production-style" demo can raise red flags.

### Quantization

Quantization reduces the numerical precision of model weights to shrink file size and speed up inference, at a small cost to accuracy.

- **Full precision:** FP32 (32-bit) or FP16/BF16 (16-bit) — what models are trained in.
- **Quantized:** INT8, INT4, or GGUF's own scheme (Q2 through Q8, with variants like Q4_K_M).

**Rule of thumb for a 7B parameter model:**
- ~28 GB RAM/VRAM at FP32
- ~14 GB at FP16
- ~4–5 GB at Q4 (4-bit GGUF)

This is why GGUF + quantization exists — it's what makes running a 7B–13B LLM on a normal laptop possible at all. The tradeoff: lower bit-depth = smaller/faster but slightly worse output quality. `Q4_K_M` is the common "sweet spot" people use for local inference.

### GPU Requirements

Roughly, VRAM needed scales with parameter count and precision:

| Model size | FP16 VRAM | INT4/Q4 VRAM |
| :--- | :--- | :--- |
| **1–3B** | ~4–6 GB | ~2 GB |
| **7B** | ~14 GB | ~5 GB |
| **13B** | ~26 GB | ~8–9 GB |
| **70B** | ~140 GB | ~35–40 GB |

Consumer GPUs (RTX 3060 12GB, RTX 4060 Ti 16GB) can comfortably run quantized 7B–13B models. Anything 30B+ typically needs a data-center GPU (A100/H100) or heavy quantization + CPU offload.

### CPU Compatibility

- **GGUF models** via `llama.cpp`/Ollama run entirely on CPU (no GPU needed) — slower tokens/second, but fully usable for demos, small projects, and learning.
- **Embedding models** and **small reranker models** (the ones you're installing below) are lightweight enough to run comfortably on CPU — no GPU required at all for Sentence Transformers, BGE, or Nomic Embed at normal usage volumes.
- **Image/video generation** (Stable Diffusion, Flux) and **Whisper's larger checkpoints** are much faster on GPU but can still run on CPU (just minutes instead of seconds per image).

---

## Part 4: Install & Compare — Hands-On

### 1. Sentence Transformers

The standard library for embedding models. Wraps many models (including BGE and Nomic) under one simple API.

```bash
pip install sentence-transformers
```

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")  # small, fast, 384-dim
embeddings = model.encode(["Data analyst with Python and SQL skills", "SQL and Python data analytics expert"])
print(embeddings.shape)  # (2, 384)
```

### 2. BAAI BGE

BGE (BAAI General Embedding) — from the Beijing Academy of AI. One of the strongest open embedding families, especially `bge-large-en-v1.5`. Tops the MTEB (Massive Text Embedding Benchmark) leaderboard for its size class.

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")  # 384-dim, fast
embeddings = model.encode(["your text here"])
```

> **Note:** BGE recommends prefixing queries with `"Represent this sentence for searching relevant passages: "` for retrieval tasks — check the model card.

### 3. Nomic Embed

Nomic AI's embedding model — notable because it's fully open (open weights and open training data/code, unlike most competitors), and supports long context (8192 tokens) and Matryoshka embeddings (you can truncate the vector to a smaller size and still get good performance — great when storage/speed matters).

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)
embeddings = model.encode(["your text here"])
```

#### Sentence Transformers vs BGE vs Nomic — comparison:

| Feature | Sentence Transformers (MiniLM) | BGE (large) | Nomic Embed v1.5 |
| :--- | :--- | :--- | :--- |
| **Dimensions** | 384 | 1024 | 768 (truncatable via Matryoshka) |
| **Speed** | Fastest | Medium | Medium |
| **Retrieval quality** | Good baseline | Excellent | Excellent |
| **Max context** | 256 tokens | 512 tokens | 8192 tokens |
| **Openness** | Fully open | Fully open | Fully open (weights + data + training code) |
| **Best for** | Quick prototypes, low resource | Best-in-class retrieval | Long documents, flexible vector size |

### 4. Whisper (Speech-to-Text)

OpenAI's open-source ASR model. Comes in sizes tiny → base → small → medium → large-v3, trading speed for accuracy.

```bash
pip install openai-whisper
```

```python
import whisper

model = whisper.load_model("base")
result = model.transcribe("audio.mp3")
print(result["text"])
```

CPU-friendly at tiny/base; large-v3 benefits heavily from GPU.

### 5. Kokoro TTS (Text-to-Speech)

An 82-million-parameter open-weight TTS model that delivers quality comparable to much larger models while being significantly faster and more cost-efficient, released under the Apache 2.0 license. Despite its tiny size it briefly ranked #1 on the community TTS arena leaderboard for voice quality.

```bash
pip install kokoro
```

```python
from kokoro import KPipeline

pipeline = KPipeline(lang_code='a')  # 'a' = American English
generator = pipeline("Hello, this is a test of Kokoro text to speech.", voice='af_bella')
for i, (gs, ps, audio) in enumerate(generator):
    import soundfile as sf
    sf.write(f'output_{i}.wav', audio, 24000)
```

*Strength:* tiny footprint means it runs comfortably on CPU in near real-time — good for local/edge deployment, unlike heavier TTS models (Bark, XTTS) that usually want a GPU.

### 6. Stable Diffusion (Image Generation)

Text-to-image diffusion model from Stability AI. Runs via the `diffusers` library.

```bash
pip install diffusers transformers accelerate
```

```python
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16)
pipe = pipe.to("cuda")  # or "cpu" (much slower)
image = pipe("a data dashboard on a laptop screen, modern office").images[0]
image.save("output.png")
```

### 7. Flux

Newer, higher-quality text-to-image model family from Black Forest Labs (founded by former Stable Diffusion creators). Generally sharper detail and better prompt adherence than Stable Diffusion 1.5, at the cost of needing more VRAM.

```python
from diffusers import FluxPipeline
import torch

pipe = FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-schnell", torch_dtype=torch.bfloat16)
pipe = pipe.to("cuda")
image = pipe("a data dashboard on a laptop screen, modern office", num_inference_steps=4).images[0]
image.save("output.png")
```

> **Note the license difference:** `FLUX.1-schnell` is Apache 2.0 (commercial-safe); `FLUX.1-dev` is non-commercial research license only — check before using in any portfolio project you'll show to employers.

#### Stable Diffusion vs Flux comparison:

| Feature | Stable Diffusion 1.5 | Flux.1-schnell |
| :--- | :--- | :--- |
| **Image quality/detail** | Good | Excellent |
| **Prompt following** | Moderate | Very strong |
| **Speed** | Fast (~20-50 steps) | Very fast (4 steps by design) |
| **VRAM needed** | ~4-6 GB | ~12+ GB (less with quantized versions) |
| **License** | OpenRAIL (commercial ok, some restrictions) | Apache 2.0 (schnell) — commercial safe |

---

## Quick Reference Summary

| Concept | One-line takeaway |
| :--- | :--- |
| **GGUF** | Single-file, quantized, CPU-friendly LLM format for `llama.cpp`/Ollama |
| **Safetensors** | Safe, fast weight-storage format — the default now for all model types |
| **Embedding models** | Turn text into vectors for semantic search/RAG |
| **Reranker** | Second-stage precision filter on top of embedding search |
| **Model card** | The README that tells you what a model actually is/does/costs |
| **License** | Apache/MIT = safe for commercial/portfolio use; check before using research-only models |
| **Quantization** | Trade a little accuracy for much smaller size + faster inference |
| **GPU vs CPU** | Embeddings/rerankers/small TTS run fine on CPU; image gen and large LLMs want GPU |
