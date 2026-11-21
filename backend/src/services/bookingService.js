import { ApiError } from "../errors.js";
import { getCinema } from "./cinemaService.js";
import { findMinBundles } from "../booking/minBundles.js";

const MAX_GROUP_SIZE = 10000;

// Query string theke groupSize: shudhu whole number (6abc, 6.5, faka, shob reject)
function parseGroupSize(raw) {
  if (typeof raw !== "string" || !/^\d+$/.test(raw.trim())) {
    throw new ApiError(400, "VALIDATION_ERROR", "groupSize must be a whole number between 1 and 10000");
  }
  const n = Number(raw);
  if (n < 1 || n > MAX_GROUP_SIZE) {
    throw new ApiError(400, "VALIDATION_ERROR", "groupSize must be a whole number between 1 and 10000");
  }
  return n;
}

export function getBookingQuote(cinemaId, rawGroupSize) {
  const cinema = getCinema(cinemaId); // na thakle 404
  const groupSize = parseGroupSize(rawGroupSize);

  const quote = findMinBundles(cinema.bundleSizes, groupSize);

  if (!quote) {
    return { possible: false, groupSize, totalBundles: 0, breakdown: [] };
  }
  return { possible: true, groupSize, ...quote };
}