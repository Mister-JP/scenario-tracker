/*********************************************************************
 *  Entry point.  Build header, then cards.
 *********************************************************************/

import { makeHeader } from "./header.js";
import { gridInit }   from "./layout.js";
import { initDialog } from "./dialog.js";

/* Build the UI in three steps */
makeHeader();   // adds <header> to <body>
gridInit();     // populates the cards + connector dots
initDialog();   // initializes the dialog system