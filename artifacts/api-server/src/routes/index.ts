import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gmailRouter from "./gmail";
import calendarRouter from "./calendar";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gmailRouter);
router.use(calendarRouter);
router.use(historyRouter);

export default router;
