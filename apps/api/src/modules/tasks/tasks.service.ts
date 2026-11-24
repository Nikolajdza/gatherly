import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import type { TaskInput } from "@gatherly/shared";
import { taskPatchSchema } from "@gatherly/shared";
import type { z } from "zod";
import { dateOnly, fromDateOnly } from "../../common/http";
import { PrismaService } from "../../database/prisma.service";
import { PermissionsService } from "../permissions/permissions.service";

type TaskPatch = z.infer<typeof taskPatchSchema>;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async list(experienceId: string, userId: string) {
    await this.permissions.requireMember(experienceId, userId);
    await this.requireTaskList(experienceId);
    const tasks = await this.prisma.task.findMany({
      where: { experienceId },
      include: { labels: true, assignees: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return { items: tasks.map((task) => this.present(task)) };
  }

  async create(experienceId: string, userId: string, input: TaskInput) {
    const member = await this.permissions.requireMember(experienceId, userId);
    if (member.role === "viewer") {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Viewers cannot add tasks." });
    }
    await this.requireTaskList(experienceId);
    if (input.parentId) {
      const parent = await this.prisma.task.findFirst({ where: { id: input.parentId, experienceId } });
      if (!parent) throw new NotFoundException({ code: "NOT_FOUND", message: "Parent task not found." });
    }
    await this.assertAssignees(experienceId, input.assigneeIds);
    const task = await this.prisma.task.create({
      data: {
        experienceId,
        creatorId: userId,
        parentId: input.parentId ?? null,
        title: input.title,
        notes: input.notes,
        status: input.status,
        priority: input.priority,
        category: input.category ?? null,
        dueDate: fromDateOnly(input.dueDate),
        labels: { create: input.labels.map((label) => ({ label })) },
        assignees: { create: input.assigneeIds.map((assigneeId) => ({ userId: assigneeId })) },
      },
      include: { labels: true, assignees: true },
    });
    return this.present(task);
  }

  async update(experienceId: string, taskId: string, userId: string, input: TaskPatch) {
    const member = await this.permissions.requireMember(experienceId, userId);
    const existing = await this.requireTask(experienceId, taskId);
    const statusOnly = Object.keys(input).every((key) => key === "status");
    if (member.role === "viewer" || (member.role === "participant" && !statusOnly && existing.creatorId !== userId)) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot edit this task." });
    }
    if (input.assigneeIds) await this.assertAssignees(experienceId, input.assigneeIds);
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        notes: input.notes,
        parentId: input.parentId,
        status: input.status,
        priority: input.priority,
        category: input.category,
        dueDate: input.dueDate === undefined ? undefined : fromDateOnly(input.dueDate),
        labels: input.labels
          ? { deleteMany: {}, create: input.labels.map((label) => ({ label })) }
          : undefined,
        assignees: input.assigneeIds
          ? { deleteMany: {}, create: input.assigneeIds.map((assigneeId) => ({ userId: assigneeId })) }
          : undefined,
      },
      include: { labels: true, assignees: true },
    });
    return this.present(task);
  }

  async remove(experienceId: string, taskId: string, userId: string) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    await this.requireTask(experienceId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
    return { deleted: true as const };
  }

  private async requireTaskList(experienceId: string) {
    const experience = await this.prisma.experience.findUnique({ where: { id: experienceId } });
    if (!experience || experience.type !== "task_list") {
      throw new BadRequestException({ code: "WRONG_EXPERIENCE", message: "Tasks belong on a task list." });
    }
  }

  private async requireTask(experienceId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, experienceId } });
    if (!task) throw new NotFoundException({ code: "NOT_FOUND", message: "Task not found." });
    return task;
  }

  private async assertAssignees(experienceId: string, userIds: string[]) {
    if (userIds.length === 0) return;
    const members = await this.prisma.experienceMember.findMany({
      where: { experienceId, userId: { in: userIds } },
      select: { userId: true },
    });
    if (members.length !== new Set(userIds).size) {
      throw new BadRequestException({ code: "UNKNOWN_ASSIGNEE", message: "Assignees must be members of this list." });
    }
  }

  private present(task: {
    id: string;
    parentId: string | null;
    title: string;
    notes: string;
    status: "open" | "done";
    priority: "low" | "medium" | "high";
    category: string | null;
    dueDate: Date | null;
    sortOrder: number;
    labels: Array<{ label: string }>;
    assignees: Array<{ userId: string }>;
  }) {
    return {
      id: task.id,
      parentId: task.parentId,
      title: task.title,
      notes: task.notes,
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: dateOnly(task.dueDate),
      sortOrder: task.sortOrder,
      labels: task.labels.map((label) => label.label),
      assigneeIds: task.assignees.map((assignee) => assignee.userId),
    };
  }
}
