import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gmailRouter from "./gmail";
import calendarRouter from "./calendar";
import historyRouter from "./history";
import policyDocumentsRouter from "./policy-documents";
import { requireSchool } from "../middlewares/schoolContext";
import { onboardingRouter, schoolRouter, sessionRouter } from "./schools";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionRouter);
router.use(onboardingRouter);
router.use(requireSchool);
router.use(schoolRouter);
router.use(gmailRouter);
router.use(calendarRouter);
router.use(historyRouter);
router.use(policyDocumentsRouter);

export default router;
