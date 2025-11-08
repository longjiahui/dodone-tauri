INSERT INTO "TaskView" ("id","type","name","description","icon","sortOrder","defineMode","GUIJSONData","autoScript","createdAt","updatedAt") VALUES ('cmh8whcx00002hbyw6wg97yi7','AUTO','今天',NULL,NULL,0,'GUI','{"groups":[{"relation":"or","conditions":[],"groups":[{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":0},"operator":">="},{"fieldId":"startAt","value":{"type":"today24","offset":0},"operator":"<="}],"relation":"and"},{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":0},"operator":"<="},{"fieldId":"endAt","value":{"type":"today0","offset":0},"operator":">="}],"relation":"and"}]}]}',NULL,1761555196836,1761555207596);
INSERT INTO "TaskView" ("id","type","name","description","icon","sortOrder","defineMode","GUIJSONData","autoScript","createdAt","updatedAt") VALUES ('cmh8whdvt0003hbyw0ktjjrrd','AUTO','明天',NULL,NULL,1,'GUI','{"groups":[{"relation":"or","conditions":[],"groups":[{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today24","offset":1},"operator":"<="},{"fieldId":"startAt","value":{"type":"today24","offset":0},"operator":">="}],"relation":"and"},{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":1},"operator":"<="},{"fieldId":"endAt","value":{"type":"today0","offset":1},"operator":">="}],"relation":"and"}]}]}',NULL,1761555198089,1761555207596);
INSERT INTO "TaskView" ("id","type","name","description","icon","sortOrder","defineMode","GUIJSONData","autoScript","createdAt","updatedAt") VALUES ('cmh8whevk0004hbyw9ezlaoep','AUTO','后天',NULL,NULL,2,'GUI','{"groups":[{"relation":"or","conditions":[],"groups":[{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today24","offset":1},"operator":">="},{"fieldId":"startAt","value":{"type":"today24","offset":2},"operator":"<="}],"relation":"and"},{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":2},"operator":"<="},{"fieldId":"endAt","value":{"type":"today0","offset":2},"operator":">="}],"relation":"and"}]}]}',NULL,1761555199376,1761555207596);
INSERT INTO "TaskView" ("id","type","name","description","icon","sortOrder","defineMode","GUIJSONData","autoScript","createdAt","updatedAt") VALUES ('cmh8whg7g0005hbywd2jb76oo','AUTO','本周',NULL,NULL,3,'SCRIPT',NULL,'t => {
  if(t.startAt || t.endAt){
    const weekBetween = [dayjs().startOf(''week''), dayjs().endOf(''week'')]
    if(!(t.startAt && t.endAt)){
      const d = t.startAt || t.endAt
      if(dayjs(d).isBetween(...weekBetween)){
        return true
      }
    }else{
      return dayjs(t.endAt).isBetween(...weekBetween)
    }
  }
  return false
}',1761555201101,1761555207596);
INSERT INTO "TaskView" ("id","type","name","description","icon","sortOrder","defineMode","GUIJSONData","autoScript","createdAt","updatedAt") VALUES ('cmh8whh6c0006hbywb6khyn62','AUTO','本月',NULL,NULL,4,'SCRIPT',NULL,'t => {
  if(t.startAt || t.endAt){
    const monthBetween = [dayjs().startOf(''month''), dayjs().endOf(''month'')]
    if(!(t.startAt && t.endAt)){
      const d = t.startAt || t.endAt
      if(dayjs(d).isBetween(...monthBetween)){
        return true
      }
    }else{
      return dayjs(t.endAt).isBetween(...monthBetween)
    }
  }
  return false
}',1761555202356,1761555207596);
