import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  ParseUUIDPipe,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "@nestjs/passport";
import type { FastifyReply } from "fastify";
import { ChannelService } from "./channel.service";
import { ChannelChatService } from "./channel-chat.service";
import { z } from "zod";

const CreateChannelSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  color: z.string().max(7).optional(),
});

const UpdateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().max(7).optional(),
});

const AddAgentSchema = z.object({
  agentId: z.string().uuid(),
  role: z.enum(["primary", "sub"]).optional().default("primary"),
});

const ChatMessageSchema = z.object({
  message: z.string().min(1).max(32000),
});

@Controller("channels")
@UseGuards(AuthGuard("jwt"))
export class ChannelController {
  private readonly logger = new Logger(ChannelController.name);

  constructor(
    private readonly channelService: ChannelService,
    private readonly chatService: ChannelChatService,
  ) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async create(@Body() body: unknown, @Req() req: any) {
    const parsed = CreateChannelSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    return this.channelService.create(req.user.userId, parsed.data);
  }

  @Get()
  async list(@Req() req: any) {
    return this.channelService.list(req.user.userId);
  }

  @Get(":id")
  async findById(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    return this.channelService.findById(req.user.userId, id);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const parsed = UpdateChannelSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    return this.channelService.update(req.user.userId, id, parsed.data);
  }

  @Delete(":id")
  @HttpCode(204)
  async delete(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    return this.channelService.delete(req.user.userId, id);
  }

  // ─── Agent Management ───

  @Post(":id/agents")
  @HttpCode(201)
  async addAgent(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const parsed = AddAgentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    return this.channelService.addAgent(
      req.user.userId,
      id,
      parsed.data.agentId,
      parsed.data.role,
    );
  }

  @Delete(":id/agents/:agentId")
  @HttpCode(204)
  async removeAgent(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("agentId", ParseUUIDPipe) agentId: string,
    @Req() req: any,
  ) {
    return this.channelService.removeAgent(req.user.userId, id, agentId);
  }

  // ─── Messages (per user per agent room) ───

  @Get(":id/agents/:agentId/messages")
  async getMessages(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("agentId", ParseUUIDPipe) agentId: string,
    @Query("limit") limit: string,
    @Query("offset") offset: string,
    @Req() req: any,
  ) {
    return this.channelService.getMessages(
      req.user.userId,
      id,
      agentId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Delete(":id/agents/:agentId/messages")
  @HttpCode(204)
  async clearMessages(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("agentId", ParseUUIDPipe) agentId: string,
    @Req() req: any,
  ) {
    return this.channelService.clearMessages(req.user.userId, id, agentId);
  }

  // ─── Chat (SSE stream per user per agent room) ───

  @Post(":id/agents/:agentId/chat")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async chat(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("agentId", ParseUUIDPipe) agentId: string,
    @Body() body: unknown,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const parsed = ChatMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const userId = req.user.userId;

    // Setup SSE streaming
    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    req.raw.socket.setTimeout(180000);

    const heartbeat = setInterval(() => {
      if (!res.raw.destroyed) {
        res.raw.write(`: heartbeat\n\n`);
      }
    }, 15000);

    try {
      res.raw.write(`data: ${JSON.stringify({ status: "understanding" })}\n\n`);

      const result = await this.chatService.chat(
        userId,
        id,
        agentId,
        parsed.data.message,
      );

      // Send the full content as a single chunk
      const chunk = JSON.stringify({
        choices: [{ delta: { content: result.content } }],
      });
      res.raw.write(`data: ${chunk}\n\n`);
      res.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);

      clearInterval(heartbeat);
      res.raw.write("data: [DONE]\n\n");
      res.raw.end();
    } catch (error: any) {
      clearInterval(heartbeat);
      this.logger.error(`Channel chat error: ${error.message}`, error.stack);

      if (!res.raw.headersSent) {
        throw error;
      }

      res.raw.write(
        `data: ${JSON.stringify({ error: { message: error.message } })}\n\n`,
      );
      res.raw.end();
    }
  }
}
