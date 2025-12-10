<template>
  <Dialog :dialog :title="$t('systemSetting')">
    <template #default>
      <div v-loading="isLoading" class="h items-stretch">
        <div class="v bg-light-2 w-[104px] py-4">
          <Scope
            v-for="t in tabs"
            :d="{ isCurrent: currentTab === t.id }"
            #default="{ isCurrent }"
          >
            <div
              @click="currentTab = t.id"
              :class="[
                'hover:bg-light-3 cursor-pointer py-2 pl-4 duration-300',
                isCurrent ? '!border-primary !bg-bg' : '',
              ]"
            >
              {{ t.title }}
            </div>
          </Scope>
        </div>
        <div class="stretch v p-4">
          <div v-if="currentTab === 'regular'">
            <div class="v gap-8">
              <!-- <div class="v gap-1">
                <div class="font-semibold">字体</div>
                <Select
                  :options="
                    fonts.map((f) => ({
                      id: f.name,
                      databasenamef.name,
                    }))
                  "
                  v-model="systemStore.font"
                ></Select>
              </div> -->
              <div class="v gap-2">
                <div class="font-semibold">{{ $t("language") }}</div>
                <Select
                  :model-value="systemStore?.locale ?? $i18n.locale"
                  @update:model-value="
                    (locale) => {
                      return systemStore.setLocale(locale);
                    }
                  "
                  :options="
                    [
                      {
                        id: undefined as string | undefined,
                        name: $t('followSystem'),
                      },
                    ].concat(
                      ...$i18n.availableLocales.map((l) => ({
                        id: l,
                        name: {
                          zh: '简体中文',
                          en: 'English',
                          ja: '日本語',
                          // ar: 'العربية',
                          fr: 'Français',
                          es: 'Español',
                          // pt: 'Português',
                          de: 'Deutsch',
                          ko: '한국어',
                          ru: 'Русский',
                          // bn: 'বাংলা',
                          // hi: 'हिन्दी',
                          // ur: 'اردو',
                        }[l]!,
                      }))
                    )
                  "
                ></Select>
              </div>
              <div class="v gap-2">
                <div class="font-semibold">{{ $t("color") }}</div>
                <div class="h items-center gap-2">
                  <Checkbox
                    :model-value="systemStore.colorMode === 'system'"
                    @update:model-value="
                      systemStore.setColorMode($event ? 'system' : 'light')
                    "
                  ></Checkbox>
                  <div>{{ $t("useSystemColor") }}</div>
                </div>
                <div
                  v-if="systemStore.colorMode !== 'system'"
                  class="h items-center gap-2"
                >
                  <div>{{ $t("lightMode") }}</div>
                  <Switch
                    :model-value="systemStore.colorMode === 'dark'"
                    @update:model-value="
                      systemStore.setColorMode($event ? 'dark' : 'light')
                    "
                  ></Switch>
                  <div>{{ $t("darkMode") }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="currentTab === 'database'" class="v gap-2">
            <div class="font-semibold">{{ $t("databaseFile") }}</div>
            <div class="v gap-1">
              <Scope
                v-for="d in dbs"
                :d="{ isCurrent: `${currentDatabaseName}` === d }"
                #default="{ isCurrent }"
              >
                <div
                  :class="[
                    'h group items-center gap-2 px-2',
                    isCurrent
                      ? 'bg-primary inline self-start rounded text-white'
                      : '',
                  ]"
                >
                  <div>
                    {{ d }}
                  </div>
                  <div>
                    <CheckOutlined v-if="isCurrent"></CheckOutlined>
                  </div>
                  <DeleteOutlined
                    @click="
                      () =>
                        dialogs
                          .InputDialog({
                            content: $t('deleteDatabaseConfirm'),
                            suffix: () => fileSuffix,
                          })
                          .finishPromise((val) => {
                            if (val) {
                              const dbName = `${val}${fileSuffix}`;
                              if (dbName === d) {
                                return backend
                                  .deleteDatabase({ name: dbName })
                                  .then(() => {
                                    if (currentDatabaseName === dbName) {
                                      getWindow().location.reload();
                                    } else {
                                      refreshDBs();
                                    }
                                  });
                              } else {
                                return dialogs.MessageDialog({
                                  content: $t(
                                    'nameDidNotMatchSoDatabaseNotDeleted'
                                  ),
                                });
                              }
                            }
                          })
                    "
                    class="cursor-pointer opacity-0 duration-300 group-hover:opacity-100"
                  ></DeleteOutlined>
                </div>
              </Scope>
            </div>
            <div class="h gap-2">
              <Button
                @click="
                  () =>
                    dialogs
                      .InputDialog({
                        content: $t('typeDatabaseName'),
                        suffix: () => fileSuffix,
                      })
                      .finishPromise((d) => {
                        if (d && dbs.includes(d)) {
                          dialogs.MessageDialog({
                            content: $t('databaseNameCannotBeRepeated'),
                          });
                          return;
                        } else if (d) {
                          return backend
                            .createDatabase({ name: `${d}${fileSuffix}` })
                            .then(() => refreshDBs());
                        }
                      })
                "
              >
                {{ $t("createDatabaseFile") }}
              </Button>
              <Button
                type="primary"
                @click="
                  dialogs
                    .SelectDialog({
                      title: $t('selectDatabase'),
                      options: dbs.map((d) => ({ id: d, name: d })),
                    })
                    .finishPromise((d) => {
                      if (d) {
                        return backend.switchDatabase({
                          name: d.id as string,
                        });
                      }
                    })
                "
                >{{ $t("switchDatabase") }}</Button
              >
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("close") }}</Button>
      <!-- <Button type="primary">保存</Button> -->
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { dialogs } from "@/components/dialog";
import { AnyDialogType } from "@/components/dialog/dialog";
import { useSystemStore } from "@/store/system";
import { backend } from "@/utils/backend";
import { getTabs } from "@/utils/tab";
import { getWindow } from "@/utils/window";
import { useI18n } from "vue-i18n";

const fileSuffix = ".dodone";

defineProps<{
  dialog: AnyDialogType;
}>();

const { state: dbs, execute: refreshDBs } = useAsyncState(
  async () => backend.getDatabases(),
  []
);

const isLoaded = ref(false);
const isLoading = computed(() => !isLoaded.value);
const currentDatabaseName = ref<string>();
backend
  .getCurrentDbName()
  .finally(() => {
    isLoaded.value = true;
  })
  .then((name) => {
    currentDatabaseName.value = name;
  });
const { t } = useI18n();
const tabs = computed(() =>
  getTabs({
    regular: t("general"),
    // style: "外观",
    database: t("database"),
  })
);
const currentTab = ref(tabs.value[0].id);

const systemStore = useSystemStore();
</script>
