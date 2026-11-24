import { lookup as dnsLookup } from "node:dns/promises";
import { isIP, BlockList } from "node:net";

const blockList = new BlockList();
blockList.addSubnet("0.0.0.0", 8, "ipv4");
blockList.addSubnet("10.0.0.0", 8, "ipv4");
blockList.addSubnet("100.64.0.0", 10, "ipv4");
blockList.addSubnet("127.0.0.0", 8, "ipv4");
blockList.addSubnet("169.254.0.0", 16, "ipv4");
blockList.addSubnet("172.16.0.0", 12, "ipv4");
blockList.addSubnet("192.168.0.0", 16, "ipv4");
blockList.addSubnet("::", 128, "ipv6");
blockList.addAddress("::1", "ipv6");
blockList.addSubnet("fc00::", 7, "ipv6");
blockList.addSubnet("fe80::", 10, "ipv6");

const blockedHosts = new Set(["localhost", "metadata.google.internal", "metadata.google.com"]);

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export type LookupFn = (hostname: string) => Promise<string[]>;

export function isBlockedIp(ip: string): boolean {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped?.[1]) return isBlockedIp(mapped[1]);
  const version = isIP(ip);
  if (version === 0) return true;
  return blockList.check(ip, version === 4 ? "ipv4" : "ipv6");
}

export async function assertSafeUrl(raw: string, lookup: LookupFn = defaultLookup): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("The URL is not valid.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only public http and https URLs can be imported.");
  }
  if (url.username || url.password) throw new UnsafeUrlError("URLs with credentials are not allowed.");
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (blockedHosts.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UnsafeUrlError("That address is not public.");
  }
  if (isIP(hostname) && isBlockedIp(hostname)) throw new UnsafeUrlError("That address is not public.");
  if (!isIP(hostname)) {
    const addresses = await lookup(hostname);
    if (addresses.length === 0 || addresses.some((address) => isBlockedIp(address))) {
      throw new UnsafeUrlError("That address is not public.");
    }
  }
  return url;
}

async function defaultLookup(hostname: string): Promise<string[]> {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

export async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new UnsafeUrlError("The page is too large to import.");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(concat(chunks));
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}
