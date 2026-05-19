import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
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
import { AgentRunService } from "./agent-run.service";
import { AgentChatSchema } from "./dto/agent-chat.dto";

@Controller("agents")
@UseGuards(AuthGuard("jwt"))
export class AgentRunController {
  private readonly logger = new Logger(AgentRunController.name);

  constructor(private readonly runService: AgentRunService) {}

  @Post(":id/chat")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async chat(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const parsed = AgentChatSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const { message, sessionId } = parsed.data;
    const userId = req.user.userId;

    // Setup SSE headers (frontend expects this format)
    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Increase timeout for long-running agent chats (3 minutes)
    req.raw.socket.setTimeout(180000);

    try {
      // Emit status
      res.raw.write(`data: ${JSON.stringify({ status: "understanding" })}\n\n`);

      // Use non-streaming chat (reliable, no stream issues)
      const result = await this.runService.chat(userId, id, message, sessionId);

      this.logger.log(
        `[Controller] chat completed | runId=${result.runId} contentLen=${result.message.content?.length ?? 0}`,
      );

      // Send the full content as a single chunk (frontend accumulates delta)
      const chunk = JSON.stringify({
        choices: [{ delta: { content: result.message.content } }],
      });
      res.raw.write(`data: ${chunk}\n\n`);

      // Send session info
      res.raw.write(
        `data: ${JSON.stringify({ sessionId: result.sessionId, runId: result.runId })}\n\n`,
      );

      res.raw.write("data: [DONE]\n\n");
      res.raw.end();
    } catch (error: any) {
      this.logger.error(`Agent chat error: ${error.message}`, error.stack);

      if (!res.raw.headersSent) {
        throw error;
      }

      res.raw.write(
        `data: ${JSON.stringify({ error: { message: error.message } })}\n\n`,
      );
      res.raw.write("data: [DONE]\n\n");
      res.raw.end();
    }
  }

  @Get(":id/runs")
  async listRuns(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    return this.runService.listRuns(req.user.userId, id);
  }

  @Get(":id/runs/:runId")
  async getRun(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("runId", ParseUUIDPipe) runId: string,
    @Req() req: any,
  ) {
    return this.runService.getRun(req.user.userId, id, runId);
  }

  @Delete(":id/runs/:runId")
  @HttpCode(204)
  async deleteRun(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("runId", ParseUUIDPipe) runId: string,
    @Req() req: any,
  ) {
    return this.runService.deleteRun(req.user.userId, id, runId);
  }
}
