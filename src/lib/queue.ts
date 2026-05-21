// BullMQ-based job queues. One queue per AI workload kind keeps backpressure
// independent — e.g. a backlog of background-removal jobs shouldn't slow
// description generation.

import { Queue, Worker, type Processor, type QueueOptions, type WorkerOptions } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/lib/env";

let _conn: IORedis | null = null;

function connection() {
  if (!env.REDIS_URL) throw new Error("REDIS_URL not set");
  if (!_conn) _conn = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return _conn;
}

export type QueueName =
  | "ai.background_removal"
  | "ai.description"
  | "ai.translation"
  | "ai.pricing"
  | "ai.categorization"
  | "ai.lifestyle_photo"
  | "ai.search_intent"
  | "payments.refund";

const _queues = new Map<QueueName, Queue>();

export function getQueue<T = unknown>(name: QueueName, opts?: Partial<QueueOptions>): Queue<T> {
  let q = _queues.get(name) as Queue<T> | undefined;
  if (!q) {
    q = new Queue<T>(name, { connection: connection(), ...opts });
    _queues.set(name, q as Queue);
  }
  return q;
}

export function makeWorker<T = unknown>(
  name: QueueName,
  processor: Processor<T>,
  opts?: Partial<WorkerOptions>,
): Worker<T> {
  return new Worker<T>(name, processor, {
    connection: connection(),
    concurrency: 2,
    ...opts,
  });
}
