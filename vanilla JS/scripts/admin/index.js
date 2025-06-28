// public/scripts/admin/index.js
import { initPageWithNav }    from "../core/init.js";
import { ADMIN_ONLY }         from "../config/roles.js";
import { showAdminView }      from "./ui/adminView.js";

// eagerly load features so they register any side-effects
import "./users/model.js";
import "./users/add.js";
import "./users/edit.js";
import "./permissions/model.js";
import "./permissions/controller.js";
import "./permissions/ui.js";
import "./integrations/aeries/ui.js";
import "./periods.js";

initPageWithNav({
  allowedRoles: ADMIN_ONLY,
  defaultView:  "admin",
  viewMap:      { admin: showAdminView }
});
