import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { DebugCard } from '@webgl-editor/ui';

describe('@webgl-editor/ui', () => {
  it('exports components as root named exports for tree-shaking', () => {
    expect(DebugCard).toBeTruthy();
  });

  it('renders the debug card with custom content', () => {
    const wrapper = mount(DebugCard, {
      props: {
        title: 'Unit Preview',
        description: 'Rendered by Vitest.'
      }
    });

    expect(wrapper.get('[data-testid="debug-card"]').text()).toContain('Unit Preview');
    expect(wrapper.text()).toContain('Rendered by Vitest.');
  });

  it('emits preview payload from the action button', async () => {
    const wrapper = mount(DebugCard, {
      props: {
        title: 'Unit Preview',
        description: 'Rendered by Vitest.'
      }
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('preview')).toEqual([
      [
        {
          title: 'Unit Preview',
          description: 'Rendered by Vitest.'
        }
      ]
    ]);
  });
});
