import dotenv from "dotenv";
dotenv.config();

export const imapAccounts = [
  {
    user: process.env.IMAP_USER_1 || "",
    password: process.env.IMAP_PASS_1 || "",
    host: process.env.IMAP_HOST_1 || "",
    port: 993,
    secure: true,
  },
  {
    user: process.env.IMAP_USER_2 || "",
    password: process.env.IMAP_PASS_2 || "",
    host: process.env.IMAP_HOST_2 || "",
    port: 993,
    secure: true,
  },
];
