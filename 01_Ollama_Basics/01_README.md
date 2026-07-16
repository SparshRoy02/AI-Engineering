# Day 1 - Install & Configure Ollama
---

## What is Ollama?

**Ollama** is an open-source tool that allows you to run Large Language Models (LLMs) locally on your computer.

Instead of sending your prompts to cloud AI services, Ollama downloads and runs AI models directly on your own machine.

Popular models supported include:

- Llama 3
- Llama 3.1
- Llama 3.2
- Gemma
- Mistral
- Phi
- DeepSeek
- Qwen
- CodeLlama
- TinyLlama

Ollama automatically handles downloading, configuring, and running models without requiring complex setup.

---

## Why Use Ollama?

Running AI locally offers several advantages:

- Complete privacy
- Works offline after downloading
- Faster response (low latency)
- No API costs
- Easy model management
- Supports multiple open-source LLMs
- Ideal for developers and AI enthusiasts

---

## Installing Ollama

### Windows

1. Visit **https://ollama.com**
2. Download the Windows installer.
3. Run the installer.
4. Finish installation.
5. Restart your terminal if needed.

---

### macOS

Install using Homebrew:

```bash
brew install ollama
```

Or download the installer from the official website.

---

### Linux

Run:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

### Verify Installation

Check the installed version:

```bash
ollama --version
```

Example:

```text
ollama version 0.10.x
```

View available commands:

```bash
ollama --help
```

Run a model:
```bash
ollama run llama3
```

List installed models:
```bash
ollama list
```

Delete a model:
```bash
ollama rm llama3
```

Show running models:
```bash
ollama ps
```

Stop running model:
```bash
ollama stop llama3
```


---

## Where Ollama Stores Models

Downloaded models are stored locally on your computer.

### Windows

```text
C:\Users\<Username>\.ollama\models
```

### Linux

```text
~/.ollama/models
```

### macOS

```text
~/.ollama/models
```

Typical folder structure:

```text
models
│
├── blobs
├── manifests
└── registry
```

The **blobs** folder stores the actual model files, while **manifests** contain metadata.

---

## Downloading Models

Run a model:

```bash
ollama run llama3
```

If the model is not installed:

- Downloads automatically
- Saves locally
- Loads into memory
- Starts chatting

Download only:

```bash
ollama pull llama3
```

Download a specific version:

```bash
ollama pull llama3:8b
```

---

## Viewing Installed Models

List all downloaded models:

```bash
ollama list
```

Example:

```text
NAME           SIZE

llama3:8b      4.7 GB
phi3:mini      2.3 GB
gemma:2b       1.7 GB
```

---

### Removing Models

Delete a model:

```bash
ollama rm llama3
```

Delete a specific version:

```bash
ollama rm llama3:8b
```

Verify:

```bash
ollama list
```

---

## Understanding Model Versions

Models have different **tags** that specify their size or variant.

Example:

```text
llama3
llama3:8b
llama3:70b
llama3:latest
```

| Tag | Meaning |
|------|----------|
| latest | Latest stable version |
| 8b | 8 Billion parameters |
| 70b | 70 Billion parameters |
| instruct | Chat/instruction tuned |
| vision | Supports image input |

Examples:

```bash
ollama run llama3:8b
```

```bash
ollama run gemma3:12b
```

Different versions vary in:

- Performance
- Accuracy
- Speed
- Memory usage
- Supported features

---

## Understanding Quantized Models

### What is Quantization?

- AI models normally store weights using **16-bit or 32-bit** numbers.

- Quantization compresses these weights into fewer bits.

Benefits:

- Smaller model size
- Lower RAM usage
- Faster inference
- Easier to run on consumer hardware

Trade-off:

- Slight reduction in accuracy.

---

### Quantization Levels

