import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gmailRouter from "./gmail";
import calendarRouter from "./calendar";
import historyRouter from "./history";
import policyDocumentsRouter from "./policy-documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gmailRouter);
router.use(calendarRouter);
router.use(historyRouter);
router.use(policyDocumentsRouter);

export default router;
