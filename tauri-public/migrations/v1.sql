-- CreateTable
CREATE TABLE "TaskGroup" (
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "id" TEXT NOT NULL PRIMARY KEY,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isHideAnchors" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Task" (
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "doneAt" DATETIME,
    "startAt" DATETIME,
    "endAt" DATETIME,
    "state" TEXT DEFAULT 'UNDONE',
    "priority" INTEGER NOT NULL DEFAULT 25,
    "factor" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "createIndex" INTEGER NOT NULL DEFAULT 0,
    "createdByTaskId" TEXT,
    "target" REAL,
    "targetType" TEXT,
    CONSTRAINT "Task_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TaskGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_createdByTaskId_fkey" FOREIGN KEY ("createdByTaskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskTargetRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" REAL NOT NULL,
    "recordAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskTargetRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NextTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT DEFAULT 'SIMPLE',
    "a" INTEGER NOT NULL DEFAULT 1,
    "b" INTEGER NOT NULL DEFAULT 1,
    "endDate" DATETIME,
    "taskId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NextTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskAnchor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "taskId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskAnchor_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskInDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "color" TEXT NOT NULL,
    "notificationId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "content" TEXT,
    "taskId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskInDay_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TaskInDay_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'DAILY',
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "future" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaskView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'ALTERNATIVE',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "defineMode" TEXT NOT NULL DEFAULT 'GUI',
    "GUIJSONData" TEXT,
    "autoScript" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaskViewTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "taskViewId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskViewTask_taskViewId_fkey" FOREIGN KEY ("taskViewId") REFERENCES "TaskView" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskViewTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "notifyAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Task_state_priority_createdAt_idx" ON "Task"("state" DESC, "priority" DESC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TaskTargetRecord_recordAt_idx" ON "TaskTargetRecord"("recordAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "NextTask_taskId_key" ON "NextTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAnchor_taskId_key" ON "TaskAnchor"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskInDay_notificationId_key" ON "TaskInDay"("notificationId");

-- CreateIndex
CREATE INDEX "TaskInDay_date_startTime_idx" ON "TaskInDay"("date" DESC, "startTime" ASC);

-- CreateIndex
CREATE INDEX "Report_date_idx" ON "Report"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Report_type_date_key" ON "Report"("type", "date");

-- CreateIndex
CREATE INDEX "Notification_notifyAt_idx" ON "Notification"("notifyAt" ASC);

