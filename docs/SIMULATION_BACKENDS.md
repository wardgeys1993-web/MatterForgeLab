# Future simulation backend design

Status: design proposal, 2026-11-02. The app currently runs only its built-in teaching engine. No OpenMM integration or scientific validation is implemented.

## Why a boundary is needed

The current engine uses arbitrary units, two-dimensional abstract particles, simplified reversible bonds and a seeded generator. Molecular dynamics tools model a different system with specific particles, force fields, units, integrators and boundary conditions. A backend adapter must never relabel a teaching simulation as a physical calculation or silently translate its sliders into physical values.

## Proposed adapter contract, version 1

Use an asynchronous local interface so a worker process can run independently of the UI. The following is a design sketch, not an implemented API:

```ts
type BackendDescriptor = {
  contractVersion: 1
  id: string
  backendVersion: string
  modelKind: 'conceptual' | 'simplified' | 'scientific'
  units: Record<string, string>
  parameterSchema: unknown
  observations: string[]
  reproducibility: string
  limitations: string[]
}

interface BackendV1<Setup, Frame, Snapshot> {
  describe(): Promise<BackendDescriptor>
  initialize(setup: Setup): Promise<void>
  advance(stepCount: number): Promise<Frame>
  snapshot(): Promise<Snapshot>
  restore(snapshot: Snapshot): Promise<void>
  dispose(): Promise<void>
}
```

`initialize` must validate inputs before replacing an active session. `advance` is bounded and cancellable at the transport layer; frames contain explicit units, time and only observations the backend can support. Rendering and teaching rules consume observations separately. Missing values are unavailable, not zero. Store the backend identity, version, input provenance, parameter values and units alongside data. Version changes require an explicit migration or a clear incompatibility error. A future adapter must describe restart guarantees rather than promising identical trajectories across platforms.

## OpenMM research notes

OpenMM is a possible local backend for appropriate molecular dynamics systems, not a replacement physics switch for the current beads. Its [documentation](https://docs.openmm.org/latest/userguide/application/02_running_sims.html) describes integrator choices and unit-bearing parameters. A real example needs suitable starting coordinates, topology, force-field parameters, solvent and boundary assumptions, along with an appropriate integrator and timestep.

OpenMM offers both serialized state and checkpoints. The [checkpoint documentation](https://docs.openmm.org/latest/api-python/generated/openmm.app.checkpointreporter.CheckpointReporter.html) explains that checkpoints include internal state but can depend on the system, platform, hardware and version, and identical continuation is not guaranteed. Serialized state is more portable but does not preserve everything needed for identical continuation. An adapter should expose these as different artifacts with explicit compatibility and restart expectations, not as interchangeable saves.

## Before connecting a real backend

1. Choose a narrow, published reference system and record its complete inputs and provenance.
2. Create a local isolated process with explicit resource and cancellation limits, error handling and a versioned protocol. Do not upload data or require an account.
3. Test units, parameter validation, save compatibility, failure recovery and platform identification.
4. Compare appropriate observables with a trusted reference and report uncertainty, sampling and convergence. Validate each model and use case separately.
5. Make model limitations, force field, assumptions and reproducibility visible in the UI before presenting results.

No general scientific accuracy, physical-device performance or feasibility claim follows from implementing the adapter alone.
