<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { playgroundModules } from './modules';
import type { PlaygroundModule } from './modules';

interface EmitLog {
  id: number;
  eventName: string;
  payload: string;
  time: string;
}

const query = ref('');
const selectedId = ref(playgroundModules[0]?.id ?? '');
const propValues = ref<Record<string, string>>({});
const emitLogs = ref<EmitLog[]>([]);
const navWidth = ref(280);
const inspectorWidth = ref(320);

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

let stopResize: (() => void) | undefined;

const filteredModules = computed(() => {
  const keyword = query.value.trim().toLowerCase();

  if (!keyword) {
    return playgroundModules;
  }

  return playgroundModules.filter((module) => {
    return `${module.title} ${module.description}`.toLowerCase().includes(keyword);
  });
});

const selectedModule = computed(() => {
  return playgroundModules.find((module) => module.id === selectedId.value) ?? filteredModules.value[0];
});

const resetModuleState = (module: PlaygroundModule | undefined) => {
  propValues.value = Object.fromEntries(
    module?.props.map((prop) => [prop.name, prop.defaultValue]) ?? []
  );
  emitLogs.value = [];
};

const currentProps = computed(() => {
  return { ...propValues.value };
});

const eventHandlers = computed(() => {
  return Object.fromEntries(
    selectedModule.value?.emits.map((eventName) => [
      eventName,
      (...payload: unknown[]) => {
        emitLogs.value.unshift({
          id: Date.now(),
          eventName,
          payload: JSON.stringify(payload.length === 1 ? payload[0] : payload),
          time: new Date().toLocaleTimeString()
        });
      }
    ]) ?? []
  );
});

const workbenchGridStyle = computed(() => {
  return {
    gridTemplateColumns: `${navWidth.value}px minmax(0, 1fr) ${inspectorWidth.value}px`
  };
});

const startResize = (panel: 'nav' | 'inspector', event: PointerEvent) => {
  event.preventDefault();

  const startX = event.clientX;
  const startWidth = panel === 'nav' ? navWidth.value : inspectorWidth.value;

  const handleMove = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientX - startX;
    const nextWidth = panel === 'nav' ? startWidth + delta : startWidth - delta;

    if (panel === 'nav') {
      navWidth.value = clamp(nextWidth, 220, 420);
      return;
    }

    inspectorWidth.value = clamp(nextWidth, 280, 520);
  };

  const handleUp = () => {
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleUp);
    stopResize = undefined;
  };

  stopResize?.();
  window.addEventListener('pointermove', handleMove);
  window.addEventListener('pointerup', handleUp);
  stopResize = handleUp;
};

watch(selectedModule, resetModuleState, { immediate: true });

onBeforeUnmount(() => {
  stopResize?.();
});
</script>

<template>
  <main class="workbench">
    <header class="workbench__header">
      <div>
        <p class="workbench__label">
          Agent Workbench
        </p>
        <h1>Component Playground</h1>
      </div>
      <input
        v-model="query"
        class="workbench__search"
        type="search"
        placeholder="Search modules"
        aria-label="Search modules"
      >
    </header>

    <div
      class="workbench__body"
      :style="workbenchGridStyle"
    >
      <nav
        class="module-nav"
        aria-label="Component modules"
      >
        <button
          v-for="module in filteredModules"
          :key="module.id"
          class="module-nav__item"
          :class="{ 'module-nav__item--active': module.id === selectedModule?.id }"
          type="button"
          @click="selectedId = module.id"
        >
          <span>{{ module.title }}</span>
          <small>{{ module.description }}</small>
        </button>
        <div
          class="resize-handle resize-handle--nav"
          role="separator"
          aria-label="Resize module navigation"
          aria-orientation="vertical"
          tabindex="0"
          @pointerdown="startResize('nav', $event)"
        />
      </nav>

      <section
        class="debug-stage"
        aria-label="Debug stage"
      >
        <div class="debug-stage__toolbar">
          <span>{{ selectedModule?.title ?? 'No module selected' }}</span>
        </div>
        <div class="debug-stage__surface">
          <component
            :is="selectedModule.component"
            v-if="selectedModule"
            v-bind="currentProps"
            v-on="eventHandlers"
          />
          <p
            v-else
            class="debug-stage__empty"
          >
            No module matches the current search.
          </p>
        </div>
      </section>

      <aside
        class="inspector"
        aria-label="Component inspector"
      >
        <div
          class="resize-handle resize-handle--inspector"
          role="separator"
          aria-label="Resize component inspector"
          aria-orientation="vertical"
          tabindex="0"
          @pointerdown="startResize('inspector', $event)"
        />
        <section class="inspector__section">
          <div class="inspector__heading">
            <span>Props</span>
            <button
              class="inspector__reset"
              type="button"
              @click="resetModuleState(selectedModule)"
            >
              Reset
            </button>
          </div>

          <label
            v-for="prop in selectedModule?.props"
            :key="prop.name"
            class="prop-control"
          >
            <span>{{ prop.label }}</span>
            <textarea
              v-if="prop.type === 'textarea'"
              v-model="propValues[prop.name]"
              rows="4"
            />
            <input
              v-else
              v-model="propValues[prop.name]"
              type="text"
            >
          </label>
        </section>

        <section class="inspector__section">
          <div class="inspector__heading">
            <span>Emits</span>
            <button
              class="inspector__reset"
              type="button"
              @click="emitLogs = []"
            >
              Clear
            </button>
          </div>

          <ul class="emit-log">
            <li
              v-for="log in emitLogs"
              :key="log.id"
            >
              <span>{{ log.time }} · {{ log.eventName }}</span>
              <code>{{ log.payload }}</code>
            </li>
          </ul>

          <p
            v-if="emitLogs.length === 0"
            class="emit-log__empty"
          >
            Trigger component interactions to inspect emitted events.
          </p>
        </section>
      </aside>
    </div>
  </main>
</template>
