import config from "../../../../../reword.config";
import { rewordRoutes } from "@/reword/routes";

// reword's API. A route only under `npm run edit`: the `.reword.ts` extension
// is a page extension only there (see src/reword/next.ts).
export const { GET, POST } = rewordRoutes(config);
