import { initSequelize } from "../src/model.js";
import { seed } from "./seedFunction.js";

/* WARNING THIS WILL DROP THE CURRENT DATABASE */

initSequelize();
seed();
