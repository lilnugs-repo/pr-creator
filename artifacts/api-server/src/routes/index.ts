import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pullRequestsRouter from "./pullRequests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pullRequestsRouter);

export default router;
