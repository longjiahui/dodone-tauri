<template>
  <Dialog
    :dialog
    :title="$t('editTaskView')"
    :size="data.type === 'AUTO' ? 'large' : 'small'"
    placement="left"
  >
    <DefineGroupTemplate #default="{ group: g, index: gi, parent, groups }">
      <div
        :class="[
          'v gap-2 rounded bg-[rgba(0,0,0,.05)] p-4',
          !!parent ? 'outline outline-[rgba(0,0,0,.3)]' : '',
        ]"
      >
        <div class="h items-center justify-between">
          <div class="h w-[120px]">
            <Select
              class="stretch"
              :options="[
                {
                  id: 'and',
                  name: $t('andLogic'),
                },
                {
                  id: 'or',
                  name: $t('orLogic'),
                },
              ]"
              v-model="g.relation"
            ></Select>
          </div>
          <Button v-if="parent || gi !== 0" type="text">
            <DeleteOutlined @click="groups.splice(gi, 1)"></DeleteOutlined>
          </Button>
        </div>
        <div class="v gap-4">
          <div class="h gap-2">
            <Button
              @click="
                g.conditions.push({
                  fieldId: fields[0]?.id,
                })
              "
              type="text"
              class="gap-2"
            >
              <PlusOutlined></PlusOutlined>
              <div>{{ $t("createCondition") }}</div>
            </Button>
            <Button
              @click="
                g.groups.push({
                  groups: [],
                  conditions: [],
                })
              "
              type="text"
              class="gap-2"
            >
              <PlusOutlined></PlusOutlined>
              <div>{{ $t("createLogicGroup") }}</div>
            </Button>
          </div>
          <!-- <div v-if="g.groups && g.groups.length"> -->
          <UseGroupTemplate
            v-for="(sg, sgi) in g.groups"
            :group="sg"
            :index="sgi"
            :parent="g"
            :groups="g.groups"
          >
          </UseGroupTemplate>
          <!-- </div> -->
          <div v-for="(c, ci) in g.conditions" class="h items-center gap-2">
            <div class="h stretch gap-2">
              <div class="h flex-[0.5]">
                <Select
                  :options="
                    fields.map((f) => ({
                      id: f.id,
                      name: f.name,
                    }))
                  "
                  class="stretch"
                  v-model="c.fieldId"
                  @update:model-value="c.value = null"
                ></Select>
              </div>
              <div class="h flex-[0.5]">
                <Select
                  class="stretch"
                  :options="operatorOptions"
                  v-model="c.operator"
                ></Select>
              </div>
              <div class="h flex-2" v-if="c.fieldId && fieldsMap[c.fieldId!]">
                <Scope
                  :d="{
                    fieldType: fieldsMap[c.fieldId!]!.fieldType,
                    field: fieldsMap[c.fieldId]!,
                  }"
                  #default="{ fieldType, field }"
                >
                  <Input
                    class="stretch"
                    v-if="
                      (
                        [
                          'text-input',
                          'number-input',
                        ] satisfies FieldType[] as string[]
                      ).includes(fieldType)
                    "
                    :type="fieldType === 'text-input' ? 'text' : 'number'"
                    v-model="c.value"
                  ></Input>
                  <Select
                    class="stretch"
                    v-else-if="fieldType === 'select'"
                    :options="field.params"
                    v-model="c.value"
                  ></Select>
                  <div
                    v-else-if="fieldType === 'datetime-select'"
                    class="h stretch gap-2"
                  >
                    <Scope
                      :d="{
                        condition: c as TVGCDateTimeSelect,
                      }"
                      #default="{ condition }"
                    >
                      <ObjectUpdater
                        v-model="condition.value"
                        #default="{ update }"
                      >
                        <div class="h flex-1">
                          <Select
                            class="stretch"
                            :options="datetimeFieldTypeOptions"
                            :model-value="condition?.value?.type"
                            @update:model-value="(d) => update(d, 'type')"
                          ></Select>
                        </div>
                        <div
                          v-if="condition.value?.type === 'customDateTime'"
                          class="h flex-2"
                        >
                          <DateTimePicker
                            class="stretch"
                            :model-value="condition.value.value!"
                            @update:modelValue="
                              (d) => update(dayjs(d), 'value')
                            "
                          ></DateTimePicker>
                        </div>
                        <div
                          v-else-if="condition.value?.type !== 'null'"
                          class="h flex-1.5 items-center gap-2"
                        >
                          <Input
                            type="number"
                            :model-value="condition.value?.offset"
                            @update:model-value="(d) => update(+d!, 'offset')"
                          >
                            <template #suffix> {{ $t("day") }} </template>
                          </Input>
                          <div
                            v-if="!isNaN(+condition.value?.offset!)"
                            class="shrink-0"
                          >
                            {{
                              dayjs()
                                .add(condition.value!.offset!, "day")
                                .format("YYYY-MM-DD")
                            }}
                          </div>
                        </div>
                      </ObjectUpdater>
                    </Scope>
                  </div>
                  <div
                    v-else-if="fieldType === 'task-select'"
                    class="h stretch gap-2"
                  >
                    <Input
                      class="stretch"
                      v-model="c.value"
                      :placeholder="$t('inputTaskIdPlaceholder')"
                    ></Input>
                    <Button
                      @click="
                        () =>
                          dialogs.SelectTaskDialog().finishPromise((d) => {
                            if (d) {
                              c.value = d.taskId;
                            }
                          })
                      "
                      >{{ $t("selectTask") }}</Button
                    >
                  </div>
                </Scope>
              </div>
            </div>
            <div class="shrink-0">
              <Button type="text" @click="g.conditions.splice(ci, 1)">
                <DeleteOutlined></DeleteOutlined>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DefineGroupTemplate>
    <div class="h stretch items-stretch gap-4 overflow-hidden p-4 py-2">
      <div :class="['v gap-4', data.type === 'AUTO' ? 'w-[240px]' : 'stretch']">
        <div class="h items-center gap-2">
          <div>
            <div>{{ $t("icon") }}</div>
            <SelectIcon
              @update:model-value="(d) => (data.icon = d)"
              :model-value="
                data.icon ??
                (data.type ? defaultTaskViewIcon(data.type) : undefined)
              "
            ></SelectIcon>
          </div>
          <div class="stretch">
            <div>{{ $t("name") }}</div>
            <Input v-model="data.name"></Input>
          </div>
        </div>
        <div>
          <div>{{ $t("description") }}</div>
          <Input v-model="data.description"></Input>
        </div>
        <div>
          <div>{{ $t("type") }}</div>
          <Select
            v-model="data.type"
            class="stretch w-full"
            :options="
              [
                {
                  id: 'ALTERNATIVE',
                  name: $t('alternative'),
                },
                {
                  id: 'AUTO',
                  name: $t('auto'),
                },
              ] satisfies {
                id: TaskViewType;
                name: string;
              }[]
            "
          ></Select>
        </div>
      </div>
      <div v-if="data.type === 'AUTO'" class="stretch v gap-4">
        <div class="h items-center gap-2">
          <div>{{ tabs[0].title }}</div>
          <Switch
            :model-value="currentTab === tabs[1].id"
            @update:model-value="
              (val) => (currentTab = val ? tabs[1].id : tabs[0].id)
            "
          ></Switch>
          <div>{{ tabs[1].title }}</div>
        </div>
        <div class="stretch v" v-if="currentTab === 'SCRIPT'">
          <!-- <Textarea class="stretch" v-model="data.autoScript!"></Textarea> -->
          <JSEditor v-model="data.autoScript!"></JSEditor>
        </div>
        <Scrollbar
          class="stretch"
          view-class="stretch v gap-4"
          v-else-if="currentTab === 'GUI'"
        >
          <div class="stretch v gap-2">
            <UseGroupTemplate
              v-for="(g, gi) in groups"
              :group="g"
              :index="gi"
              :groups="groups"
            >
            </UseGroupTemplate>
          </div>
        </Scrollbar>
      </div>
    </div>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("close") }}</Button>
      <Button
        @click="
          dialog.finish({
            autoScript: data.autoScript || null,
            description: data.description || null,
            name: data.name || '',
            type: data.type || 'ALTERNATIVE',
            icon: data.icon || null,
            defineMode: currentTab,
            guijsonData: JSON.stringify({
              groups,
            }),
          })
        "
        type="primary"
        >{{ $t("save") }}</Button
      >
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { dialogs } from "@/components/dialog";
import { DialogType } from "@/components/dialog/dialog";
import { defaultTaskViewIcon } from "@/const";
import { useTaskViewGUIMetaStore } from "@/store/taskViewGUIMeta";
import {
  ReadOnlyTaskViewWithExtra,
  TaskViewGUICondition,
  TaskViewGUIGroup,
  TaskViewWithExtra,
  FieldType,
  TVGCDateTimeSelect,
} from "@/types";
import { getTabs } from "@/utils/tab";
import { dayjs } from "@/utils/time";
import { PlusOutlined } from "@ant-design/icons-vue";
import { TaskView, type TaskViewDefineMode, TaskViewType } from "@/types";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  dialog: DialogType<
    any,
    Pick<
      TaskView,
      | "name"
      | "description"
      | "autoScript"
      | "type"
      | "icon"
      | "guijsonData"
      | "defineMode"
    >
  >;

  taskView?: ReadOnlyTaskViewWithExtra;
}>();

