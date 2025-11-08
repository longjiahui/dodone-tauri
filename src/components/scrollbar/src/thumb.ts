import { buildProps } from './props'
import type Thumb from './thumb.vue'
import type { ExtractPropTypes } from 'vue'

export const thumbProps = buildProps({
  vertical: Boolean,
  size: String,
  move: Number,
  ratio: {
    type: Number,
    required: true
  },
  always: Boolean
} as const)
export type ThumbProps = ExtractPropTypes<typeof thumbProps>

export type ThumbInstance = InstanceType<typeof Thumb>
