---
url: /docs/components/switch.md
description: A control that allows the user to toggle between checked and not checked.
---

# Switch

## Features

## Installation

Install the component from your command line.

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'
</script>

<template>
  <SwitchRoot>
    <SwitchThumb />
  </SwitchRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a switch. An `input` will also render when used within a `form` to ensure events propagate correctly.

### Thumb

The thumb that is used to visually indicate whether the switch is on or off.

## Accessibility

Adheres to the [`switch` role requirements](https://www.w3.org/WAI/ARIA/apg/patterns/switch).

### Keyboard Interactions