const data = ref<Partial<Omit<TaskViewWithExtra, "GUIData">>>({
  ...props.taskView,
  type: props.taskView?.type ?? "ALTERNATIVE",
});
const taskViewGUIMetaStore = useTaskViewGUIMetaStore();
const fields = computed(() => taskViewGUIMetaStore.fields.slice());
const fieldsMap = computed(() => taskViewGUIMetaStore.fieldsMap);
const operatorOptions = computed(() =>
  taskViewGUIMetaStore.operatorOptions.slice()
);
const datetimeFieldTypeOptions = computed(() =>
  taskViewGUIMetaStore.datetimeFieldTypeOptions.slice()
);

const { t } = useI18n();
const tabs = computed(() =>
  getTabs({
    GUI: t("taskViewGUI"),
    SCRIPT: t("taskViewScript"),
  } satisfies Record<TaskViewDefineMode, string>)
);

const currentTab = ref<(typeof tabs.value)[number]["id"]>(
  props.taskView?.defineMode || tabs.value[0].id
);

const _groups = JSON.parse(
  JSON.stringify(props.taskView?.GUIData.groups || [])
);
type LocalGroup = Partial<TaskViewGUIGroup> & {
  conditions: Partial<TaskViewGUICondition>[];
  groups: LocalGroup[];
};
const _defaultGroup: LocalGroup = {
  relation: "and",
  conditions: [],
  groups: [],
};
const groups = ref<LocalGroup[]>(
  _groups instanceof Array
    ? _groups.length > 0
      ? _groups
      : [_defaultGroup]
    : [_defaultGroup]
);

const [DefineGroupTemplate, UseGroupTemplate] = createReusableTemplate<{
  group: LocalGroup;
  index: number;
  parent?: LocalGroup;
  groups: LocalGroup[];
}>();
</script>
