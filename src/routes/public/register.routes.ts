import { Router } from "express";
import { registerRestaurant } from "../../controllers/restaurant.controller";
import { validateBody } from "../../middleware/validate.middleware";
import { restaurantRegistrationSchema } from "../../schemas/restaurant.schema";

const router = Router();

router.post("/restaurant", validateBody(restaurantRegistrationSchema), registerRestaurant);

export default router;
