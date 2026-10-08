<script setup lang="ts">
/**
 * BaseIcon
 *
 * Decorative stroke icon drawn in the current text colour. The icon is hidden
 * from assistive technology, so the control that holds it must carry its own
 * accessible name.
 */

interface Shape {
  tag: 'circle' | 'line' | 'path' | 'rect'
  attrs: Record<string, number | string>
}

const props = withDefaults(defineProps<Props>(), { size: 20 })

/** Dot drawn solid rather than stroked */
const dot = (cx: number, cy: number): Shape => ({
  tag: 'circle',
  attrs: { cx, cy, r: 1.5, fill: 'currentColor', stroke: 'none' }
})

const ICONS = {
  today: [
    { tag: 'rect', attrs: { x: 3, y: 4, width: 18, height: 18, rx: 2 } },
    { tag: 'line', attrs: { x1: 16, y1: 2, x2: 16, y2: 6 } },
    { tag: 'line', attrs: { x1: 8, y1: 2, x2: 8, y2: 6 } },
    { tag: 'line', attrs: { x1: 3, y1: 10, x2: 21, y2: 10 } },
    dot(12, 15)
  ],
  search: [
    { tag: 'circle', attrs: { cx: 11, cy: 11, r: 8 } },
    { tag: 'line', attrs: { x1: 21, y1: 21, x2: 16.65, y2: 16.65 } }
  ],
  tags: [
    {
      tag: 'path',
      attrs: {
        d: 'M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z'
      }
    },
    dot(7.5, 7.5)
  ],
  settings: [
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
    {
      tag: 'path',
      attrs: {
        d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
      }
    }
  ]
} satisfies Record<string, Shape[]>

type IconName = keyof typeof ICONS

interface Props {
  /** Which icon to draw */
  name: IconName
  /** Width and height in pixels */
  size?: number
}
</script>

<template>
  <svg
    aria-hidden="true"
    fill="none"
    :height="props.size"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    viewBox="0 0 24 24"
    :width="props.size"
    xmlns="http://www.w3.org/2000/svg"
  >
    <component
      :is="shape.tag"
      v-for="(shape, index) in ICONS[props.name]"
      :key="index"
      v-bind="shape.attrs"
    />
  </svg>
</template>
