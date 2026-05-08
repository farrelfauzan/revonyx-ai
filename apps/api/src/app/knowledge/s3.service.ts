import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>("S3_BUCKET");

    this.client = new S3Client({
      region: this.configService.getOrThrow<string>("S3_REGION"),
      endpoint: this.configService.get<string>("S3_ENDPOINT") || undefined,
      forcePathStyle: !!this.configService.get<string>("S3_ENDPOINT"), // needed for MinIO / local S3
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>("S3_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.getOrThrow<string>(
          "S3_SECRET_ACCESS_KEY",
        ),
      },
    });
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    this.logger.log(`Uploaded ${key} to S3`);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const stream = response.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    this.logger.log(`Deleted ${key} from S3`);
  }

  buildKey(userId: string, knowledgeBaseId: string, filename: string): string {
    return `knowledge/${userId}/${knowledgeBaseId}/${Date.now()}-${filename}`;
  }
}
