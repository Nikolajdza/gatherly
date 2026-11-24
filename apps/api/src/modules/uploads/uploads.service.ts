import { randomBytes } from "node:crypto";
import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import { PrismaService } from "../../database/prisma.service";
import { PermissionsService } from "../permissions/permissions.service";

const buckets = {
  avatar: "avatars",
  cover: "covers",
  gallery: "galleries",
  attachment: "attachments",
} as const;

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async sign(
    userId: string,
    input: {
      kind: keyof typeof buckets;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      experienceId?: string | null;
    },
  ) {
    if (input.kind !== "avatar") {
      if (!input.experienceId) {
        throw new BadRequestException({ code: "EXPERIENCE_REQUIRED", message: "Choose an experience for this upload." });
      }
      await this.permissions.requireRole(input.experienceId, userId, ["owner", "editor"]);
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new ServiceUnavailableException({
        code: "STORAGE_NOT_CONFIGURED",
        message: "File storage is not configured.",
      });
    }

    const bucket = buckets[input.kind];
    const safeName = input.fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "image";
    const path = `${userId}/${randomBytes(8).toString("hex")}-${safeName}`;
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const signed = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (signed.error || !signed.data) {
      throw new ServiceUnavailableException({ code: "UPLOAD_FAILED", message: "Could not prepare the upload." });
    }

    await this.prisma.attachment.create({
      data: {
        ownerId: userId,
        experienceId: input.experienceId ?? null,
        bucket,
        path,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        kind: input.kind,
      },
    });

    const isPublic = bucket !== "attachments";
    const publicUrl = isPublic ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
    return {
      bucket,
      path,
      token: signed.data.token,
      signedUrl: signed.data.signedUrl,
      publicUrl,
    };
  }
}
