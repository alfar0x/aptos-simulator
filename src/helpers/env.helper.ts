import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const schema = z.object({
  RPC_URL: z.string(),
});

const env = schema.parse(process.env);

export { env }
