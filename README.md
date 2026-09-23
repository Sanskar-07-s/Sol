# SOL — Personal AI Operating Environment

SOL is an original, personal AI operating environment designed around a living computational energy core. Rather than presenting a generic chat interface or marketing dashboard, SOL provides a direct, contextual interface into an intelligent computing system.

---

## Architectural Principles

1. **Clean-Sheet Foundation**: Completely original codebase designed from scratch without legacy dependencies or copied templates.
2. **Computational Living Core**: The center of the environment is reserved for the SOL Core — an interactive 3D WebGL computational heart whose physical and visual state directly reflects system activity.
3. **Progressive Disclosure**: UI panels do not permanently clutter the screen. Contextual messages, active agent tasks, and telemetry disclose themselves only when active or requested.
4. **Decoupled Architecture**: Strict separation between the visual presentation layer, the state machine, telemetry streams, and future runtime backend services.
5. **No Fake Functionality**: Development fixtures are explicitly labeled; unfinished capabilities are not disguised with simulated production claims.

---

## Batch 1 Implementation Status

- [x] **Repository & Hygiene**: Clean Git configuration with strict `.gitignore` protection.
- [x] **Frontend Foundation**: Vite + React 19 + TypeScript with minimal dependencies (`three`, `lucide-react`).
- [x] **Design Tokens & System**: Modern typography, deep cosmic color palette (`tokens.css`), accessibility, and reduced-motion support.
- [x] **Application Shell**: Top status indicator, central reserved Core space, contextual task & message slots, integrated bottom command bar, and development telemetry pill.
- [x] **SOL State Machine**: Robust 12-state transition engine (`STANDBY`, `IDLE`, `LISTENING`, `UNDERSTANDING`, `THINKING`, `PLANNING`, `EXECUTING`, `SPEAKING`, `SUCCESS`, `WARNING`, `ERROR`, `OFFLINE`).
- [x] **WebGL Core Pipeline**: Mount/unmount lifecycle, devicePixelRatio handling, mouse/pointer interaction plumbing, and baseline Three.js WebGL validation mesh.
- [x] **Developer State Switcher**: Non-production debug overlay accessible via the backtick/tilde key (`` ` `` or `~`) to inspect state transitions instantly.
- [x] **Backend Contract**: Strongly typed WebSocket/IPC contracts prepared for future runtime integration.
- [ ] **Phase 2 (Future)**: Custom GLSL shaders for the pulsar singularity, accretion disk, axial relativistic plasma jets, and real-time audio FFT reactivity.
- [ ] **Phase 3 (Future)**: Real runtime daemon connection (Python / C++ system agent, local AI model inference, computer control).

---

## Directory Structure

```
d:\Sol
├── .gitignore
├── README.md
├── 1st.png                  # Visual design reference 1 (Atmosphere & Nebula)
├── 2nd.png                  # Visual design reference 2 (Pulsar Core & Accretion)
└── frontend/                # React + Vite + TypeScript application
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx          # Main operating environment shell
        ├── main.tsx
        ├── styles/          # Design tokens, typography, global styling
        ├── core/            # Sol Core WebGL container & canvas pipeline
        ├── state/           # State machine, store, and type definitions
        ├── services/        # Backend contracts & telemetry service
        └── components/      # UI components (Header, CommandBar, Telemetry, etc.)
```

---

## Development Setup

### Prerequisites
- Node.js >= 18 (Tested on v24.14.1)
- npm >= 9 (Tested on 11.11.0)

### Getting Started

```powershell
# Navigate to frontend directory
cd d:\Sol\frontend

# Install dependencies
npm install

# Start local development server
npm run dev

# Run production type-check & build
npm run build
```

---

## License & Attribution

Internal clean-sheet architecture for Project SOL. Reference images (`1st.png` and `2nd.png`) are internal design references only and are not distributed as production assets.
