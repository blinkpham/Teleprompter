import { TextDecoder, TextEncoder } from 'node:util';
import { NATIVE_BRIDGE_MAX_FRAME_BYTES } from '../shared/native-bridge';

export type JsonLineEvent =
  | { readonly kind: 'message'; readonly value: unknown }
  | { readonly kind: 'error'; readonly message: string };

const append = (left: Uint8Array<ArrayBufferLike>, right: Uint8Array<ArrayBufferLike>): Uint8Array<ArrayBufferLike> => {
  const result = new Uint8Array(left.byteLength + right.byteLength);
  result.set(left);
  result.set(right, left.byteLength);
  return result;
};

const newlineAt = (bytes: Uint8Array): number => bytes.indexOf(0x0a);

/** Byte-first framing keeps the limit and UTF-8 boundaries independent of chunking. */
export class JsonLinesDecoder {
  private readonly encoder = new TextEncoder();
  private buffer: Uint8Array<ArrayBufferLike> = new Uint8Array();
  private discardingOversizedLine = false;

  public push(chunk: Uint8Array | string): readonly JsonLineEvent[] {
    const bytes = typeof chunk === 'string' ? this.encoder.encode(chunk) : chunk;
    if (bytes.byteLength === 0) return [];
    this.buffer = append(this.buffer, bytes);
    return this.drain(false);
  }

  public end(): readonly JsonLineEvent[] {
    const events = [...this.drain(true)];
    return events;
  }

  private drain(atEnd: boolean): JsonLineEvent[] {
    const events: JsonLineEvent[] = [];
    while (true) {
      const newline = newlineAt(this.buffer);
      if (newline < 0) break;

      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      if (this.discardingOversizedLine) {
        this.discardingOversizedLine = false;
        continue;
      }
      if (line.byteLength > NATIVE_BRIDGE_MAX_FRAME_BYTES) {
        events.push({ kind: 'error', message: `JSON-lines input exceeds the ${NATIVE_BRIDGE_MAX_FRAME_BYTES}-byte line limit.` });
        continue;
      }
      const parsed = this.parseLine(line);
      if (parsed) events.push(parsed);
    }

    if (this.buffer.byteLength > NATIVE_BRIDGE_MAX_FRAME_BYTES) {
      events.push({ kind: 'error', message: `JSON-lines input exceeds the ${NATIVE_BRIDGE_MAX_FRAME_BYTES}-byte line limit.` });
      this.buffer = new Uint8Array();
      this.discardingOversizedLine = !atEnd;
    }
    if (atEnd && this.buffer.byteLength > 0) {
      events.push({ kind: 'error', message: 'Input ended with an unterminated JSON line.' });
      this.buffer = new Uint8Array();
      this.discardingOversizedLine = false;
    }
    return events;
  }

  private parseLine(bytes: Uint8Array): JsonLineEvent | undefined {
    let line: string;
    try {
      line = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return { kind: 'error', message: 'Input was not valid UTF-8.' };
    }
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (line.trim().length === 0) return undefined;
    try {
      return { kind: 'message', value: JSON.parse(line) as unknown };
    } catch {
      return { kind: 'error', message: 'Input contained malformed JSON.' };
    }
  }
}

export const encodeJsonLine = (value: unknown): string => `${JSON.stringify(value)}\n`;
