<script setup lang="ts">
const props = defineProps<{
  title?: string;
  description?: string;
}>();

const emit = defineEmits<{
  preview: [payload: { title: string; description: string }];
}>();

const emitPreview = () => {
  emit('preview', {
    title: props.title ?? 'Debug Card',
    description: props.description ?? 'Rendered from @webgl-editor/ui.'
  });
};
</script>

<template>
  <section
    class="debug-card"
    data-testid="debug-card"
  >
    <p class="debug-card__eyebrow">
      Workspace Component
    </p>
    <h2>{{ title ?? 'Debug Card' }}</h2>
    <p>{{ description ?? 'Rendered from @webgl-editor/ui.' }}</p>
    <button
      class="debug-card__action"
      type="button"
      @click="emitPreview"
    >
      Emit preview
    </button>
  </section>
</template>

<style scoped>
.debug-card {
  display: grid;
  gap: 8px;
  max-width: 480px;
  padding: 20px;
  color: #17202a;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
}

.debug-card__eyebrow {
  margin: 0;
  color: #536471;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.debug-card h2,
.debug-card p {
  margin: 0;
}

.debug-card__action {
  width: fit-content;
  min-height: 32px;
  margin-top: 4px;
  padding: 0 12px;
  color: #ffffff;
  cursor: pointer;
  background: #2474b5;
  border: 0;
  border-radius: 6px;
}

.debug-card__action:focus-visible {
  outline: 3px solid rgb(36 116 181 / 24%);
  outline-offset: 2px;
}
</style>
