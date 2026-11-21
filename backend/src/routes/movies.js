import { Router } from "express";
import {
  listMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getRewatchPlan,
} from "../services/movieService.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(listMovies());
});

router.post("/", (req, res) => {
  const movie = createMovie(req.body);
  res.status(201).json(movie);
});

router.patch("/:id", (req, res) => {
  const movie = updateMovie(req.params.id, req.body);
  res.json(movie);
});

router.delete("/:id", (req, res) => {
  deleteMovie(req.params.id);
  res.status(204).end();
});

router.get("/:id/rewatch-order", (req, res) => {
  res.json(getRewatchPlan(req.params.id));
});

export default router;