import { Router, type IRouter } from "express";
import { App } from "octokit";
import {
  CreatePullRequestBody,
  CreatePullRequestResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const REPO_OWNER = "org-git-fked";
const REPO_NAME = "git-fked-x2";
const BASE_BRANCH = "main";

const router: IRouter = Router();

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  // Secrets pasted through UIs sometimes have literal \n instead of newlines
  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }

  // Keys pasted as a single line often have spaces where newlines should be.
  if (!key.includes("\n")) {
    const match = key.match(
      /^(-----BEGIN [A-Z ]+-----)([\s\S]+?)(-----END [A-Z ]+-----)$/,
    );
    if (match) {
      const header = match[1];
      const footer = match[3];
      const body = match[2].replace(/\s+/g, "");
      const lines = body.match(/.{1,64}/g) ?? [];
      key = `${header}\n${lines.join("\n")}\n${footer}\n`;
    }
  }

  return key;
}

async function getInstallationOctokit() {
  const appId = getRequiredEnv("GITHUB_APP_ID");
  const privateKey = normalizePrivateKey(
    getRequiredEnv("GITHUB_APP_PRIVATE_KEY"),
  );
  const installationId = Number(getRequiredEnv("GITHUB_APP_INSTALLATION_ID"));

  if (Number.isNaN(installationId) || installationId <= 0) {
    throw new Error("GITHUB_APP_INSTALLATION_ID must be a positive number");
  }

  const app = new App({ appId, privateKey });
  return app.getInstallationOctokit(installationId);
}

router.post("/pull-requests", async (req, res) => {
  const parsed = CreatePullRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please enter some text first." });
    return;
  }

  const { text, title } = parsed.data;

  try {
    const octokit = await getInstallationOctokit();

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "-")
      .slice(0, 19);
    const branch = `pr-creator/${timestamp}`;
    const fileName = `pr-creator-${timestamp}.txt`;

    const { data: baseRef } = await octokit.rest.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BASE_BRANCH}`,
    });

    await octokit.rest.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${branch}`,
      sha: baseRef.object.sha,
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: fileName,
      message: `Add ${fileName}`,
      content: Buffer.from(text, "utf-8").toString("base64"),
      branch,
    });

    const prTitle =
      title && title.trim().length > 0 ? title.trim() : `Add ${fileName}`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: prTitle,
      head: branch,
      base: BASE_BRANCH,
      body: "Created automatically by PR Creator.",
    });

    const data = CreatePullRequestResponse.parse({
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch,
      fileName,
    });

    res.status(201).json(data);
  } catch (err: unknown) {
    logger.error({ err }, "Failed to create pull request");

    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status: unknown }).status)
        : undefined;

    let message = "Failed to create the pull request on GitHub.";
    if (status === 401) {
      message =
        "GitHub rejected the App credentials. Please double-check the App ID and private key.";
    } else if (status === 404) {
      message =
        "GitHub could not find the repository or the App installation does not have access to it.";
    } else if (status === 403) {
      message =
        "The GitHub App does not have permission to do this. It needs Contents and Pull requests read & write access.";
    } else if (err instanceof Error && err.message.includes("environment variable")) {
      message = err.message;
    }

    res.status(502).json({ message });
  }
});

export default router;