| Quantization | Quality | Speed | RAM Usage | Recommended For |
|--------------|---------|-------|-----------|-----------------|
| Q2 | Low | Fastest | Very Low | Very old PCs |
| Q3 | Medium | Very Fast | Low | Entry-level laptops |
| Q4 | Good | Fast | Moderate | Most users  |
| Q5 | Better | Moderate | Higher | Better accuracy |
| Q6 | Very Good | Slightly Slow | High | Powerful PCs |
| Q8 | Excellent | Slowest | Very High | High-end systems |

---

### Example

Original Model

```
16 GB
```

Q4 Quantized

```
≈4 GB
```

Q8 Quantized

```
≈8 GB
```

Q4 is generally considered the best balance between quality and memory usage.

---

## CPU vs GPU Execution

Ollama automatically detects available hardware.

---

### CPU Execution

Uses the processor.

### Advantages

- Works on every computer
- No dedicated GPU required

### Disadvantages

- Slower inference
- Higher CPU utilization

Best for:

- Small models
- Learning
- Testing

---

## GPU Execution

Uses the graphics card.

### Advantages

- Much faster responses
- Higher tokens/sec
- Better for large models

### Disadvantages

- Requires compatible GPU
- Limited by GPU VRAM

---

### Performance Comparison

| Hardware | Approx. Speed |
|-----------|---------------|
| CPU | 5–20 Tokens/sec |
| Mid-range GPU | 30–80 Tokens/sec |
| High-end GPU | 100+ Tokens/sec |

Actual performance depends on the model, quantization level, and hardware.

---

## Context Window & Token Limits

### What is a Context Window?

The context window is the maximum amount of information a model can remember during one conversation.

It includes:

- User prompts
- Previous responses
- Chat history
- Documents
- Retrieved context

If the context exceeds the model's limit, older content is removed or truncated.

---

### What is a Token?

A token is a small unit of text processed by an AI model.

Examples:

| Text | Approx. Tokens |
|------|----------------|
| Hello | 1 |
| My name is John | 4 |
| One page | ~500 |
| 1000 English words | ~1300 |

---

### Common Context Windows

| Model | Context Window |
|--------|----------------|
| Llama 3 | 8K |
| Llama 3.1 | 128K |
| Gemma 2 | 8K |
| Qwen 2.5 | Up to 128K |
| DeepSeek | Depends on version |

Larger context windows allow models to:

- Read longer documents
- Remember longer conversations
- Analyze large codebases
- Improve Retrieval-Augmented Generation (RAG)

---

## Model Parameters & RAM Usage

### What are Parameters?

Parameters are the learned weights inside a neural network.

Generally,

- More parameters = Better reasoning
- More parameters = Higher RAM usage
- More parameters = Slower inference

---

### Popular Model Sizes

| Model | Parameters |
|--------|------------|
| TinyLlama | 1.1B |
| Gemma | 2B |
| Phi-3 Mini | 3.8B |
| Mistral | 7B |
| Llama 3 | 8B |
| DeepSeek | 14B+ |
| Llama 3 70B | 70B |

---

### Approximate RAM Usage (Q4)

| Parameters | RAM Required |
|------------|--------------|
| 1B | ~1 GB |
| 2B | ~2 GB |
| 3B | ~3 GB |
| 7B | ~5–6 GB |
| 8B | ~6–8 GB |
| 13B | ~10–12 GB |
| 30B | ~20–24 GB |
| 70B | ~45–60 GB |

> **Note:** RAM usage depends on quantization, context size, runtime overhead, and whether inference runs on CPU or GPU.

---

## Useful Ollama Commands

| Command | Description |
|----------|-------------|
| `ollama run llama3` | Download (if needed) and run a model |
| `ollama pull llama3` | Download a model |
| `ollama list` | Show installed models |
| `ollama show llama3` | View model details |
| `ollama ps` | Show running models |
| `ollama stop <model>` | Stop a running model |
| `ollama rm llama3` | Remove a model |
| `ollama serve` | Start Ollama server |

---


