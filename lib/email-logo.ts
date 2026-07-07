import fs from "fs";
import path from "path";

/** CID referenced in HTML as `cid:thelittlemart-logo@thelittlemart.com` (inline image). */
export const EMAIL_LOGO_CID = "thelittlemart-logo@thelittlemart.com";

export function getEmailLogoPath(): string {
  return path.join(process.cwd(), "public", "icons", "thelittlemart-logo-original.webp");
}

/** `src` value for branded email `<img>` tags (nodemailer inline attachment). */
export function getEmailLogoImgSrc(): string {
  return `cid:${EMAIL_LOGO_CID}`;
}

export function getEmailLogoAttachment(): {
  filename: string;
  path: string;
  cid: string;
  contentType: string;
} {
  return {
    filename: "thelittlemart-logo-original.png",
    path: getEmailLogoPath(),
    cid: EMAIL_LOGO_CID,
    contentType: "image/png",
  };
}

/** Read logo bytes (useful for transports requiring a Buffer attachment). */
export function readEmailLogoBuffer(): Buffer {
  return fs.readFileSync(getEmailLogoPath());
}
