# AURAVOX

**Master Autonomous AI Operating System**

A modular AI ecosystem capable of reasoning, coding, media generation, autonomous workflows, multi-agent collaboration, and self-improvement.

## 🌟 Core Features

- **Orchestrator Core** - Master controller routing tasks to specialized agents
- **Multi-Agent System** - Architect, Builder, Designer, Critic, DevOps agents
- **Adaptive Reasoning** - FAST, THINK, and ADAPTIVE modes based on complexity
- **Memory Graph Engine** - Connected graph storing bugs, fixes, decisions, learnings
- **Safety Governor** - Three-tier safety: SAFE, CONFIRM, RESTRICTED
- **Plugin System** - Extensible architecture with sandbox testing

## 🚀 Quick Start

```bash
npm install
npm start
```

## 📁 Architecture

```
src/
├── index.js              # Main entry point
├── orchestrator/         # Task routing & coordination
│   └── OrchestratorCore.js
├── agents/               # Specialized AI agents
│   ├── BaseAgent.js
│   ├── ArchitectAgent.js
│   ├── BuilderAgent.js
│   ├── DesignerAgent.js
│   ├── CriticAgent.js
│   └── DevOpsAgent.js
├── engines/              # Core engines
│   └── ReasoningEngine.js
├── memory/               # Memory & learning
│   └── MemoryGraphEngine.js
├── safety/               # Safety & validation
│   ├── SafetyGovernor.js
│   └── test.js
├── plugins/              # Plugin system
│   └── PluginSystem.js
└── utils/                # Utilities
```

## 🧪 Testing

```bash
npm test
```

## 💡 Usage Example

```javascript
import AURAVOX from './src/index.js';

const auravox = new AURAVOX({
  mode: 'ADAPTIVE',
  safetyLevel: 'STANDARD'
});

const result = await auravox.process({
  type: 'code',
  description: 'Create a REST API endpoint'
});
```

## 🔒 Safety Levels

- **PERMISSIVE** - Minimal restrictions
- **STANDARD** - Balanced safety (default)
- **STRICT** - Maximum protection

## 📊 Reasoning Modes

- **FAST** - Instant response for simple tasks
- **THINK** - Deep analysis for complex problems
- **ADAPTIVE** - Auto-selects based on complexity

## 🎯 Agents

| Agent | Role |
|-------|------|
| Architect | Plans systems, designs architecture |
| Builder | Writes code, creates modules |
| Designer | Creates UI/UX, visual systems |
| Critic | Detects flaws, stress-tests logic |
| DevOps | Deployment, infrastructure, monitoring |

## License

MIT
