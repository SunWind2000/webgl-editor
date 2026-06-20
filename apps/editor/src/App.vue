<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { WEBGL_EDITOR_CORE_VERSION } from '@webgl-editor/core';
import { getRuntimeConfig, type RuntimeConfig } from './runtime';

interface HealthResponse {
  status: string;
  service: string;
  version: string;
  sqlite: {
    injected: boolean;
    databasePath: string;
  };
}

interface CapabilitiesResponse {
  nativeGeometry: boolean;
  sqlite: boolean;
  sse: boolean;
}

const runtimeConfig = ref<RuntimeConfig>();
const health = ref<HealthResponse>();
const capabilities = ref<CapabilitiesResponse>();
const sseStatus = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle');
const lastEvent = ref('none');
const errorMessage = ref('');
let eventSource: EventSource | undefined;

const serverBaseUrl = computed(() => runtimeConfig.value?.serverBaseUrl ?? 'not configured');

onMounted(async () => {
  try {
    runtimeConfig.value = await getRuntimeConfig();
    const [healthResponse, capabilitiesResponse] = await Promise.all([
      fetch(`${runtimeConfig.value.serverBaseUrl}/api/v1/health`),
      fetch(`${runtimeConfig.value.serverBaseUrl}/api/v1/capabilities`)
    ]);
    health.value = await healthResponse.json() as HealthResponse;
    capabilities.value = await capabilitiesResponse.json() as CapabilitiesResponse;
    connectEvents(runtimeConfig.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
});

onBeforeUnmount(() => {
  eventSource?.close();
});

function connectEvents(config: RuntimeConfig): void {
  sseStatus.value = 'connecting';
  eventSource = new EventSource(`${config.serverBaseUrl}/api/v1/events`);
  eventSource.addEventListener('server.ready', (event) => {
    sseStatus.value = 'connected';
    lastEvent.value = `server.ready ${event.data}`;
  });
  eventSource.addEventListener('heartbeat', (event) => {
    sseStatus.value = 'connected';
    lastEvent.value = `heartbeat ${event.data}`;
  });
  eventSource.onerror = () => {
    sseStatus.value = eventSource?.readyState === EventSource.OPEN ? 'connected' : 'error';
  };
}
</script>

<template>
  <main class="editor-shell">
    <section class="status-panel">
      <header>
        <p class="eyebrow">
          WebGL Editor MVP
        </p>
        <h1>Local service bridge</h1>
      </header>

      <div class="status-grid">
        <article>
          <span>Server</span>
          <strong>{{ health?.status ?? 'loading' }}</strong>
          <small>{{ serverBaseUrl }}</small>
        </article>
        <article>
          <span>SQLite</span>
          <strong>{{ health?.sqlite.injected ? 'injected' : 'pending' }}</strong>
          <small>{{ health?.sqlite.databasePath ?? 'waiting for server' }}</small>
        </article>
        <article>
          <span>SSE</span>
          <strong>{{ sseStatus }}</strong>
          <small>{{ lastEvent }}</small>
        </article>
        <article>
          <span>Core</span>
          <strong>{{ WEBGL_EDITOR_CORE_VERSION }}</strong>
          <small>@webgl-editor/core</small>
        </article>
      </div>

      <div class="capabilities">
        <span :class="{ enabled: capabilities?.sqlite }">SQLite</span>
        <span :class="{ enabled: capabilities?.sse }">SSE</span>
        <span :class="{ enabled: capabilities?.nativeGeometry }">Native Geometry</span>
      </div>

      <p
        v-if="errorMessage"
        class="error"
      >
        {{ errorMessage }}
      </p>
    </section>
  </main>
</template>
