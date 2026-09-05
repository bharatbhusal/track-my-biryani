import { getAuthPayload } from "@/lib/auth";
import { getCurrentUserService } from "@/services/user.service";

async function getAuthUser() {
  const auth = await getAuthPayload();
  return getCurrentUserService(auth.id);
}

const userController = { getAuthUser };

export default userController;
