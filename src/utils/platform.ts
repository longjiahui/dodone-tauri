import { imageProtocolNamePromise } from "@/store/system";

export async function getImageFileNameFromURL(url: string) {
  const protocolName = await imageProtocolNamePromise;
  // macos protocol://
  // windows //protocol.localhost/
  if (url.startsWith(`${protocolName}://`)) {
    return url.replace(`${protocolName}://`, "");
  }
  const regexp = /^https?:\/\/image\.localhost\//;
  if (regexp.test(url)) {
    return url.replace(regexp, "");
  }
  return url;
}
