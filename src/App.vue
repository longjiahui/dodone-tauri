<script setup lang="ts">
import zhCN from "ant-design-vue/es/locale/zh_CN";
import enUS from "ant-design-vue/es/locale/en_US";
import arEG from "ant-design-vue/es/locale/ar_EG";
import frFR from "ant-design-vue/es/locale/fr_FR";
import esES from "ant-design-vue/es/locale/es_ES";
import ptPT from "ant-design-vue/es/locale/pt_PT";
import deDE from "ant-design-vue/es/locale/de_DE";
import jaJP from "ant-design-vue/es/locale/ja_JP";
import koKR from "ant-design-vue/es/locale/ko_KR";
import ruRU from "ant-design-vue/es/locale/ru_RU";
import bnBD from "ant-design-vue/es/locale/bn_BD";
import hiIN from "ant-design-vue/es/locale/hi_IN";

import ZHLocale from "dayjs/locale/zh-cn";
import ENLocale from "dayjs/locale/en";
import ARLocale from "dayjs/locale/ar";
import FRLocale from "dayjs/locale/fr";
import ESLocale from "dayjs/locale/es";
import PTLocale from "dayjs/locale/pt";
import DELocale from "dayjs/locale/de";
import JALocale from "dayjs/locale/ja";
import KOLocale from "dayjs/locale/ko";
import RULocale from "dayjs/locale/ru";
import BNLocale from "dayjs/locale/bn";
import HILocale from "dayjs/locale/hi";

import dayjs from "dayjs";
import { useI18n } from "vue-i18n";
import { useSystemStore } from "./store/system";
import { browserLocale } from "./i18n";
import { useNotificationStore } from "./store/notification";
import { backendEvent } from "./store/events";
import { invoke } from "@tauri-apps/api/core";

const i18n = useI18n();
const systemStore = useSystemStore();
useNotificationStore();
watch(
  () => systemStore.locale,
  (val) => {
    i18n.locale.value = val || browserLocale;
  },
  {
    immediate: true,
  }
);

watch(
  i18n.locale,
  (val) => {
    console.debug("locale change: ", val);
    dayjs.locale(
      {
        en: ENLocale,
        zh: ZHLocale,
        ar: ARLocale,
        fr: FRLocale,
        es: ESLocale,
        pt: PTLocale,
        de: DELocale,
        ja: JALocale,
        ko: KOLocale,
        ru: RULocale,
        bn: BNLocale,
        hi: HILocale,
      }[val]
    );
  },
  {
    immediate: true,
  }
);
const locale = computed(
  () =>
    ({
      zh: zhCN,
      en: enUS,
      ar: arEG,
      fr: frFR,
      es: esES,
      pt: ptPT,
      de: deDE,
      ja: jaJP,
      ko: koKR,
      ru: ruRU,
      bn: bnBD,
      hi: hiIN,
    })[i18n.locale.value]
);

backendEvent.on("switchDatabase", (_databaseName) => {
  window.location.reload();
});
</script>

<template>
  <AntdProvider :locale>
    <div class="size-full">
      <router-view></router-view>
    </div>
  </AntdProvider>
</template>

<style scoped></style>
