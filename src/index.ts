import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  MessagePayload,
  TextChannel,
  REST,
  Routes,
} from "discord.js";
import Fastify from "fastify";

let lastMessageIds: Record<string, string> = {};

(async () => {
  dotenv.config();

  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "hostname",
        },
      },
    },
    disableRequestLogging: true,
  });

  const rest = new REST({
    version: "10",
  }).setToken(process.env.TOKEN + "");

  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID + ""), {
    body: [
      {
        name: "lol",
        description: "lol",
      },
    ],
  });

  app.log.info("Updated Discord application commands");

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.on("interactionCreate", async (e) => {
    if (e.isChatInputCommand() && e.commandName === "lol") {
      await e.reply("i love spending money at hypnotic!");
    }
  });

  await client.login(process.env.TOKEN);
  app.log.info(`Connected to Discord`);

  app.post("/send", async (req, res) => {
    const body = req.body as {
      guildId: string;
      channelId: string;
      message: MessagePayload;
      overwrite?: boolean;
    };

    const guild = client.guilds.cache.get(body.guildId);

    if (!guild) {
      return;
    }

    const channel = guild.channels.cache.get(body.channelId) as TextChannel;

    if (!channel) {
      return;
    }

    let edited = false;

    const lastMessageId = lastMessageIds[channel.id];

    if (body.overwrite && lastMessageId) {
      try {
        await channel.messages.edit(lastMessageId, body.message);
        edited = true;
      } catch {
        //
      }
    }

    if (body.overwrite && !edited) {
      await channel.bulkDelete(100);
    }

    if (!edited) {
      const message = await channel.send(body.message);
      lastMessageIds[channel.id] = message.id;
    }
  });

  app.listen({ port: 6900, host: "0.0.0.0" });
})();
