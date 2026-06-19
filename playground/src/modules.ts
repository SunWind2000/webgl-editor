import type { Component } from 'vue';
import { DebugCard } from '@webgl-editor/ui';

export interface PlaygroundPropControl {
  name: string;
  label: string;
  type: 'text' | 'textarea';
  defaultValue: string;
}

export interface PlaygroundModule {
  id: string;
  title: string;
  description: string;
  component: Component;
  props: PlaygroundPropControl[];
  emits: string[];
}

export const playgroundModules: PlaygroundModule[] = [
  {
    id: 'debug-card',
    title: 'Debug Card',
    description: 'A minimal shared component for workspace smoke tests.',
    component: DebugCard,
    props: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        defaultValue: 'Playground Preview'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        defaultValue: 'Rendered inside the visual debugging workbench.'
      }
    ],
    emits: ['preview']
  }
];
