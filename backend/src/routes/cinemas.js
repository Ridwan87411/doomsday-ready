import { Router } from "express";
import { listCinemas, createCinema } from "../services/cinemaService.js";
import { getBookingQuote } from "../services/bookingService.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(listCinemas());
});

router.post("/", (req, res) => {
  const cinema = createCinema(req.body);
  res.status(201).json(cinema);
});

router.get("/:id/booking", (req, res) => {
  res.json(getBookingQuote(req.params.id, req.query.groupSize));
});

export default router;