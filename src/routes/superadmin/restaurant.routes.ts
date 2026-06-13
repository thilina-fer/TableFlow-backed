import { Router } from "express";
import { getRestaurants, getRestaurantById, deleteRestaurant, resetRestaurantPassword } from "../../controllers/superadmin/restaurant.controller";
import { superAdminProtect } from "../../middleware/superAdminAuth";

const router = Router();

router.use(superAdminProtect);

router.get("/", getRestaurants);
router.get("/:id", getRestaurantById);
router.delete("/:id", deleteRestaurant);
router.post("/:id/reset-password", resetRestaurantPassword);

export default router;
