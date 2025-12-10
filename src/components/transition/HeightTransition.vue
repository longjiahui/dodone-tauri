<template>
  <transition
    :css="false"
    @enter="
      (el, done) => {
        const htmlEl = el as GlobalTypes['HTMLElement'];
        gsap
          .fromTo(
            htmlEl,
            {
              height: 0,
              opacity: 0,
            },
            {
              opacity: 1,
              height: htmlEl.scrollHeight,
              duration,
              ease: 'power3.out',
            }
          )
          .then(() => {
            htmlEl.style.height = 'auto';
            done();
          });
      }
    "
    @leave="
      (el, done) => {
        const htmlEl = el as GlobalTypes['HTMLElement'];
        gsap
          .fromTo(
            htmlEl,
            { opacity: 1, height: htmlEl.scrollHeight },
            {
              height: 0,
              opacity: 0,
              duration,
              ease: 'power3.out',
            }
          )
          .then(() => done());
      }
    "
  >
    <slot></slot>
  </transition>
</template>
<script setup lang="ts">
import { GlobalTypes } from "@/utils/window";
import gsap from "gsap";
withDefaults(
  defineProps<{
    duration?: number;
  }>(),
  {
    duration: 0.4,
  }
);
</script>
